import prisma from '../config/db.js'

export const syncToJira = async (req, res) => {
  try {
    const { projectId } = req.params
    const { jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey } = req.body
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId },
      include: { artifacts: { where: { type: 'story' } } }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Mock Jira sync - will be replaced with actual Jira API integration
    console.log('Syncing to Jira:', { jiraUrl, jiraProjectKey })
    const syncedCount = project.artifacts.length

    res.json({
      success: true,
      message: Successfully `synced ${syncedCount} user stories to Jira`,
      data: {
        synced: syncedCount,
        jiraProjectKey
      }
    })
  } catch (error) {
    console.error('Sync to Jira error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to sync to Jira',
      error: error.message
    })
  }
}

export const testJiraConnection = async (req, res) => {
  try {
    const { jiraUrl, jiraEmail, jiraApiToken } = req.body

    if (!jiraUrl || !jiraEmail || !jiraApiToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing Jira credentials'
      })
    }

    // Mock connection test - will be replaced with actual Jira API call
    console.log('Testing Jira connection:', jiraUrl)

    res.json({
      success: true,
      message: 'Jira connection successful',
      data: {
        connected: true,
        jiraUrl
      }
    })
  } catch (error) {
    console.error('Test Jira connection error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to test Jira connection',
      error: error.message
    })
  }
}

export const getIntegrationStatus = async (req, res) => {
  try {
    const { projectId } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Mock status - will be replaced with actual integration status check
    res.json({
      success: true,
      data: {
        status: 'not_configured',
        integrations: {
          jira: {
            configured: false,
            lastSync: null
          }
        }
      }
    })
  } catch (error) {
    console.error('Get integration status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status',
      error: error.message
    })
  }
}