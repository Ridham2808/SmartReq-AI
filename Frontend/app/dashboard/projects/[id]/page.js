'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react'
import { z } from 'zod'
import InputForm from '@/components/InputForm'
import VoiceRecorder from '@/components/VoiceRecorder'
import InputsList from '@/components/InputsList'
import ArtifactEditor from '@/components/ArtifactEditor'
import FlowChart from '@/components/FlowChart'
import ProcessFlowCard from '@/components/ProcessFlowCard'
import Chatbot from '@/components/Chatbot'
import OcrWidget from '@/components/OcrWidget'
import { api } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuth'
import { useGenerateMutation } from '@/hooks/useGenerateMutation'

const jiraSchema = z.object({
  url: z.string().url('Please enter a valid Jira URL'),
  apiKey: z.string().min(1, 'API key is required'),
  projectKey: z.string().min(1, 'Project key is required')
})

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id
  const search = useSearchParams()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [jiraForm, setJiraForm] = useState({ url: '', apiKey: '', projectKey: '' })
  const [isSubmittingJira, setIsSubmittingJira] = useState(false)

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/projects/${projectId}`)
      return data
    },
    enabled: !!projectId
  })

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put(`/api/projects/${projectId}`, payload)
      return data
    },
    onSuccess: async () => {
      toast.success('Project updated successfully')
      await queryClient.invalidateQueries(['project', projectId])
    },
    onError: (e) => toast.error(`Update failed: ${e.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/api/projects/${projectId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Project deleted')
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    },
    onError: (e) => toast.error(`Delete failed: ${e.message}`)
  })

  const { data: inputs, isLoading: inputsLoading } = useQuery({
    queryKey: ['project-inputs', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/projects/${projectId}/inputs`)
      return data
    },
    enabled: !!projectId
  })

  const { data: artifacts, isLoading: artifactsLoading } = useQuery({
    queryKey: ['project-artifacts', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/projects/${projectId}/artifacts`)
      return data
    },
    enabled: !!projectId
  })

  const generateMutation = useGenerateMutation(projectId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamStories, setStreamStories] = useState([])
  const [progressPercent, setProgressPercent] = useState(0)
  const [generatedFlow, setGeneratedFlow] = useState(null)
  const eventSourceRef = useRef(null)
  const token = useAuthStore(s => s.token)
  const [ocrOpen, setOcrOpen] = useState(false)

  const startGeneration = async () => {
    try {
      setIsGenerating(true)
      setProgressPercent(0)
      setStreamStories([])
      toast.info('Generating artifacts...')
      // Guard: require at least one input to avoid 400 from backend
      const hasInputs = (() => {
        try {
          if (Array.isArray(inputs)) return inputs.length > 0
          if (Array.isArray(inputs?.data)) return inputs.data.length > 0
          if (inputs?.success && Array.isArray(inputs?.data?.items)) return inputs.data.items.length > 0
        } catch (_) {}
        return Boolean(inputs)
      })()
      if (!hasInputs) {
        toast.error('Please add at least one input (text/voice/document) before generating.')
        setIsGenerating(false)
        return
      }
      const remoteBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://smartreq-ai-backend.onrender.com'
      const remoteUrl = `${remoteBase.replace(/\/$/, '')}/api/projects/${projectId}/generate`
      console.log('=== FRONTEND GENERATE START ===')
      console.log('Remote URL:', remoteUrl)
      console.log('Project ID:', projectId)
      console.log('Token:', token ? 'Present' : 'Missing')
      
      // Wire abort controller so timeout can cancel the request/reader
      const abortController = new AbortController()
      let timedOut = false
      // Always prefer backend AI SSE first for real AI output
      let resp = await fetch(remoteUrl, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({}),
        signal: abortController.signal
      })

      if (!resp.ok || !resp.body) {
        try {
          const text = await resp.text()
          let msg = `Generation failed (${resp.status})`
          try {
            const j = JSON.parse(text || '{}')
            msg = j?.message || msg
          } catch (_) {}
          if (resp.status === 400) {
            toast.error(`${msg}. Add an input to the backend project, then retry.`)
          } else {
            toast.error(msg)
          }
        } catch (_) {
          toast.error(`Generation failed (${resp.status})`)
        }
        setIsGenerating(false)
        return
      }

      // Fast path: if backend responded with JSON instead of SSE, handle immediately
      const contentType = resp.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        try {
          const json = await resp.json()
          if (json?.success) {
            setProgressPercent(100)
            toast.success('Generation complete!')
            await queryClient.invalidateQueries(['project-artifacts', projectId])
          } else {
            toast.error(json?.message || 'Generation failed')
          }
        } catch (_) {
          // If parsing fails, just finalize gracefully
          setProgressPercent(100)
        }
        setIsGenerating(false)
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Synthetic progress watchdog to avoid staying at 0%
      let lastProgressAt = Date.now()
      let syntheticInterval = null
      const startSynthetic = () => {
        if (syntheticInterval) return
        syntheticInterval = setInterval(() => {
          setProgressPercent(prev => {
            const next = Math.min(95, (typeof prev === 'number' ? prev : 0) + 5)
            return next
          })
        }, 1000)
      }
      const stopSynthetic = () => {
        if (syntheticInterval) {
          clearInterval(syntheticInterval)
          syntheticInterval = null
        }
      }

      // Absolute timeout: ensure completion within ~30s; report timeout (no mock)
      const absoluteTimeout = setTimeout(async () => {
        timedOut = true
        try { abortController.abort() } catch (_) {}
        stopSynthetic()
        toast.error('Generation timed out. Please try again.')
        setIsGenerating(false)
      }, 30000)

      const processChunk = async () => {
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const part of parts) {
          let evt = 'message'
          let dataLine = ''
          for (const line of part.split('\n')) {
            if (line.startsWith('event:')) evt = line.slice(6).trim()
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim()
          }
          if (!dataLine) continue
          if (evt === 'progress') {
            try {
              const data = JSON.parse(dataLine)
              if (typeof data.percent === 'number') {
                setProgressPercent(data.percent)
                lastProgressAt = Date.now()
              }
            } catch (_) {}
          } else if (evt === 'complete') {
            try {
              const data = JSON.parse(dataLine)
              console.log('=== FRONTEND COMPLETE ===')
              console.log('Complete data:', JSON.stringify(data, null, 2))
              setStreamStories(data.stories || [])
              setGeneratedFlow(data.flow || null)
              setProgressPercent(100)
              toast.success('Generation complete!')
              await queryClient.invalidateQueries(['project-artifacts', projectId])
            } catch (e) {
              console.error('Error parsing complete data:', e)
            }
            stopSynthetic()
            clearTimeout(absoluteTimeout)
            setIsGenerating(false)
          }
        }
      }

      ;(async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            await processChunk()
            // If no progress after 5s, start synthetic progress
            if (Date.now() - lastProgressAt > 5000) startSynthetic()
          }
        } catch (e) {
          if (!timedOut) toast.error('Generation error')
        } finally {
          stopSynthetic()
          clearTimeout(absoluteTimeout)
          setIsGenerating(false)
        }
      })()
    } catch (error) {
      toast.error(`Generation failed: ${error.message}`)
      setIsGenerating(false)
    }
  }

  const jiraMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post(`/api/projects/${projectId}/integrate/jira`, formData)
      return data
    },
    onSuccess: () => {
      toast.success('Jira connected successfully')
      onClose()
      setJiraForm({ url: '', apiKey: '', projectKey: '' })
    },
    onError: (error) => {
      toast.error(`Jira connection failed: ${error.message}`)
    }
  })

  useEffect(() => {
    if (search?.get('edit') === 'true') {
      setEditForm({ name: project?.name || '', description: project?.description || '' })
      setEditOpen(true)
    }
  }, [search, project?.name, project?.description])

  // Listen for saved flow updates from Chatbot and refresh artifacts
  useEffect(() => {
    const handler = async (e) => {
      if (!projectId) return
      await queryClient.invalidateQueries(['project-artifacts', projectId])
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('artifacts-updated', handler)
      return () => window.removeEventListener('artifacts-updated', handler)
    }
    return undefined
  }, [projectId, queryClient])

  const handleJiraSubmit = async (e) => {
    e.preventDefault()
    try {
      const validatedData = jiraSchema.parse(jiraForm)
      setIsSubmittingJira(true)
      await jiraMutation.mutateAsync(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message)
      }
    } finally {
      setIsSubmittingJira(false)
    }
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          <p className="text-gray-900 font-medium">Loading project...</p>
        </div>
      </div>
    )
  }

  if (projectError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600">{projectError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white py-8"
    >
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="border-2 border-black rounded-3xl p-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-black mb-2">
            {project?.name || `Project #${projectId}`}
          </h1>
          {project?.description && (
                <p className="text-gray-700 text-lg">{project.description}</p>
          )}
        </div>
            <div className="flex flex-wrap gap-3">
          <button 
            onClick={startGeneration}
            disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
          >
            {isGenerating && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            )}
                Generate AI Flow
          </button>
          <button
            onClick={() => setEditOpen(true)}
                className="px-6 py-3 rounded-xl border-2 border-black text-black font-semibold hover:bg-gray-100 transition-all duration-300"
          >
            Edit
          </button>
              <button
                onClick={onOpen}
                className="px-6 py-3 rounded-xl border-2 border-black text-black font-semibold hover:bg-gray-100 transition-all duration-300"
              >
                Connect Jira
              </button>
          <button
            onClick={() => deleteMutation.mutate()}
                className="px-6 py-3 rounded-xl border-2 border-red-600 text-red-600 font-semibold hover:bg-red-50 transition-all duration-300"
          >
            Delete
          </button>
        </div>
      </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
              className="border-2 border-black rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white text-xl font-bold">
                  1
                </div>
                <h2 className="text-2xl font-bold text-black">Inputs</h2>
              </div>
            <InputForm projectId={projectId} />
            <div className="mt-6">
              <InputsList projectId={projectId} inputs={inputs} />
            </div>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-black rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white text-xl font-bold">
                  2
                </div>
                <h2 className="text-2xl font-bold text-black">Voice Input</h2>
              </div>
            <VoiceRecorder projectId={projectId} />
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="border-2 border-black rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white text-xl font-bold">
                  3
                </div>
                <h2 className="text-2xl font-bold text-black">Artifacts</h2>
              </div>
            <ArtifactEditor 
              projectId={projectId} 
              artifacts={{
                ...artifacts,
                userStories: streamStories.length > 0 ? streamStories.map((story, idx) => ({ id: idx + 1, content: story })) : artifacts?.userStories || []
              }}
              isLoading={artifactsLoading}
            />
            </motion.div>
        </div>

          {/* Right Column */}
          <div className="space-y-8">
        <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border-2 border-black rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white text-xl font-bold">
                4
              </div>
              <h2 className="text-2xl font-bold text-black">Process Flow</h2>
            </div>
            {isGenerating && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Generating AI Flow…</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-black transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4 min-h-[500px]">
              <FlowChart 
                initialNodes={generatedFlow?.nodes || artifacts?.flow?.nodes || []} 
                initialEdges={generatedFlow?.edges || artifacts?.flow?.edges || []} 
                aiMermaidCode={artifacts?.process?.mermaid}
                projectId={projectId}
                onNodeClick={(node) => {
                  console.log('Node clicked:', node)
                }} 
              />
            </div>
          {artifacts?.process && (
            <div className="mt-6">
              <ProcessFlowCard 
                steps={artifacts.process.steps || []}
                textFlow={artifacts.process.textFlow}
                exampleStory={artifacts.process.exampleStory}
                mermaidCode={artifacts.process.mermaid}
              />
            </div>
          )}
        </motion.div>

            {/* AI Chatbot Section */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="border-2 border-black rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  🤖
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">AI Assistant</h2>
                  <p className="text-sm text-gray-600">Ask questions about your project</p>
                </div>
              </div>
              <Chatbot 
                projectId={projectId} 
                placeholder="Ask me anything about flows, user stories, or requirements..."
              />
            </motion.div>

            {/* Quick Tools */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="border-2 border-black rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  ✴
                </div>
                <h2 className="text-2xl font-bold text-black">Quick Tools</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setOcrOpen(true)}
                  className="rounded-xl border-2 border-black px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between text-left"
                >
                  <span>OCR Extractor</span>
                  <span className="text-sm text-gray-600">Open in-page</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" border="2px solid black">
          <ModalHeader className="text-2xl font-bold border-b-2 border-black">Edit Project</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate({
                    name: editForm.name?.trim() || project?.name,
                    description: editForm.description ?? ''
                  }, {
                    onSuccess: () => setEditOpen(false)
                  })
                }}
              className="space-y-6"
              >
                <div>
                <label className="block text-sm font-bold text-black mb-2">Project Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    required
                  />
                </div>
                <div>
                <label className="block text-sm font-bold text-black mb-2">Description</label>
                  <textarea
                  rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                  />
                </div>
              <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                  className="px-6 py-3 text-black border-2 border-black rounded-xl font-semibold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                  className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"
                  >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>

      {/* Jira Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" border="2px solid black">
          <ModalHeader className="text-2xl font-bold border-b-2 border-black">Connect to Jira</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleJiraSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Jira URL</label>
                <input
                  type="url"
                  value={jiraForm.url}
                  onChange={(e) => setJiraForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://yourcompany.atlassian.net"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-2">API Key</label>
                <input
                  type="password"
                  value={jiraForm.apiKey}
                  onChange={(e) => setJiraForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Your Jira API key"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-2">Project Key</label>
                <input
                  type="text"
                  value={jiraForm.projectKey}
                  onChange={(e) => setJiraForm(prev => ({ ...prev, projectKey: e.target.value }))}
                  placeholder="PROJ"
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-black border-2 border-black rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJira}
                  className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmittingJira && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  )}
                  Connect Now
                </button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
      <OcrWidget open={ocrOpen} onClose={() => setOcrOpen(false)} />
    </motion.main>
  )
}