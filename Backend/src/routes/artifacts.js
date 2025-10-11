import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getArtifacts, getArtifactsSummary, getArtifact, updateArtifact, deleteArtifact } from '../controllers/artifacts.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// GET /api/projects/:projectId/artifacts/summary
router.get('/:projectId/artifacts/summary', getArtifactsSummary)

// GET /api/projects/:projectId/artifacts
router.get('/:projectId/artifacts', getArtifacts)

// GET /api/projects/:projectId/artifacts/:artifactId
router.get('/:projectId/artifacts/:artifactId', getArtifact)

// PUT /api/projects/:projectId/artifacts/:artifactId
router.put('/:projectId/artifacts/:artifactId', updateArtifact)

// DELETE /api/projects/:projectId/artifacts/:artifactId
router.delete('/:projectId/artifacts/:artifactId', deleteArtifact)

export default router