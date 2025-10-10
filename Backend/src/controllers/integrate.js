// Integrate controller stubs

export const syncToJira = async (req, res) => {
  res.json({
    success: true,
    message: 'Sync to Jira (to be implemented)',
    projectId: req.params.projectId,
    synced: 0
  })
}

export const testJiraConnection = async (req, res) => {
  res.json({
    success: true,
    message: 'Test Jira connection (to be implemented)',
    connected: false
  })
}

export const getIntegrationStatus = async (req, res) => {
  res.json({
    success: true,
    message: 'Get integration status (to be implemented)',
    projectId: req.params.projectId,
    status: 'not_configured'
  })
}
