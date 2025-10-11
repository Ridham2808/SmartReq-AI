'use client'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/hooks/useAuth'
import { useProjectsQuery, useCreateProject } from '@/hooks/useProjectsQuery'
import ProjectCard from '@/components/ProjectCard'
import AuthDebugger from '@/components/AuthDebugger'
import { Modal, Form, Input, Button } from 'antd'
import FloatingAssistant from '@/components/FloatingAssistant'
import OcrWidget from '@/components/OcrWidget'
import { useRouter } from 'next/navigation'

export default function DashboardPage(){
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useProjectsQuery()
  const createMutation = useCreateProject()
  const [open, setOpen] = useState(false)
  const [ocrOpen, setOcrOpen] = useState(false)
  const [form] = Form.useForm()

  // Debug auth state on dashboard load
  useEffect(() => {
    console.log('🏠 Dashboard loaded - Auth state:', {
      hasUser: !!user,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      userEmail: user?.email
    })
  }, [])

  useEffect(() => {
    if (!token) {
      console.log('❌ No token found - redirecting to login')
      router.replace('/auth/login')
    }
  }, [token, router])

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL, { auth: { token } })
    socket.on('project-updated', () => {})
    return () => socket.disconnect()
  }, [token])

  const projects = Array.isArray(data) ? data : []

  const onCreate = async () => {
    const values = await form.validateFields()
    await createMutation.mutateAsync(values)
    setOpen(false)
    form.resetFields()
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      {/* Temporary Debug Component */}
      <AuthDebugger />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your requirements projects</p>
        </div>
        <Button 
          type="primary" 
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto"
          size="large"
        >
          New Project
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : Array.isArray(projects) && projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">Create your first project to get started</p>
            <Button type="primary" onClick={() => setOpen(true)}>
              Create Project
            </Button>
            <p className="text-sm text-gray-400 mt-4">
              Data type: {typeof data}, Is Array: {Array.isArray(data) ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      )}

      {/* Tools section */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-3">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setOcrOpen(true)}
            className="group block rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h7l2 2h6a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 9h5M8 17h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">OCR File Extractor</h3>
                <p className="text-sm text-gray-600">Upload image or PDF, extract text using Tesseract.js.</p>
                <span className="inline-block mt-2 text-xs text-indigo-600 group-hover:underline">Open in-page</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <Modal title="Create Project" open={open} onOk={onCreate} onCancel={() => setOpen(false)} confirmLoading={createMutation.isPending}>
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <FloatingAssistant />
      <OcrWidget open={ocrOpen} onClose={() => setOcrOpen(false)} />
    </main>
  )
}


