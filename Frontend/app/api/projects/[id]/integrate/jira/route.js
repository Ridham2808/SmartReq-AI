import { NextResponse } from 'next/server'

// POST /api/projects/[id]/integrate/jira - Integrate with Jira
export async function POST(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { url, apiKey, projectKey } = body

    // Validate required fields
    if (!url || !apiKey || !projectKey) {
      return NextResponse.json(
        { error: 'URL, API key, and project key are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Mock Jira integration - replace with actual Jira API calls
    const integration = {
      id: Date.now(),
      projectId: parseInt(id),
      jiraUrl: url,
      projectKey: projectKey,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString()
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      message: 'Jira integration successful',
      data: integration
    })
  } catch (error) {
    console.error('Error integrating with Jira:', error)
    return NextResponse.json(
      { error: 'Failed to integrate with Jira' },
      { status: 500 }
    )
  }
}
