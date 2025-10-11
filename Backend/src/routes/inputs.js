import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { createInput, getInputs, getInput, deleteInput } from '../controllers/inputs.js'
import { uploadMiddleware } from '../utils/fileUtils.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects/:projectId/inputs
router.post('/:projectId/inputs', uploadMiddleware, createInput)

// GET /api/projects/:projectId/inputs
router.get('/:projectId/inputs', getInputs)

// GET /api/projects/:projectId/inputs/:inputId
router.get('/:projectId/inputs/:inputId', getInput)

// DELETE /api/projects/:projectId/inputs/:inputId
router.delete('/:projectId/inputs/:inputId', deleteInput)

export default router