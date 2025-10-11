import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { syncToJira, testJiraConnection, getIntegrationStatus } from '../controllers/integrate.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/integrate/jira
router.post('/:projectId/integrate/jira', syncToJira)

// POST /api/projects/:projectId/integrate/jira/test
router.post('/:projectId/integrate/jira/test', testJiraConnection)

// GET /api/projects/:projectId/integrate/status
router.get('/:projectId/integrate/status', getIntegrationStatus)

export default router