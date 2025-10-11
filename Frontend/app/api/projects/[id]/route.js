import { NextResponse } from 'next/server'
import { ensureProject, projectStore } from '@/app/api/_db'

// GET /api/projects/[id] - Get project details
export async function GET(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const project = projectStore.projects.get(pid)

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    const body = await request.json()
    const updatedProject = { ...projectStore.projects.get(pid), ...body, updatedAt: new Date().toISOString() }
    projectStore.projects.set(pid, updatedProject)

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const pid = ensureProject(id)
    projectStore.projects.delete(pid)
    if (projectStore.inputs?.has(pid)) projectStore.inputs.delete(pid)
    if (projectStore.artifacts?.has(pid)) projectStore.artifacts.delete(pid)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}