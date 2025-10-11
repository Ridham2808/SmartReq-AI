import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// POST /api/projects/[id]/artifacts/user-stories - Create new user story
export async function POST(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (hasExternalBackend()) {
      try {
        const data = await proxyJson('POST', `/api/projects/${pid}/artifacts/user-stories`, { content })
        return NextResponse.json(data)
      } catch (e) {
        // fall back
      }
    }

    const userStory = { id: Date.now(), projectId: pid, content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const artifacts = projectStore.artifacts.get(pid)
    artifacts.userStories = [userStory, ...(artifacts.userStories || [])]
    projectStore.artifacts.set(pid, artifacts)
    return NextResponse.json({ success: true, message: 'User story created successfully', data: userStory })
  } catch (error) {
    console.error('Error creating user story:', error)
    return NextResponse.json(
      { error: 'Failed to create user story' },
      { status: 500 }
    )
  }
}
