'use client'
import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dropzone } from '@mantine/dropzone'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { internalApi as api } from '@/lib/api'

export default function InputForm({ projectId }) {
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const recognitionRef = useRef(null)
  const queryClient = useQueryClient()

  // Text input mutation
  const textMutation = useMutation({
    mutationFn: async (text) => {
      const { data } = await api.post(`/api/projects/${projectId}/inputs/text`, { text })
      return data
    },
    onSuccess: () => {
      toast.success('Text input saved successfully!')
      queryClient.invalidateQueries(['project-inputs', projectId])
    },
    onError: (error) => {
      toast.error(`Failed to save text: ${error.message}`)
    }
  })

  // File upload mutation
  const fileMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/api/projects/${projectId}/inputs/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })
      return data
    },
    onSuccess: () => {
      toast.success('File uploaded successfully!')
      setSelectedFile(null)
      setUploadProgress(0)
      queryClient.invalidateQueries(['project-inputs', projectId])
    },
    onError: (error) => {
      toast.error(`File upload failed: ${error.message}`)
      setUploadProgress(0)
    }
  })

  // Voice recording functions
  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onstart = () => {
      setIsRecording(true)
      toast.info('Recording started...')
    }

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
    } else {
          interimTranscript += transcript
        }
      }

      setTextInput(prev => prev + finalTranscript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      toast.error(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.start()
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textInput.trim()) {
      textMutation.mutate(textInput.trim())
      setTextInput('')
    }
  }

  const handleFileDrop = (files) => {
    const file = files[0]
    if (file) {
      setSelectedFile(file)
      const formData = new FormData()
      formData.append('file', file)
      fileMutation.mutate(formData)
    }
  }

  const handleFileReject = (files) => {
    toast.error('File rejected. Please check file type and size.')
  }

  return (
    <div className="space-y-6">
      {/* Text Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <label className="block text-sm font-medium text-gray-700">
          Paste or dictate your requirements
        </label>
        <div className="relative">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter your requirements here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-3 py-1 text-xs rounded-md font-medium ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Dictate'}
            </button>
          </div>
        </div>
        <button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || textMutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {textMutation.isPending && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          Save Text Input
        </button>
      </motion.div>

      {/* File Upload Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <label className="block text-sm font-medium text-gray-700">
          Upload documents or voice files
        </label>
        <Dropzone
          onDrop={handleFileDrop}
          onReject={handleFileReject}
          accept={[
            'text/plain',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/*'
          ]}
          maxSize={10 * 1024 * 1024} // 10MB
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        >
          <div className="space-y-2">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              {selectedFile ? (
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  {uploadProgress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">No file chosen</p>
                  <p className="text-xs">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">Supports: PDF, DOC, TXT, Audio files (max 10MB)</p>
                </div>
              )}
            </div>
          </div>
        </Dropzone>
      </motion.div>

      {/* Recording Status */}
      {isRecording && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-700 font-medium">Recording in progress...</span>
        </motion.div>
      )}
      </div>
  )
}
