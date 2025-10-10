// Projects controller stubs

export const createProject = async (req, res) => {
  res.json({
    success: true,
    message: 'Create project (to be implemented)',
    data: { id: 1, name: req.body.name }
  })
}

export const getProjects = async (req, res) => {
  res.json({
    success: true,
    message: 'Get all projects (to be implemented)',
    data: []
  })
}

export const getProject = async (req, res) => {
  res.json({
    success: true,
    message: 'Get project by ID (to be implemented)',
    data: { id: req.params.id, name: 'Mock Project' }
  })
}

export const updateProject = async (req, res) => {
  res.json({
    success: true,
    message: 'Update project (to be implemented)',
    data: { id: req.params.id }
  })
}

export const deleteProject = async (req, res) => {
  res.json({
    success: true,
    message: 'Delete project (to be implemented)'
  })
}
