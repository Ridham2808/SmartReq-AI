"use client"
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

export default function FloatingAssistant(){
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [retryArmed, setRetryArmed] = useState(false)
  const listRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!open) return
    try { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) } catch(_){}
  }, [messages, open])

  const send = async (e) => {
    e?.preventDefault?.()
    const text = (input || '').trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/chat', { prompt: text })
      const reply = data?.data?.reply || 'No response.'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error occurred. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const startVoice = async () => {
    if (typeof window === 'undefined') return
    const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    if (!isSecure) {
      setMessages((m)=>[...m, { role:'assistant', content:'Voice needs HTTPS or localhost. Please use a secure origin.' }])
      return
    }

    // Prefer Chrome's webkitSpeechRecognition when available
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SR) {
      setMessages((m)=>[...m, { role:'assistant', content:'Voice not supported in this browser (try Chrome).' }])
      return
    }

    // Request mic permission to avoid immediate network/no-speech errors
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setMessages((m)=>[...m, { role:'assistant', content:'Mic permission denied. Please allow microphone access.' }])
      return
    }

    // Stop any existing session
    try { recognitionRef.current?.stop() } catch(_) {}

    const rec = new SR()
    rec.lang = (navigator.language || 'en-US')
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1
    setRetryArmed(true)

    rec.onstart = () => setRecording(true)
    rec.onaudioend = () => {}
    rec.onend = () => {
      setRecording(false)
      // auto-retry once for transient errors like network/no-speech
      if (retryArmed) {
        setRetryArmed(false)
        setTimeout(() => {
          try { rec.start(); setRecording(true) } catch(_) {}
        }, 250)
      }
    }
    rec.onerror = (e) => {
      const code = e?.error || 'unknown'
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setMessages((m)=>[...m, { role:'assistant', content:'Mic blocked. Allow microphone access in browser settings.' }])
      } else if (code === 'network' || code === 'no-speech') {
        setMessages((m)=>[...m, { role:'assistant', content:`Voice issue: ${code}. Retrying...` }])
        // onend handler will do a single retry
      } else {
        setMessages((m)=>[...m, { role:'assistant', content:`Voice error: ${code}` }])
      }
    }
    rec.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput((prev) => transcript)
    }

    recognitionRef.current = rec
    try { rec.start(); setRecording(true) } catch(_) {}
  }

  const stopVoice = () => {
    try { recognitionRef.current?.stop() } catch(_){}
    setRecording(false)
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v)=>!v)}
        aria-label="Assistant"
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition flex items-center justify-center"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-2 8l-4-4H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-1l-4 4z"/></svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-md rounded-2xl border-2 border-black bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between">
            <div className="font-semibold">AI Assistant</div>
            <div className="text-xs text-gray-500">Powered by your backend</div>
          </div>
          <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500">Ask anything about your project. Use the mic to dictate.</div>
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
          <div className="p-3 border-t-2 border-black">
            <form onSubmit={send} className="flex items-center gap-2">
              <button
                type="button"
                onClick={recording ? stopVoice : startVoice}
                className={`px-3 py-3 rounded-xl border-2 ${recording ? 'border-red-500 text-red-600' : 'border-black text-black'} hover:bg-gray-50`}
                title={recording ? 'Stop' : 'Voice input'}
              >
                {recording ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"/><path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0011 5.197V21a1 1 0 102 0v-3.803A7 7 0 0019 11z"/></svg>
                )}
              </button>
              <input
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                placeholder="Type your question…"
                className="flex-1 px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button type="submit" disabled={loading} className="px-4 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


