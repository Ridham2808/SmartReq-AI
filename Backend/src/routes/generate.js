import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { generateArtifacts, getGenerationStatus } from '../controllers/generate.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/generate
router.post('/:projectId/generate', generateArtifacts)

// GET /api/projects/:projectId/generate/status
router.get('/:projectId/generate/status', getGenerationStatus)

export default router