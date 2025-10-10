import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/inputs
router.post('/:projectId/inputs', (req, res) => {
  res.json({
    success: true,
    message: 'Create input (to be implemented)',
    projectId: req.params.projectId
  })
})

// GET /api/projects/:projectId/inputs
router.get('/:projectId/inputs', (req, res) => {
  res.json({
    success: true,
    message: 'Get all inputs (to be implemented)',
    projectId: req.params.projectId,
    data: []
  })
})

// GET /api/projects/:projectId/inputs/:inputId
router.get('/:projectId/inputs/:inputId', (req, res) => {
  res.json({
    success: true,
    message: 'Get input by ID (to be implemented)',
    projectId: req.params.projectId,
    inputId: req.params.inputId
  })
})

// DELETE /api/projects/:projectId/inputs/:inputId
router.delete('/:projectId/inputs/:inputId', (req, res) => {
  res.json({
    success: true,
    message: 'Delete input (to be implemented)',
    projectId: req.params.projectId,
    inputId: req.params.inputId
  })
})

export default router
