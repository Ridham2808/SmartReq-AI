/**
 * Professional Flowchart Generation Prompts
 * Ensures structured, swimlane-based workflow diagrams
 */

const SYSTEM_PROMPT = `You are a professional flowchart generator specializing in business process workflows.

CRITICAL RULES:
1. Always generate flowcharts with SWIMLANES (horizontal lanes for different roles/actors)
2. Use these node types:
   - Start/End: Rounded rectangles ([Start], [End])
   - Process: Rectangles [Action]
   - Decision: Diamonds {Question?}
   - Arrows: --> for flow direction
3. Minimum 20 steps between Start and End
4. Every decision must have Yes/No paths
5. All nodes must be connected (no floating boxes)
6. Use professional roles: Board Member, PM Committee, Project Manager, Financial Director, Team Lead, Developer, QA, etc.

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "actors": ["Role1", "Role2", "Role3"],
  "steps": [
    {"id": "1", "label": "Start", "type": "start", "actor": "Role1"},
    {"id": "2", "label": "Action", "type": "process", "actor": "Role1"},
    {"id": "3", "label": "Approved?", "type": "decision", "actor": "Role2"},
    {"id": "4", "label": "End", "type": "end", "actor": "Role3"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "2", "to": "3"},
    {"from": "3", "to": "4", "label": "Yes"},
    {"from": "3", "to": "4", "label": "No"}
  ],
  "mermaid": "flowchart LR\\nA([Start]) --> B[Action]\\nB --> C{Approved?}\\nC -- Yes --> D([End])\\nC -- No --> D"
}

IMPORTANT: Generate at least 20 steps. Use realistic business process steps.`;

const USER_PROMPT_TEMPLATE = (inputText) => `Generate a professional business process flowchart from this text:

"${inputText}"

Requirements:
- Minimum 20 connected steps
- Use swimlanes with appropriate roles/departments
- Include decision points (approvals, validations, checks)
- Start with a clear starting point
- End with a clear ending point
- Make it realistic and professional

Return ONLY the JSON object, no additional text.`;

const VALIDATION_PROMPT = `Review this flowchart structure and fix any issues:

ISSUES TO CHECK:
1. Does it have a Start node?
2. Does it have an End node?
3. Are all nodes connected?
4. Do all decisions have both Yes and No paths?
5. Are there at least 20 steps?
6. Are actors/roles clearly defined?

If any issues found, regenerate the flowchart with corrections.`;

/**
 * Default actors for common project types
 */
const DEFAULT_ACTORS = {
  fintech: ['Customer', 'System', 'Compliance Officer', 'Financial Manager', 'Support Team'],
  software: ['Product Owner', 'Developer', 'QA Engineer', 'DevOps', 'Project Manager'],
  hr: ['Employee', 'HR Manager', 'Department Head', 'Finance', 'IT Support'],
  general: ['Initiator', 'Reviewer', 'Approver', 'Executor', 'Validator']
};

/**
 * Generate structured flowchart from text using LLM
 */
async function generateStructuredFlowchart(inputText, projectType = 'general', llmFunction) {
  try {
    const userPrompt = USER_PROMPT_TEMPLATE(inputText);
    
    // Call LLM with system and user prompts
    const response = await llmFunction({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: userPrompt,
      temperature: 0.7,
      maxTokens: 2000
    });
    
    // Parse JSON response
    let flowchart = JSON.parse(response);
    
    // Validate and enhance
    flowchart = validateAndEnhanceFlowchart(flowchart, projectType);
    
    return flowchart;
  } catch (error) {
    console.error('Flowchart generation failed:', error);
    // Return fallback structure
    return generateFallbackFlowchart(projectType);
  }
}

/**
 * Validate and enhance flowchart structure
 */
function validateAndEnhanceFlowchart(flowchart, projectType) {
  // Ensure actors exist
  if (!flowchart.actors || flowchart.actors.length === 0) {
    flowchart.actors = DEFAULT_ACTORS[projectType] || DEFAULT_ACTORS.general;
  }
  
  // Ensure minimum steps
  if (!flowchart.steps || flowchart.steps.length < 20) {
    flowchart = expandFlowchartSteps(flowchart, 20);
  }
  
  // Ensure Start and End nodes
  const hasStart = flowchart.steps.some(s => s.type === 'start');
  const hasEnd = flowchart.steps.some(s => s.type === 'end');
  
  if (!hasStart) {
    flowchart.steps.unshift({
      id: 'start',
      label: 'Start',
      type: 'start',
      actor: flowchart.actors[0]
    });
  }
  
  if (!hasEnd) {
    flowchart.steps.push({
      id: 'end',
      label: 'End',
      type: 'end',
      actor: flowchart.actors[flowchart.actors.length - 1]
    });
  }
  
  // Validate edges
  if (!flowchart.edges || flowchart.edges.length === 0) {
    flowchart.edges = generateSequentialEdges(flowchart.steps);
  }
  
  // Generate Mermaid if missing
  if (!flowchart.mermaid) {
    flowchart.mermaid = generateMermaidDiagram(flowchart);
  }
  
  return flowchart;
}

/**
 * Expand flowchart to minimum steps
 */
function expandFlowchartSteps(flowchart, minSteps) {
  const steps = flowchart.steps || [];
  const actors = flowchart.actors || DEFAULT_ACTORS.general;
  
  // Extract existing process steps (exclude start/end)
  const processSteps = steps.filter(s => s.type === 'process' || s.type === 'decision');
  
  // Base actions to cycle through
  const baseActions = processSteps.length > 0 
    ? processSteps.map(s => s.label)
    : ['Review Request', 'Validate Data', 'Process Information', 'Execute Action', 'Verify Results'];
  
  const expandedSteps = [];
  let stepId = 1;
  
  // Add start
  expandedSteps.push({
    id: `${stepId++}`,
    label: 'Start',
    type: 'start',
    actor: actors[0]
  });
  
  // Add minimum process steps
  const neededSteps = minSteps - 2; // Exclude start and end
  for (let i = 0; i < neededSteps; i++) {
    const baseLabel = baseActions[i % baseActions.length];
    const suffix = i >= baseActions.length ? ` ${Math.floor(i / baseActions.length) + 1}` : '';
    const isDecision = (i + 1) % 5 === 0;
    const actor = actors[i % actors.length];
    
    expandedSteps.push({
      id: `${stepId++}`,
      label: isDecision ? `${baseLabel} Approved?` : `${baseLabel}${suffix}`,
      type: isDecision ? 'decision' : 'process',
      actor: actor
    });
  }
  
  // Add end
  expandedSteps.push({
    id: `${stepId}`,
    label: 'End',
    type: 'end',
    actor: actors[actors.length - 1]
  });
  
  flowchart.steps = expandedSteps;
  flowchart.edges = generateSequentialEdges(expandedSteps);
  
  return flowchart;
}

/**
 * Generate sequential edges between steps
 */
function generateSequentialEdges(steps) {
  const edges = [];
  
  for (let i = 0; i < steps.length - 1; i++) {
    const current = steps[i];
    const next = steps[i + 1];
    
    if (current.type === 'decision') {
      // Decision nodes have two paths
      edges.push({
        from: current.id,
        to: next.id,
        label: 'Yes'
      });
      // Also add a "No" path (could loop back or go to end)
      const endNode = steps.find(s => s.type === 'end');
      if (endNode && i < steps.length - 2) {
        edges.push({
          from: current.id,
          to: steps[i + 2]?.id || endNode.id,
          label: 'No'
        });
      }
    } else {
      edges.push({
        from: current.id,
        to: next.id
      });
    }
  }
  
  return edges;
}

/**
 * Generate Mermaid diagram syntax
 */
function generateMermaidDiagram(flowchart) {
  const lines = ['flowchart LR'];
  const { steps, edges } = flowchart;
  
  // Create node definitions
  const nodeMap = {};
  steps.forEach((step, idx) => {
    const nodeId = `N${idx}`;
    nodeMap[step.id] = nodeId;
    
    let nodeStr = '';
    if (step.type === 'start' || step.type === 'end') {
      nodeStr = `${nodeId}([${step.label}])`;
    } else if (step.type === 'decision') {
      nodeStr = `${nodeId}{${step.label}}`;
    } else {
      nodeStr = `${nodeId}[${step.label}]`;
    }
    
    lines.push(`  ${nodeStr}`);
  });
  
  // Create edges
  edges.forEach(edge => {
    const fromNode = nodeMap[edge.from];
    const toNode = nodeMap[edge.to];
    const label = edge.label ? ` -- ${edge.label} --> ` : ' --> ';
    lines.push(`  ${fromNode}${label}${toNode}`);
  });
  
  return lines.join('\n');
}

/**
 * Generate fallback flowchart when LLM fails
 */
function generateFallbackFlowchart(projectType = 'general') {
  const actors = DEFAULT_ACTORS[projectType] || DEFAULT_ACTORS.general;
  
  const flowchart = {
    actors: actors,
    steps: [],
    edges: []
  };
  
  return expandFlowchartSteps(flowchart, 20);
}

module.exports = {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  VALIDATION_PROMPT,
  DEFAULT_ACTORS,
  generateStructuredFlowchart,
  validateAndEnhanceFlowchart,
  expandFlowchartSteps,
  generateMermaidDiagram,
  generateFallbackFlowchart
};