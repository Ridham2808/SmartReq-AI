import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/generate
router.post('/:projectId/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Generate artifacts (to be implemented)',
    projectId: req.params.projectId
  })
})

// GET /api/projects/:projectId/generate/status
router.get('/:projectId/generate/status', (req, res) => {
  res.json({
    success: true,
    message: 'Get generation status (to be implemented)',
    projectId: req.params.projectId,
    status: 'idle'
  })
})

export default router
