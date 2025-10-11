import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// POST /api/projects/[id]/inputs/text - Save text input
export async function POST(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const body = await request.json()
    const { text } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    // Try external backend first (align to backend inputs: expects type/content)
    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        const payload = { type: 'text', content: text }
        const data = await proxyJson('POST', `/api/projects/${pid}/inputs`, payload, authHeader ? { Authorization: authHeader } : {})
        return NextResponse.json(data)
      } catch (e) {
        // fall back to local store
      }
    }

    const textInput = { id: Date.now(), projectId: pid, content: text.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const inputs = projectStore.inputs.get(pid)
    inputs.textInputs.unshift(textInput)
    projectStore.inputs.set(pid, inputs)
    return NextResponse.json({ success: true, message: 'Text input saved successfully', data: textInput })
  } catch (error) {
    console.error('Error saving text input:', error)
    return NextResponse.json(
      { error: 'Failed to save text input' },
      { status: 500 }
    )
  }
}
