import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { syncToJira, testJiraConnection, getIntegrationStatus } from '../controllers/integrate.js'
import { validateRequest, jiraSyncSchema, jiraTestSchema } from '../middleware/validation.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/integrate/jira
router.post('/:projectId/integrate/jira', validateRequest(jiraSyncSchema), syncToJira)

// POST /api/projects/:projectId/integrate/jira/test
router.post('/:projectId/integrate/jira/test', validateRequest(jiraTestSchema), testJiraConnection)

// GET /api/projects/:projectId/integrate/status
router.get('/:projectId/integrate/status', getIntegrationStatus)

export default router