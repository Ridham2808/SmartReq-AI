export const generateFlowchartPrompt = (requirements) => {
  const prompt = `
You are a business analyst expert. Based on the following requirements, generate a process flow diagram.

Requirements:
${requirements}

Generate a flowchart with the following structure:
- Start node
- Process nodes for each major step
- Decision nodes for conditional logic
- End node

Return the flowchart in JSON format with:
{
  "nodes": [
    { "id": "1", "label": "Start", "type": "start" },
    { "id": "2", "label": "Process Name", "type": "process" },
    { "id": "3", "label": "Decision?", "type": "decision" },
    { "id": "4", "label": "End", "type": "end" }
  ],
  "edges": [
    { "source": "1", "target": "2" },
    { "source": "2", "target": "3" },
    { "source": "3", "target": "4", "label": "Yes" }
  ]
}

Focus on the main workflow and keep it clear and concise.
`
  
  return prompt.trim()
}

export const parseFlowchartResponse = (response) => {
  try {
    console.log('Parsing flowchart response...')
    
    // Try to parse JSON from response
    let flowchart
    
    if (typeof response === 'string') {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/json\n([\s\S]*?)\n/) || 
                       response.match(/\n([\s\S]*?)\n/)
      
      if (jsonMatch) {
        flowchart = JSON.parse(jsonMatch[1])
      } else {
        flowchart = JSON.parse(response)
      }
    } else {
      flowchart = response
    }
    
    // Validate structure
    if (!flowchart.nodes || !flowchart.edges) {
      throw new Error('Invalid flowchart structure')
    }
    
    return flowchart
  } catch (error) {
    console.error('Parse flowchart response error:', error)
    
    // Return default flowchart on error
    return {
      nodes: [
        { id: '1', label: 'Start', type: 'start' },
        { id: '2', label: 'Process', type: 'process' },
        { id: '3', label: 'End', type: 'end' }
      ],
      edges: [
        { source: '1', target: '2' },
        { source: '2', target: '3' }
      ]
    }
  }
}

export const validateFlowchart = (flowchart) => {
  const errors = []
  
  // Check if flowchart has required properties
  if (!flowchart.nodes || !Array.isArray(flowchart.nodes)) {
    errors.push('Flowchart must have a nodes array')
  }
  
  if (!flowchart.edges || !Array.isArray(flowchart.edges)) {
    errors.push('Flowchart must have an edges array')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  // Check if there's at least one start node
  const hasStart = flowchart.nodes.some(node => node.type === 'start')
  if (!hasStart) {
    errors.push('Flowchart must have at least one start node')
  }
  
  // Check if there's at least one end node
  const hasEnd = flowchart.nodes.some(node => node.type === 'end')
  if (!hasEnd) {
    errors.push('Flowchart must have at least one end node')
  }
  
  // Check if all nodes have required properties
  flowchart.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} is missing id`)
    }
    if (!node.label) {
      errors.push(`Node at index ${index} is missing label`)
    }
    if (!node.type) {
      errors.push(`Node at index ${index} is missing type`)
    }
  })
  
  // Check if all edges reference valid nodes
  const nodeIds = new Set(flowchart.nodes.map(n => n.id))
  flowchart.edges.forEach((edge, index) => {
    if (!edge.source) {
      errors.push(`Edge at index ${index} is missing source`)
    } else if (!nodeIds.has(edge.source)) {
      errors.push(`Edge at index ${index} references invalid source node: ${edge.source}`)
    }
    
    if (!edge.target) {
      errors.push(`Edge at index ${index} is missing target`)
    } else if (!nodeIds.has(edge.target)) {
      errors.push(`Edge at index ${index} references invalid target node: ${edge.target}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}