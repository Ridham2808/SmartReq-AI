import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'
import { hasExternalBackend, proxyJson } from '@/app/api/_proxy'

// PUT /api/projects/[id]/artifacts/user-stories/[storyId] - Update user story
export async function PUT(request, { params }) {
  try {
    const { id, storyId } = params
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
        const data = await proxyJson('PUT', `/api/projects/${pid}/artifacts/user-stories/${storyId}`, { content })
        return NextResponse.json(data)
      } catch (e) {
        // fall back
      }
    }

    const artifacts = projectStore.artifacts.get(pid)
    const stories = artifacts.userStories || []
    const idx = stories.findIndex(s => String(s.id) === String(storyId))
    const updated = { ...(stories[idx] || { id: Number(storyId), projectId: pid, createdAt: new Date().toISOString() }), content: content.trim(), updatedAt: new Date().toISOString() }
    if (idx >= 0) stories[idx] = updated; else stories.unshift(updated)
    artifacts.userStories = stories
    projectStore.artifacts.set(pid, artifacts)
    return NextResponse.json({ success: true, message: 'User story updated successfully', data: updated })
  } catch (error) {
    console.error('Error updating user story:', error)
    return NextResponse.json(
      { error: 'Failed to update user story' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/artifacts/user-stories/[storyId] - Delete user story
export async function DELETE(request, { params }) {
  try {
    const { id, storyId } = params
    const pid = ensureProject(id)
    if (hasExternalBackend()) {
      try {
        const data = await proxyJson('DELETE', `/api/projects/${pid}/artifacts/user-stories/${storyId}`)
        return NextResponse.json(data)
      } catch (e) {
        // fall back
      }
    }
    const artifacts = projectStore.artifacts.get(pid)
    artifacts.userStories = (artifacts.userStories || []).filter(s => String(s.id) !== String(storyId))
    projectStore.artifacts.set(pid, artifacts)
    return NextResponse.json({ success: true, message: 'User story deleted successfully', data: { id: Number(storyId), projectId: pid } })
  } catch (error) {
    console.error('Error deleting user story:', error)
    return NextResponse.json(
      { error: 'Failed to delete user story' },
      { status: 500 }
    )
  }
}
