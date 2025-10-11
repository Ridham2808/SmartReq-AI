"use client"
import { useEffect } from 'react'

export default function SupportChatButton(){
  useEffect(() => {
    const handler = (e) => {
      if (e.shiftKey && e.key === '/') {
        window.open('https://chat.openai.com', '_blank', 'noopener')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <button
      onClick={() => window.open('https://chat.openai.com', '_blank', 'noopener')}
      aria-label="Open AI Support"
      title="Open ChatGPT (Shift + /)"
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-2 8l-4-4H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4h-1l-4 4z" />
      </svg>
    </button>
  )
}


