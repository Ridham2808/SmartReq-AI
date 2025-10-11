import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// GET /api/projects/[id]/artifacts - Get project artifacts
export async function GET(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)

    if (hasExternalBackend()) {
      try {
        const authHeader = request.headers.get('authorization') || undefined
        const data = await proxyJson('GET', `/api/projects/${pid}/artifacts`, undefined, authHeader ? { Authorization: authHeader } : {})
        // Normalize backend artifacts -> { userStories, flow, process }
        const list = Array.isArray(data) ? data
          : (Array.isArray(data?.data) ? data.data
          : (Array.isArray(data?.data?.artifacts) ? data.data.artifacts : []))
        const userStories = list.filter(a => a.type === 'story').map((a, idx) => ({ id: a.id || idx + 1, content: a.content }))
        const flowArtifact = list.find(a => a.type === 'flow')
        const flow = flowArtifact?.content?.nodes ? flowArtifact.content : { nodes: [], edges: [] }
        const process = data?.process || null
        const normalized = { userStories, flow, process }
        projectStore.artifacts.set(pid, normalized)
        return NextResponse.json(normalized)
      } catch (e) {
        // fall back to local store
      }
    }

    const artifacts = projectStore.artifacts.get(pid)

    return NextResponse.json(artifacts)
  } catch (error) {
    console.error('Error fetching artifacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artifacts' },
      { status: 500 }
    )
  }
}
