import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// POST /api/projects/[id]/generate - Generate artifacts for project
export async function POST(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    let payload = undefined
    try {
      payload = await request.json()
    } catch (_) {}

    // Helper: ensure at least 20 steps and nodes in the flow/process
    const ensureMinFlow = (normalized, minCount = 20) => {
      const result = { ...(normalized || {}) }
      result.flow = result.flow || { nodes: [], edges: [] }
      const nodes = Array.isArray(result.flow.nodes) ? [...result.flow.nodes] : []
      const edges = Array.isArray(result.flow.edges) ? [...result.flow.edges] : []
      const process = result.process || {}
      const steps = Array.isArray(process.steps) ? [...process.steps] : []

      // Derive a base label list from existing nodes/steps
      const baseLabels = []
      for (const n of nodes) {
        const label = n?.data?.label || n?.label || ''
        if (label) baseLabels.push(label)
      }
      for (const s of steps) {
        if (s?.title) baseLabels.push(s.title)
      }
      if (baseLabels.length === 0) baseLabels.push('Process Step')

      // Build up to minCount nodes as React Flow custom nodes
      const startId = nodes.find(n => n?.data?.type === 'start')?.id || 'start'
      let ensuredNodes = []
      let ensuredEdges = []

      // Always start and end
      ensuredNodes.push({
        id: startId,
        type: 'custom',
        position: { x: 100, y: 80 },
        data: { label: 'Start', type: 'start', description: 'Process begins' }
      })

      const neededMiddle = Math.max(minCount - 2, 0)
      for (let i = 0; i < neededMiddle; i++) {
        const idx = (i % baseLabels.length)
        const label = baseLabels[idx]
        const idStr = `p-${i + 1}`
        ensuredNodes.push({
          id: idStr,
          type: 'custom',
          position: { x: 100 + ((i % 2) * 220), y: 160 + i * 60 },
          data: { label: label || `Step ${i + 1}` , type: 'process', description: 'AI generated step' }
        })
      }

      ensuredNodes.push({
        id: 'end',
        type: 'custom',
        position: { x: 100, y: 160 + neededMiddle * 60 },
        data: { label: 'End', type: 'end', description: 'Process complete' }
      })

      // Chain edges linearly from start -> p-1 -> ... -> end
      let last = startId
      for (let i = 0; i < neededMiddle; i++) {
        const nid = `p-${i + 1}`
        ensuredEdges.push({ id: `e-${last}-${nid}`, source: last, target: nid, type: 'smoothstep' })
        last = nid
      }
      ensuredEdges.push({ id: `e-${last}-end`, source: last, target: 'end', type: 'smoothstep' })

      // Merge with any existing nodes/edges if they exceed the minimum
      const finalNodes = nodes.length >= minCount ? nodes : ensuredNodes
      const finalEdges = edges.length >= (minCount - 1) ? edges : ensuredEdges

      // Ensure process steps
      const finalSteps = steps.length >= minCount ? steps : (() => {
        const out = []
        out.push({ step: '🟢 1', title: 'Start', description: 'Process begins', example: 'User initiates flow' })
        for (let i = 0; i < neededMiddle; i++) {
          const n = i + 2 // step numbering after Start
          const label = baseLabels[i % baseLabels.length] || `Step ${n}`
          out.push({ step: `🔵 ${n}`, title: label, description: 'AI generated step', example: `Example for ${label}` })
        }
        out.push({ step: `🔴 ${neededMiddle + 2}`, title: 'End', description: 'Process complete', example: 'Flow finished' })
        return out
      })()

      result.flow = { nodes: finalNodes, edges: finalEdges }
      result.process = {
        ...(process || {}),
        steps: finalSteps,
        textFlow: (process?.textFlow && process.textFlow.length > 0)
          ? process.textFlow
          : finalSteps.map(s => s.title).join(' → '),
        mermaid: process?.mermaid || (() => {
          // generate simple mermaid from steps
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          const lines = ['flowchart LR']
          for (let i = 0; i < finalSteps.length; i++) {
            const a = letters[i % letters.length]
            const b = letters[(i + 1) % letters.length]
            lines.push(`${a}[${finalSteps[i].title}]${i < finalSteps.length - 1 ? ` --> ${b}[${finalSteps[i+1].title}]` : ''}`)
          }
          return lines.join('\n')
        })()
      }

      return result
    }
    
    // Mock generation process - replace with actual AI/processing logic
    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        const data = await proxyJson('POST', `/api/projects/${pid}/generate`, payload, authHeader ? { Authorization: authHeader } : {})
        // Normalize backend response into local store so UI can render immediately
        const artifactsList = data?.data?.artifacts || []
        const process = data?.data?.process || null
        const userStories = artifactsList.filter(a => a.type === 'story').map((a, idx) => ({ id: a.id || idx + 1, content: a.content }))
        const flowArtifact = artifactsList.find(a => a.type === 'flow')
        const flow = flowArtifact?.content?.nodes ? flowArtifact.content : { nodes: [], edges: [] }
        let normalized = { userStories, flow, process, requirements: [] }
        normalized = ensureMinFlow(normalized, 20)
        projectStore.artifacts.set(pid, normalized)
        return NextResponse.json({ success: true, message: 'Artifacts generated successfully', data: normalized })
      } catch (e) {
        // fall back to local generation
      }
    }

    const fast = Boolean(payload?.fast)
    // Build a local mock with at least 20 steps
    const minSteps = 20
    const middleCount = minSteps - 2
    const middleNodes = Array.from({ length: middleCount }).map((_, i) => ({
      id: `${i + 2}`,
      type: 'custom',
      position: { x: 300, y: 100 + i * 80 },
      data: { label: `Step ${i + 2}`, type: 'process', description: 'AI generated step' }
    }))
    const middleEdges = Array.from({ length: middleCount - 1 }).map((_, i) => ({
      id: `e${i + 2}-${i + 3}`,
      source: `${i + 2}`,
      target: `${i + 3}`,
      type: 'smoothstep'
    }))

    const generatedArtifacts = {
      userStories: [
        {
          id: 1,
          content: "As a user, I want to be able to log in to the system so that I can access my personal dashboard.",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          content: "As a user, I want to be able to create new projects so that I can organize my work.",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          content: "As a user, I want to be able to upload documents so that I can store my requirements.",
          createdAt: new Date().toISOString()
        }
      ],
      flow: {
        nodes: [
          {
            id: '1',
            type: 'custom',
            position: { x: 100, y: 100 },
            data: { label: 'Start', type: 'start', description: 'Process begins' }
          },
          ...middleNodes,
          {
            id: `${middleCount + 2}`,
            type: 'custom',
            position: { x: 100, y: 100 + (middleCount + 1) * 80 },
            data: { label: 'End', type: 'end', description: 'Process complete' }
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
          ...middleEdges,
          { id: `e${middleCount + 1}-${middleCount + 2}`, source: `${middleCount + 1}`, target: `${middleCount + 2}`, type: 'smoothstep' }
        ]
      },
      requirements: [
        "User authentication system",
        "Project management functionality",
        "Document upload capability",
        "Dashboard interface"
      ],
      process: {
        steps: (() => {
          const s = []
          s.push({ step: '🟢 1', title: 'Start', description: 'Process begins', example: 'User opens the application' })
          for (let i = 0; i < middleCount; i++) {
            const n = i + 2
            s.push({ step: `🔵 ${n}`, title: `Step ${n}`, description: 'AI generated step', example: `Example for Step ${n}` })
          }
          s.push({ step: `🔴 ${middleCount + 2}`, title: 'End', description: 'Process complete', example: 'Flow finished' })
          return s
        })(),
        textFlow: (() => {
          const labels = []
          labels.push('Start')
          for (let i = 0; i < middleCount; i++) labels.push(`Step ${i + 2}`)
          labels.push('End')
          return labels.join(' → ')
        })(),
        exampleStory: {
          title: 'Expense Tracking Automation',
          body: 'As a user,\nI want to upload expense receipts and daily logs,\nSo that I can automatically generate monthly summaries.',
          acceptanceCriteria: [
            'The system accepts PDF, DOC, TXT, and Audio files up to 10MB.',
            'Extracted content is summarized within 3 seconds.',
            'Generated story is editable before saving.'
          ]
        },
        mermaid: (() => {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          const parts = ['flowchart LR']
          const total = middleCount + 2
          for (let i = 0; i < total; i++) {
            const a = letters[i % letters.length]
            const b = letters[(i + 1) % letters.length]
            const labelA = i === 0 ? 'Start' : (i === total - 1 ? 'End' : `Step ${i + 1}`)
            const labelB = (i + 1 === total) ? '' : (i + 1 === total - 1 ? 'End' : `Step ${i + 2}`)
            parts.push(`${a}[${labelA}]${labelB ? ` --> ${b}[${labelB}]` : ''}`)
          }
          return parts.join('\n')
        })()
      },
      generatedAt: new Date().toISOString()
    }

    // Simulate processing time (fast mode ~0.5s, normal ~2s)
    await new Promise(resolve => setTimeout(resolve, fast ? 500 : 2000))

    // Persist to in-memory store (after enforcing min steps)
    const finalArtifacts = ensureMinFlow(generatedArtifacts, 20)
    projectStore.artifacts.set(pid, finalArtifacts)

    return NextResponse.json({
      success: true,
      message: 'Artifacts generated successfully',
      data: finalArtifacts
    })
  } catch (error) {
    console.error('Error generating artifacts:', error)
    return NextResponse.json(
      { error: 'Failed to generate artifacts' },
      { status: 500 }
    )
  }
}
