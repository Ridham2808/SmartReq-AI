import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/integrate/jira
router.post('/:projectId/integrate/jira', (req, res) => {
  res.json({
    success: true,
    message: 'Sync to Jira (to be implemented)',
    projectId: req.params.projectId
  })
})

// POST /api/projects/:projectId/integrate/jira/test
router.post('/:projectId/integrate/jira/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test Jira connection (to be implemented)',
    projectId: req.params.projectId
  })
})

// GET /api/projects/:projectId/integrate/status
router.get('/:projectId/integrate/status', (req, res) => {
  res.json({
    success: true,
    message: 'Get integration status (to be implemented)',
    projectId: req.params.projectId,
    status: 'not_configured'
  })
})

export default router
