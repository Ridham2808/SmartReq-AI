import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// GET /api/projects/[id]/inputs - Get project inputs
export async function GET(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    // Try external backend first
    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        const data = await proxyJson('GET', `/api/projects/${pid}/inputs`, undefined, authHeader ? { Authorization: authHeader } : {})
        // Normalize backend shape -> { textInputs, files }
        const list = data?.data?.inputs || data?.inputs || []
        const textInputs = []
        const files = []
        for (const item of list) {
          const kind = item.type || ''
          if (kind === 'text') {
            textInputs.push({
              id: item.id,
              projectId: pid,
              content: item.content || '',
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
            })
          } else {
            files.push({
              id: item.id,
              projectId: pid,
              name: item.filePath ? item.filePath.split('/').pop() : 'file',
              type: kind,
              size: item.size || 0,
              uploadedAt: item.createdAt || new Date().toISOString(),
              status: 'processed',
              content: item.content || null
            })
          }
        }
        const normalized = { textInputs, files }
        projectStore.inputs.set(pid, normalized)
        return NextResponse.json(normalized)
      } catch (e) {
        // fall back to local store
      }
    }
    const inputs = projectStore.inputs.get(pid)

    return NextResponse.json(inputs)
  } catch (error) {
    console.error('Error fetching inputs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inputs' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/inputs?inputId=123
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const { searchParams } = new URL(request.url)
    const inputId = searchParams.get('inputId')
    if (!inputId) {
      return NextResponse.json({ error: 'inputId is required' }, { status: 400 })
    }

    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        const data = await proxyJson('DELETE', `/api/projects/${pid}/inputs/${inputId}`, undefined, authHeader ? { Authorization: authHeader } : {})
        return NextResponse.json(data || { success: true })
      } catch (e) {
        // fall back
      }
    }

    const inputs = projectStore.inputs.get(pid)
    inputs.textInputs = (inputs.textInputs || []).filter(i => String(i.id) !== String(inputId))
    inputs.files = (inputs.files || []).filter(i => String(i.id) !== String(inputId))
    projectStore.inputs.set(pid, inputs)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting input:', error)
    return NextResponse.json({ error: 'Failed to delete input' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/inputs?inputId=123
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const { searchParams } = new URL(request.url)
    const inputId = searchParams.get('inputId')
    const body = await request.json()
    const { content } = body || {}
    if (!inputId || !content || !String(content).trim()) {
      return NextResponse.json({ error: 'inputId and content are required' }, { status: 400 })
    }

    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        // Backend does not have an update; emulate by creating a text input and deleting old
        await proxyJson('POST', `/api/projects/${pid}/inputs`, { type: 'text', content }, authHeader ? { Authorization: authHeader } : {})
        await proxyJson('DELETE', `/api/projects/${pid}/inputs/${inputId}`, undefined, authHeader ? { Authorization: authHeader } : {})
        return NextResponse.json({ success: true })
      } catch (e) {
        // fall back
      }
    }

    const inputs = projectStore.inputs.get(pid)
    let updated = false
    inputs.textInputs = (inputs.textInputs || []).map(i => {
      if (String(i.id) === String(inputId)) {
        updated = true
        return { ...i, content: String(content).trim(), updatedAt: new Date().toISOString() }
      }
      return i
    })
    if (!updated) {
      // If not found, insert as new text input
      const newItem = { id: Number(inputId), projectId: pid, content: String(content).trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      inputs.textInputs = [newItem, ...(inputs.textInputs || [])]
    }
    projectStore.inputs.set(pid, inputs)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating input:', error)
    return NextResponse.json({ error: 'Failed to update input' }, { status: 500 })
  }
}
