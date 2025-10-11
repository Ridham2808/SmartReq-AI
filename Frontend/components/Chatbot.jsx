'use client'
import { useState, useRef, useMemo } from 'react'
import { api } from '@/lib/api'

export default function Chatbot({ placeholder = 'Ask anything about your flow…', projectId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const extractJson = (text) => {
    if (!text) return null
    // code fence ```json ... ```
    const fence = text.match(/```json\s*([\s\S]*?)```/i)
    if (fence && fence[1]) {
      try { return JSON.parse(fence[1]) } catch (_) {}
    }
    // any { ... }
    const brace = text.match(/\{[\s\S]*\}$/)
    if (brace) {
      try { return JSON.parse(brace[0]) } catch (_) {}
    }
    return null
  }

  const buildFlowFromChatJson = (obj) => {
    // Supported shapes: { flowchart: { start, steps[], end } } or { nodes, edges }
    if (obj?.nodes && obj?.edges) {
      // Assume already compatible with React Flow node ids as source/target
      const nodes = (obj.nodes || []).map((n, idx) => ({
        id: String(n.id || `n${idx+1}`),
        type: 'custom',
        position: n.position || { x: 120 + (idx*160), y: 120 },
        data: { label: n.label || n.action || `Step ${idx+1}`, type: n.type || 'process', description: n.details?.description }
      }))
      const edges = (obj.edges || []).map((e, idx) => ({
        id: String(e.id || `e${idx+1}`),
        source: String(e.from || e.source),
        target: String(e.to || e.target),
        type: 'smoothstep',
        label: e.label || ''
      }))
      return { nodes, edges }
    }
    const fc = obj?.flowchart
    if (!fc) return null
    const nodes = []
    const edges = []
    let counter = 1
    const idFor = () => `n${counter++}`

    const addNode = (label, t='process') => {
      const id = idFor()
      nodes.push({ id, type: 'custom', position: { x: 120 + (nodes.length*160), y: 120 }, data: { label, type: t } })
      return id
    }

    const startId = fc.start ? addNode(fc.start.action || 'Start', 'start') : addNode('Start', 'start')
    let lastId = startId
    const steps = Array.isArray(fc.steps) ? fc.steps : []
    steps.forEach((s) => {
      if (Array.isArray(s.options) && s.options.length > 0) {
        const decisionId = addNode(s.action || 'Decision', 'decision')
        edges.push({ id: `e${edges.length+1}`, source: lastId, target: decisionId, type: 'smoothstep' })
        s.options.forEach((opt, idx) => {
          const optId = addNode(opt.action || `Option ${idx+1}`, 'process')
          edges.push({ id: `e${edges.length+1}`, source: decisionId, target: optId, type: 'smoothstep', label: opt.label || opt.action || '' })
          if (opt.next) {
            const nextId = addNode(opt.next, 'process')
            edges.push({ id: `e${edges.length+1}`, source: optId, target: nextId, type: 'smoothstep' })
            lastId = nextId
          } else {
            lastId = optId
          }
        })
      } else {
        const nid = addNode(s.action || 'Step', 'process')
        edges.push({ id: `e${edges.length+1}`, source: lastId, target: nid, type: 'smoothstep' })
        if (s.next) {
          const nextId = addNode(s.next, 'process')
          edges.push({ id: `e${edges.length+1}`, source: nid, target: nextId, type: 'smoothstep' })
          lastId = nextId
        } else {
          lastId = nid
        }
      }
    })
    if (fc.end) {
      const endId = addNode(fc.end.action || 'End', 'end')
      edges.push({ id: `e${edges.length+1}`, source: lastId, target: endId, type: 'smoothstep' })
    }
    return { nodes, edges }
  }

  const lastAssistantJson = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.role === 'assistant') {
        const obj = extractJson(m.content)
        if (obj) return obj
      }
    }
    return null
  }, [messages])

  const canSaveFlow = Boolean(projectId && lastAssistantJson)

  const saveAsFlow = async () => {
    if (!canSaveFlow) return
    const mapped = buildFlowFromChatJson(lastAssistantJson)
    if (!mapped) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not parse flow JSON.' }])
      return
    }
    try {
      await api.put(`/api/projects/${projectId}/artifacts/flow`, { flow: mapped })
      setMessages((m) => [...m, { role: 'assistant', content: 'Flow saved successfully.' }])
      try { window.dispatchEvent(new CustomEvent('artifacts-updated', { detail: { projectId } })) } catch (_) {}
    } catch (_) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Failed to save flow.' }])
    }
  }

  const send = async (e) => {
    e?.preventDefault?.()
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/chat', { prompt: text })
      const reply = data?.data?.reply || 'No response.'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
      setTimeout(() => {
        try { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) } catch (_) {}
      }, 50)
    } catch (_) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error occurred. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full border-2 border-black rounded-2xl overflow-hidden">
      <div ref={listRef} className="h-64 overflow-y-auto bg-white p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">Ask about the flow, user stories, or next steps.</div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`text-sm p-2 rounded-xl border ${m.role === 'user' ? 'bg-gray-50 border-gray-300' : 'bg-black text-white border-black'}`}>
            <div className="font-semibold mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="text-sm p-2 rounded-xl border bg-black text-white border-black flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Thinking…</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border-t-2 border-black">
        <form onSubmit={send} className="flex items-center gap-2 flex-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          Send
        </button>
        </form>
        {canSaveFlow && (
          <button
            onClick={saveAsFlow}
            className="px-4 py-3 rounded-xl border-2 border-black text-black font-semibold hover:bg-gray-100"
            title="Save the latest assistant JSON as the project flow"
          >
            Use as Flow
          </button>
        )}
      </div>
    </div>
  )
}


