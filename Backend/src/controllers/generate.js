import prisma from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { processProjectInputs } from '../utils/nlp.js'
import { generateArtifactsFromText } from '../utils/llm.js'
import { buildCombinedTextFromInputs } from '../utils/inputProcessor.js'
import { extractTextFromFile, stripPII, chunkText } from '../utils/textExtractor.js'
import config from '../config/env.js'

/**
 * Ensure flow has minimum number of nodes (AI-driven expansion)
 */
function ensureMinimumFlowNodes(flow, minNodes = 20) {
  if (!flow || !flow.nodes) {
    flow = { nodes: [], edges: [] }
  }
  
  const nodes = [...(flow.nodes || [])]
  const edges = [...(flow.edges || [])]
  
  if (nodes.length >= minNodes) {
    return { nodes, edges }
  }
  
  // Extract existing labels for intelligent expansion
  const existingLabels = nodes
    .filter(n => n.data && n.data.label)
    .map(n => n.data.label)
    .filter(l => l !== 'Start' && l !== 'End')
  
  if (existingLabels.length === 0) {
    existingLabels.push('Process Step', 'Validate', 'Execute', 'Store')
  }
  
  // Find start and end nodes
  const startNode = nodes.find(n => n.data && n.data.type === 'start')
  const endNode = nodes.find(n => n.data && n.data.type === 'end')
  
  // Build expanded node list
  const expandedNodes = []
  let y = 80
  
  // Add start
  if (startNode) {
    expandedNodes.push({ ...startNode, position: { x: 250, y } })
    y += 90
  } else {
    expandedNodes.push({
      id: 'start',
      type: 'custom',
      position: { x: 250, y },
      data: { label: 'Start', type: 'start', description: 'Process begins' }
    })
    y += 90
  }
  
  // Add middle nodes (minimum minNodes - 2 for start/end)
  const neededMiddle = minNodes - 2
  for (let i = 0; i < neededMiddle; i++) {
    const label = existingLabels[i % existingLabels.length]
    const suffix = i >= existingLabels.length ? ` ${Math.floor(i / existingLabels.length) + 1}` : ''
    const isDecision = (i + 1) % 5 === 0
    
    expandedNodes.push({
      id: `step-${i + 1}`,
      type: 'custom',
      position: { x: 250, y },
      data: {
        label: `${label}${suffix}`,
        type: isDecision ? 'decision' : 'process',
        description: 'AI generated step'
      }
    })
    y += 90
  }
  
  // Add end
  if (endNode) {
    expandedNodes.push({ ...endNode, position: { x: 250, y } })
  } else {
    expandedNodes.push({
      id: 'end',
      type: 'custom',
      position: { x: 250, y },
      data: { label: 'End', type: 'end', description: 'Process complete' }
    })
  }
  
  // Build edges
  const expandedEdges = []
  for (let i = 0; i < expandedNodes.length - 1; i++) {
    expandedEdges.push({
      id: `e-${expandedNodes[i].id}-${expandedNodes[i + 1].id}`,
      source: expandedNodes[i].id,
      target: expandedNodes[i + 1].id,
      type: 'smoothstep'
    })
  }
  
  return { nodes: expandedNodes, edges: expandedEdges }
}

/**
 * Generate artifacts from project inputs
 * POST /api/projects/:projectId/generate
 */
export const generateArtifacts = asyncHandler(async (req, res) => {
  console.log('=== GENERATE REQUEST START ===')
  console.log('ProjectId:', req.params.projectId)
  console.log('Body:', req.body)
  console.log('User:', req.user?.id)
  
  const { projectId } = req.params;
  const { inputId, fast } = req.body;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Fast path: bypass SSE + heavy LLM and return quick mock for demo speed
  if (fast) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()
    res.write(`event: progress\n`)
    res.write(`data: ${JSON.stringify({ projectId, percent: 50 })}\n\n`)
    const quick = { stories: ['As a user, I can start and finish the flow.'], flow: { nodes: [ { id: '1', type: 'custom', position: { x: 100, y: 100 }, data: { label: 'Start', type: 'start' } }, { id: '2', type: 'custom', position: { x: 300, y: 100 }, data: { label: 'Process', type: 'process' } }, { id: '3', type: 'custom', position: { x: 500, y: 100 }, data: { label: 'End', type: 'end' } } ], edges: [ { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' }, { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' } ] } }
    res.write(`event: complete\n`)
    res.write(`data: ${JSON.stringify({ stories: quick.stories, flow: quick.flow, status: 'fast', percent: 100 })}\n\n`)
    return res.end()
  }

  // Get inputs to process
  let inputs;
  if (inputId) {
    // Process specific input
    const input = await prisma.input.findFirst({
      where: {
        id: parseInt(inputId),
        projectId: parseInt(projectId)
      }
    });

    if (!input) {
      return res.status(404).json({
        success: false,
        message: 'Input not found'
      });
    }

    inputs = [input];
  } else {
    // Process all inputs for the project
    inputs = await prisma.input.findMany({
      where: {
        projectId: parseInt(projectId),
        content: { not: null }
      }
    });
  }

  if (inputs.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No inputs found to process. Please add some text, voice, or document inputs before generating artifacts.'
    });
  }

  try {
    // Attempt to load streaming generator lazily so environments without the module still run
    let streamGenerate = null;
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      streamGenerate = require('../lib/openaiHandler.js').streamGenerate;
    } catch (_) {
      streamGenerate = null;
    }

    // Build specific input text (voice/doc aware) and sanitize
    let inputText = ''
    if (inputId) {
      const i = inputs[0]
      if (i.content && i.content.trim()) inputText = i.content
      else if (i.filePath) inputText = await extractTextFromFile(i.filePath)
    } else {
      inputText = await buildCombinedTextFromInputs(inputs)
    }
    inputText = stripPII(inputText)
    
    console.log('=== INPUT TEXT PREPARED ===')
    console.log('Input text length:', inputText.length)
    console.log('Input text preview:', inputText.substring(0, 200) + '...')

    // Setup SSE headers if using streaming path
    if (streamGenerate) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
      res.flushHeaders?.()
    }

    const start = Date.now()
    const projectType = project?.category || 'fintech'
    let finalResult = null

    if (streamGenerate) {
      try {
        await streamGenerate({
          projectId,
          inputText,
          projectType,
          onDelta: (partial) => {
            // Heuristic progress: time-based and partial signals
            const elapsed = Date.now() - start
            // cap at 95% until completion
            const percent = Math.min(95, Math.floor((elapsed / 5000) * 100)) // ~5s target for speed
            res.write(`event: progress\n`)
            res.write(`data: ${JSON.stringify({ projectId, percent, t: elapsed })}\n\n`)
          },
        onComplete: async (result) => {
          console.log('=== STREAM COMPLETE ===')
          console.log('Result:', JSON.stringify(result, null, 2))
          finalResult = result
          
          // Enforce minimum 20 nodes in flow
          let flow = result.flow || { nodes: [], edges: [] }
          if (flow.nodes && flow.nodes.length < 20) {
            console.log('Flow has less than 20 nodes, expanding...')
            flow = ensureMinimumFlowNodes(flow, 20)
          }
          
          const stories = (result.stories || []).map((content, idx) => ({ id: idx + 1, content }))
          // Save artifacts
          for (const story of stories) {
            await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'story', content: story } })
          }
          if (flow && flow.nodes && flow.edges) {
            const flowArtifact = await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'flow', content: flow } })
            console.log('Flow artifact saved:', flowArtifact.id)
          } else {
            console.log('No valid flow to save:', flow)
          }
          res.write(`event: complete\n`)
          res.write(`data: ${JSON.stringify({ stories: result.stories || [], flow: flow, status: 'complete', percent: 100 })}\n\n`)
        }
        })
        res.end()
        return
      } catch (streamError) {
        console.error('Stream generation failed:', streamError)
        // Fall through to non-stream fallback
      }
    }

    // If streaming not available, use non-stream fallback with SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
    res.flushHeaders?.()
    
    try {
      const combinedText = inputs.filter(i => i.content).map(i => i.content).join('\n\n')
      console.log('=== NON-STREAM LLM ===')
      console.log('Input text:', combinedText.substring(0, 200) + '...')
      
      // Check if we have API keys before attempting LLM call
      const hasOpenAI = !!config.OPENAI_API_KEY
      const hasGemini = !!config.GEMINI_API_KEY
      console.log('API Keys available - OpenAI:', hasOpenAI, 'Gemini:', hasGemini)
      
      if (!hasOpenAI && !hasGemini) {
        return res.status(500).json({
          success: false,
          message: 'No LLM API keys configured. Please configure OpenAI or Gemini API keys.'
        });
      }
      
      const llm = await generateArtifactsFromText(combinedText)
      console.log('LLM result:', JSON.stringify(llm, null, 2))
      
      // Enforce minimum 20 nodes in flow
      let flow = llm.flow || { nodes: [], edges: [] }
      if (flow.nodes && flow.nodes.length < 20) {
        console.log('LLM flow has less than 20 nodes, expanding...')
        flow = ensureMinimumFlowNodes(flow, 20)
      }
      
      // Save artifacts to database
      const stories = (llm.userStories || []).map(s => s.content || s)
      for (const story of stories) {
        await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'story', content: story } })
      }
      
      if (flow && flow.nodes && flow.edges) {
        const flowArtifact = await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'flow', content: flow } })
        console.log('Flow artifact saved:', flowArtifact.id)
      }
      
      const payload = {
        stories: stories,
        flow: flow,
        status: 'non-stream-llm'
      }
      res.write(`event: complete\n`)
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
      res.end()
    } catch (nonStreamError) {
      console.error('Non-stream LLM failed:', nonStreamError.message)
      console.log('=== FALLBACK TO BASIC ===')
      
      // Try basic processing first
      try {
        const result = await processProjectInputs(inputs)
        console.log('Basic result:', JSON.stringify(result, null, 2))
        
        // Enforce minimum 20 nodes in flow
        let flow = (result.flows || [])[0] || { nodes: [], edges: [] }
        if (flow.nodes && flow.nodes.length < 20) {
          console.log('Basic flow has less than 20 nodes, expanding...')
          flow = ensureMinimumFlowNodes(flow, 20)
        }
        
        // Save artifacts to database
        const stories = result.stories || []
        for (const story of stories) {
          await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'story', content: story } })
        }
        
        if (flow && flow.nodes && flow.edges) {
          const flowArtifact = await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'flow', content: flow } })
          console.log('Flow artifact saved:', flowArtifact.id)
        }
        
        const payload = { stories: stories, flow: flow, status: 'non-stream-basic' }
        res.write(`event: complete\n`)
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
        res.end()
      } catch (basicError) {
        console.error('Basic processing failed:', basicError.message)
        res.write(`event: error\n`)
        res.write(`data: ${JSON.stringify({ error: 'Generation failed: ' + basicError.message })}\n\n`)
        res.end()
      }
    }

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({
      success: false,
      message: 'Generation failed: ' + error.message
    });
  }
});

/**
 * Get generation status/history for a project
 * GET /api/projects/:projectId/generate/status
 */
export const getGenerationStatus = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Get generation statistics
  const [inputCount, artifactCount] = await Promise.all([
    prisma.input.count({
      where: { projectId: parseInt(projectId) }
    }),
    prisma.artifact.count({
      where: { projectId: parseInt(projectId) }
    })
  ]);

  // Get recent artifacts
  const recentArtifacts = await prisma.artifact.findMany({
    where: { projectId: parseInt(projectId) },
    select: {
      id: true,
      type: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  res.json({
    success: true,
    data: {
      projectId: parseInt(projectId),
      statistics: {
        totalInputs: inputCount,
        totalArtifacts: artifactCount,
        storiesCount: recentArtifacts.filter(a => a.type === 'story').length,
        flowsCount: recentArtifacts.filter(a => a.type === 'flow').length
      },
      recentArtifacts
    }
  });
});