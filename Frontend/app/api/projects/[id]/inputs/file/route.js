import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyFormData } from '@/app/api/_proxy'

// POST /api/projects/[id]/inputs/file - Upload file
export async function POST(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    // Try external backend first (align to backend inputs endpoint and file field)
    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        // Ensure expected multipart fields for backend: type and file
        if (!formData.get('type')) {
          const assumedType = file.type && file.type.startsWith('audio/') ? 'voice' : 'document'
          formData.set('type', assumedType)
        }
        const headers = authHeader ? { Authorization: authHeader } : {}
        const data = await proxyFormData('POST', `/api/projects/${pid}/inputs`, formData, headers)
        return NextResponse.json(data)
      } catch (e) {
        // fall back to local store
      }
    }

    const uploadedFile = { id: Date.now(), projectId: pid, name: file.name, type: file.type, size: file.size, uploadedAt: new Date().toISOString(), status: 'processed', content: null }
    const inputs = projectStore.inputs.get(pid)
    inputs.files.unshift(uploadedFile)
    projectStore.inputs.set(pid, inputs)
    return NextResponse.json({ success: true, message: 'File uploaded successfully', data: uploadedFile })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
