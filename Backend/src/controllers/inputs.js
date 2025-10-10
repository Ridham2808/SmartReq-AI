// Inputs controller stubs

export const createInput = async (req, res) => {
  res.json({
    success: true,
    message: 'Create input (to be implemented)',
    data: { 
      id: 1, 
      projectId: req.params.projectId,
      type: req.body.type 
    }
  })
}

export const getInputs = async (req, res) => {
  res.json({
    success: true,
    message: 'Get all inputs (to be implemented)',
    projectId: req.params.projectId,
    data: []
  })
}

export const getInput = async (req, res) => {
  res.json({
    success: true,
    message: 'Get input by ID (to be implemented)',
    data: { 
      id: req.params.inputId,
      projectId: req.params.projectId,
      type: 'text'
    }
  })
}

export const deleteInput = async (req, res) => {
  res.json({
    success: true,
    message: 'Delete input (to be implemented)',
    inputId: req.params.inputId
  })
}
