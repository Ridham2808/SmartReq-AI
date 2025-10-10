// Generate controller stubs

export const generateArtifacts = async (req, res) => {
  res.json({
    success: true,
    message: 'Generate artifacts (to be implemented)',
    projectId: req.params.projectId,
    status: 'processing'
  })
}

export const getGenerationStatus = async (req, res) => {
  res.json({
    success: true,
    message: 'Get generation status (to be implemented)',
    projectId: req.params.projectId,
    status: 'idle',
    progress: 0
  })
}
