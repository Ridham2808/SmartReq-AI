import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { createProject, getProjects, getProject, updateProject, deleteProject } from '../controllers/projects.js'
import { validateRequest, createProjectSchema, updateProjectSchema } from '../middleware/validation.js'

const router = Router()

// All routes are protected
router.use(authenticateToken)

// POST /api/projects
router.post('/', validateRequest(createProjectSchema), createProject)

// GET /api/projects
router.get('/', getProjects)

// GET /api/projects/:id
router.get('/:id', getProject)

// PUT /api/projects/:id
router.put('/:id', validateRequest(updateProjectSchema), updateProject)

// DELETE /api/projects/:id
router.delete('/:id', deleteProject)

export default router