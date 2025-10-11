'use client'
import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { internalApi as api } from '@/lib/api'

export default function VoiceRecorder({ projectId }){
  const [isRecording, setIsRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const recognitionRef = useRef(null)
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async (text) => {
      const { data } = await api.post(`/api/projects/${projectId}/inputs/text`, { text })
      return data
    },
    onSuccess: async () => {
      toast.success('Voice transcript saved')
      await queryClient.invalidateQueries(['project-inputs', projectId])
      setFinalText('')
      setInterim('')
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`)
  })

  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += transcript
        else interimChunk += transcript
      }
      if (finalChunk) setFinalText(prev => (prev ? prev + ' ' : '') + finalChunk.trim())
      setInterim(interimChunk)
    }
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      toast.error(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.start()
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const handleSave = () => {
    const text = [finalText, interim].filter(Boolean).join(' ').trim()
    if (!text) {
      toast.info('Nothing to save')
      return
    }
    saveMutation.mutate(text)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Voice Recorder</h2>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-3 py-1.5 text-sm rounded-md font-medium ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {isRecording ? 'Stop' : 'Start'}
        </button>
      </div>
      <div className="space-y-2">
        {finalText ? (
          <div className="text-gray-800 whitespace-pre-wrap">{finalText}</div>
        ) : (
          <div className="text-gray-400">No transcript yet</div>
        )}
        {interim ? (
          <div className="text-gray-500 italic">{interim}</div>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save as Text Input'}
        </button>
      </div>
    </div>
  )
}


