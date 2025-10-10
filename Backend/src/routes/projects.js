import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create project (to be implemented)'
  })
})

// GET /api/projects
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get all projects (to be implemented)',
    data: []
  })
})

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get project by ID (to be implemented)'
  })
})

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update project (to be implemented)'
  })
})

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Delete project (to be implemented)'
  })
})

export default router
