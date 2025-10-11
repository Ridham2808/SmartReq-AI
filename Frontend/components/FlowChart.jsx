'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow'
import dagre from 'dagre'
import debounce from 'lodash.debounce'
import io from 'socket.io-client'
import { motion } from 'framer-motion'
import mermaid from 'mermaid'
import 'reactflow/dist/style.css'
import { api } from '@/lib/api'

// Custom node types with different shapes
const CustomNode = ({ data, selected }) => {
  const isDecision = data.type === 'decision'
  const isStart = data.type === 'start'
  const isEnd = data.type === 'end'
  
  const bgColor = isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : isDecision ? 'bg-blue-600' : 'bg-gray-500'
  const borderColor = selected ? 'border-blue-500' : 'border-gray-300'
  
  if (isDecision) {
    // Diamond shape for decisions
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
        style={{ width: '140px', height: '140px' }}
      >
        <div 
          className={`absolute inset-0 transform rotate-45 ${bgColor} border-2 ${borderColor} shadow-lg`}
          style={{ width: '100px', height: '100px', top: '20px', left: '20px' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white font-semibold text-xs text-center px-2" style={{ maxWidth: '80px' }}>
            {data.label}
          </div>
        </div>
      </motion.div>
    )
  }
  
  // Rectangle shape for start/end/process
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-4 py-3 shadow-lg border-2 ${borderColor} ${
        isStart || isEnd ? 'rounded-full' : 'rounded-lg'
      } ${bgColor} text-white min-w-[120px]`}
    >
      <div className="text-center">
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
    </motion.div>
  )
}

const nodeTypes = {
  custom: CustomNode,
}

const defaultEdgeOptions = {
  animated: true,
  type: 'smoothstep',
  style: { stroke: '#6366f1', strokeWidth: 2 },
  labelStyle: { fill: '#374151', fontSize: 11 },
}

export default function FlowChart({ initialNodes = [], initialEdges = [], onNodeClick, projectId, onFlowChange, aiMermaidCode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMermaid, setShowMermaid] = useState(false)
  const [mermaidCode, setMermaidCode] = useState('')
  const socketRef = useState(null)[0]
  const mermaidRef = useRef(null)
  const [mermaidSvg, setMermaidSvg] = useState('')
  const containerRef = useRef(null)
  
  // Extract unique actors from nodes for swimlane rendering
  const actors = useMemo(() => {
    const actorSet = new Set()
    nodes.forEach(node => {
      if (node.data && node.data.actor) {
        actorSet.add(node.data.actor)
      }
    })
    return Array.from(actorSet)
  }, [nodes])

  // Normalize label to avoid duplicates like "Login 2", "Login-3"
  const normalizeLabel = useCallback((label) => {
    if (!label) return ''
    // remove trailing numbers or versioning suffixes
    const cleaned = String(label).replace(/\s*[-_#]*\d+$/i, '').trim()
    return cleaned || String(label)
  }, [])

  // Deduplicate nodes by normalized label + type + actor; remap edges
  const dedupeGraph = useCallback((rawNodes = [], rawEdges = []) => {
    const keyFor = (n) => `${normalizeLabel(n?.data?.label)}|${n?.data?.type || 'process'}|${n?.data?.actor || 'System'}`
    const keyToNode = new Map()
    const idToCanonical = new Map()

    const dedupedNodes = []
    for (const n of rawNodes) {
      const key = keyFor(n)
      if (!keyToNode.has(key)) {
        const normalized = {
          ...n,
          data: {
            ...n.data,
            label: normalizeLabel(n?.data?.label),
          },
        }
        keyToNode.set(key, normalized)
        dedupedNodes.push(normalized)
        idToCanonical.set(n.id, normalized.id)
      } else {
        // Map duplicate id to canonical id
        const existing = keyToNode.get(key)
        idToCanonical.set(n.id, existing.id)
      }
    }

    const edgeSet = new Set()
    const dedupedEdges = []
    for (const e of rawEdges) {
      const from = idToCanonical.get(e.source) || e.source
      const to = idToCanonical.get(e.target) || e.target
      if (from === to) continue // drop self loops after dedupe
      const sig = `${from}->${to}|${e.label || ''}`
      if (edgeSet.has(sig)) continue
      edgeSet.add(sig)
      dedupedEdges.push({ ...e, source: from, target: to })
    }
    return { nodes: dedupedNodes, edges: dedupedEdges }
  }, [normalizeLabel])

  // Compute swimlane layout (horizontal flow with vertical lanes)
  const layouted = useMemo(() => {
    // apply dedup before layout
    const { nodes: rawNodes, edges: rawEdges } = dedupeGraph(initialNodes || [], initialEdges || [])
    const g = new dagre.graphlib.Graph()
    // Use left-to-right layout for horizontal swimlanes
    g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 150 })
    g.setDefaultEdgeLabel(() => ({}))
    ;(rawNodes || []).forEach(n => g.setNode(n.id, { width: 140, height: 80 }))
    ;(rawEdges || []).forEach(e => g.setEdge(e.source, e.target))
    dagre.layout(g)
    
    const laidOutNodes = (rawNodes || []).map(n => {
      const p = g.node(n.id)
      return { ...n, position: p ? { x: p.x, y: p.y } : n.position }
    })
    return { nodes: laidOutNodes, edges: rawEdges }
  }, [initialNodes, initialEdges, dedupeGraph])

  // Update nodes and edges when props change
  useEffect(() => {
    if ((initialNodes || []).length > 0) {
      setNodes(layouted.nodes)
    }
  }, [initialNodes, setNodes, layouted])

  useEffect(() => {
    if ((initialEdges || []).length > 0) {
      setEdges(layouted.edges)
    }
  }, [initialEdges, setEdges, layouted])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClickHandler = useCallback((event, node) => {
    setSelectedNode(node)
    if (onNodeClick) {
      onNodeClick(node)
    }
  }, [onNodeClick])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Add new node function
  const addNode = useCallback((type = 'process') => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New ${type}`,
        type,
        description: type === 'start' ? 'Start of process' : 
                    type === 'end' ? 'End of process' : 
                    'Process step'
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes, setEdges])

  // Clear all nodes and edges
  const clearFlow = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
  }, [setNodes, setEdges])

  // Socket.io sync
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''
    if (!base || !projectId) return
    const s = io(base, { transports: ['websocket'] })
    s.emit('join-project', projectId)
    s.on('flow-update', (payload) => {
      if (payload?.projectId === projectId && payload?.flow) {
        setNodes(payload.flow.nodes || [])
        setEdges(payload.flow.edges || [])
      }
    })
    return () => {
      s.emit('leave-project', projectId)
      s.disconnect()
    }
  }, [projectId, setNodes, setEdges])

  // Debounced emit on change
  // Serialize nodes/edges to a backend-safe JSON (no functions or ReactFlow internals)
  const serializeFlow = useCallback((n, e) => {
    const safeNodes = (n || []).map((node) => {
      const entry = {
        id: String(node.id),
        label: String(node.data?.label || ''),
        type: String(node.data?.type || 'process')
      }
      if (node.data?.actor) entry.actor = String(node.data.actor)
      if (node.data?.description) entry.description = String(node.data.description)
      return entry
    })
    const safeEdges = (e || []).map((edge) => {
      const entry = {
        source: String(edge.source),
        target: String(edge.target)
      }
      if (edge.label) entry.label = String(edge.label)
      return entry
    })
    return { nodes: safeNodes, edges: safeEdges }
  }, [])

  const emitChange = useMemo(() => debounce(async (n, e) => {
    try {
      if (!projectId) return
      const flow = serializeFlow(n, e)
      await api.put(`/api/projects/${projectId}/artifacts/flow`, { flow })
    } catch (err) {
      try {
        const msg = err?.response?.data?.message || 'Failed to save flow'
        console.warn('Flow save error:', msg)
      } catch (_) {}
    }
  }, 400), [projectId, serializeFlow])

  useEffect(() => {
    emitChange(nodes, edges)
    if (onFlowChange) onFlowChange({ nodes, edges })
  }, [nodes, edges, emitChange, onFlowChange])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) {
      setIsFullscreen(prev => !prev)
      return
    }
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])
  
  const toggleMermaid = useCallback(() => {
    setShowMermaid(prev => !prev)
  }, [])
  
  // Generate Mermaid diagram with swimlane subgraphs
  const generatedMermaidCode = useMemo(() => {
    if (nodes.length === 0) return ''
    
    const lines = ['flowchart LR']
    const nodeMap = {}
    
    // Group nodes by actor
    const actorNodes = {}
    nodes.forEach((node, idx) => {
      const nodeId = `N${idx}`
      nodeMap[node.id] = nodeId
      const actor = node.data.actor || 'System'
      if (!actorNodes[actor]) {
        actorNodes[actor] = []
      }
      actorNodes[actor].push({ ...node, nodeId })
    })
    
    // Actor icons mapping
    const actorIcons = {
      'Initiator': '👤', 'User': '👤', 'Employee': '👤', 'Customer': '👤',
      'Reviewer': '👨‍💼', 'Manager': '👨‍💼', 'Project Manager': '👨‍💼',
      'Approver': '✅', 'Admin': '🛠️', 'Administrator': '🛠️',
      'Executor': '⚙️', 'Developer': '💻', 'Team': '👥',
      'Validator': '🔍', 'QA': '🔍', 'Tester': '🔍',
      'System': '🤖', 'Automation': '🤖', 'AI': '🤖',
      'Client': '💼', 'Stakeholder': '💼'
    }
    
    // Generate subgraph for each actor
    Object.entries(actorNodes).forEach(([actor, actorNodeList]) => {
      const icon = actorIcons[actor] || '📋'
      const actorId = actor.replace(/\s+/g, '_')
      lines.push(`\nsubgraph ${actorId}["${icon} ${actor}"]`)
      
      // Add nodes in this swimlane
      actorNodeList.forEach(node => {
        const label = node.data.label || 'Node'
        const type = node.data.type
        
        if (type === 'start' || type === 'end') {
          lines.push(`    ${node.nodeId}([${label}])`)
        } else if (type === 'decision') {
          lines.push(`    ${node.nodeId}{${label}}`)
        } else {
          lines.push(`    ${node.nodeId}[${label}]`)
        }
      })
      
      // Add edges within this swimlane
      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.source)
        const toNode = nodes.find(n => n.id === edge.target)
        if (fromNode && toNode) {
          const fromActor = fromNode.data.actor || 'System'
          const toActor = toNode.data.actor || 'System'
          if (fromActor === actor && toActor === actor) {
            const from = nodeMap[edge.source]
            const to = nodeMap[edge.target]
            const label = edge.label || ''
            const connector = label ? ` -- ${label} --> ` : ' --> '
            lines.push(`    ${from}${connector}${to}`)
          }
        }
      })
      
      lines.push('end')
    })
    
    // Add cross-swimlane connections
    lines.push('\n%% === Connections Across Swimlanes ===')
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.source)
      const toNode = nodes.find(n => n.id === edge.target)
      if (fromNode && toNode) {
        const fromActor = fromNode.data.actor || 'System'
        const toActor = toNode.data.actor || 'System'
        if (fromActor !== toActor) {
          const from = nodeMap[edge.source]
          const to = nodeMap[edge.target]
          const label = edge.label || ''
          const connector = label ? ` -- ${label} --> ` : ' --> '
          lines.push(`${from}${connector}${to}`)
        }
      }
    })
    
    return lines.join('\n')
  }, [nodes, edges])

  // Update mermaid code when AI response or generated code changes
  useEffect(() => {
    if (aiMermaidCode) {
      setMermaidCode(aiMermaidCode)
    } else if (generatedMermaidCode && !mermaidCode) {
      setMermaidCode(generatedMermaidCode)
    }
  }, [aiMermaidCode, generatedMermaidCode, mermaidCode])

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    })
  }, [])

  // Render Mermaid diagram
  useEffect(() => {
    if (showMermaid && mermaidCode && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          const id = `mermaid-${Date.now()}`
          const { svg } = await mermaid.render(id, mermaidCode)
          setMermaidSvg(svg)
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          setMermaidSvg('<div class="text-red-500 p-4">Error rendering diagram. Please check your Mermaid syntax.</div>')
        }
      }
      renderDiagram()
    }
  }, [showMermaid, mermaidCode])

  return (
    <div ref={containerRef} className={`relative ${
      isFullscreen 
        ? 'fixed inset-0 z-[9999] bg-white' 
        : 'h-[600px] w-full border border-gray-200 rounded-lg'
    } overflow-hidden`}>
      {/* Swimlane backgrounds */}
      {actors.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {actors.map((actor, idx) => (
            <div
              key={actor}
              className="absolute border-b border-gray-300"
              style={{
                top: `${idx * 150}px`,
                left: 0,
                right: 0,
                height: '150px',
                backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff'
              }}
            >
              <div className="absolute left-4 top-4 font-semibold text-gray-700 text-sm bg-white px-2 py-1 rounded shadow-sm">
                {actor}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        attributionPosition="bottom-left"
        className="z-10"
      >
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'input') return '#0041d0'
            if (n.type === 'output') return '#ff0072'
            return '#1a192b'
          }}
          nodeColor={(n) => {
            if (n.type === 'input') return '#0041d0'
            if (n.type === 'output') return '#ff0072'
            return '#eee'
          }}
          nodeBorderRadius={2}
        />
        <Background color="#f1f5f9" gap={16} />
        
        {/* Control Panel */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors font-semibold"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '⊗ Exit' : '⛶ Fullscreen'}
            </button>
            <button
              onClick={toggleMermaid}
              className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors font-semibold"
              title="View Mermaid Diagram"
            >
              {showMermaid ? '📊 Hide' : '📊 Mermaid'}
            </button>
            <button
              onClick={() => addNode('start')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              + Start
            </button>
            <button
              onClick={() => addNode('process')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              + Process
            </button>
            <button
              onClick={() => addNode('decision')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              ◆ Decision
            </button>
            <button
              onClick={() => addNode('end')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              + End
            </button>
            {selectedNode && (
              <button
                onClick={deleteSelectedNode}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={clearFlow}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </Panel>

        {/* Node Info Panel */}
        {selectedNode && (
          <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Node Details</h4>
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Type:</span> {selectedNode.data.type}</div>
                <div><span className="font-medium">Label:</span> {selectedNode.data.label}</div>
                {selectedNode.data.description && (
                  <div><span className="font-medium">Description:</span> {selectedNode.data.description}</div>
                )}
                <div><span className="font-medium">Position:</span> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Instructions */}
      {!showMermaid && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600 z-20">
          <div className="space-y-1">
            <div>• Click and drag to move nodes</div>
            <div>• Drag from node edge to create connections</div>
            <div>• Click node to select and view details</div>
            <div>• Use controls to add/delete nodes</div>
          </div>
        </div>
      )}
      
      {/* Mermaid Editor Modal */}
      {showMermaid && (
        <div className="absolute inset-0 bg-white z-30 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900">🎨 Mermaid Flowchart Editor</h3>
            <button
              onClick={toggleMermaid}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Panel */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">📝 Code Editor</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mermaidCode)
                      alert('✅ Copied to clipboard!')
                    }}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                  >
                    📋 Copy
                  </button>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(mermaidCode)}`}
                    download="flowchart.mmd"
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold inline-block"
                  >
                    💾 Download
                  </a>
                </div>
              </div>
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Mermaid code here..."
                spellCheck={false}
              />
            </div>
            
            {/* Preview Panel */}
            <div className="w-1/2 flex flex-col bg-gray-50">
              <div className="p-3 bg-gray-100 border-b border-gray-200">
                <h4 className="font-semibold text-gray-700">👁️ Live Preview</h4>
              </div>
              <div 
                ref={mermaidRef}
                className="flex-1 p-6 overflow-auto flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              />
            </div>
          </div>
          
          {/* Help Section */}
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips:</h4>
                <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
                  <div>• Edit code on the left to see live preview</div>
                  <div>• Use <code className="bg-blue-100 px-1 rounded">flowchart LR</code> for left-to-right</div>
                  <div>• Rectangle: <code className="bg-blue-100 px-1 rounded">[Text]</code></div>
                  <div>• Diamond: <code className="bg-blue-100 px-1 rounded">{'{Text}'}</code></div>
                  <div>• Circle: <code className="bg-blue-100 px-1 rounded">((Text))</code></div>
                  <div>• Arrow: <code className="bg-blue-100 px-1 rounded">A --&gt; B</code></div>
                </div>
              </div>
              <a
                href="https://mermaid.js.org/syntax/flowchart.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm whitespace-nowrap"
              >
                📚 Full Docs
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}