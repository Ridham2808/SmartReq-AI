import { Router } from 'express'
import authRoutes from './auth.js'
import projectRoutes from './projects.js'

const router = Router()

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'SmartReq AI API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile (Protected)'
      },
      projects: {
        'POST /api/projects': 'Create a new project (Protected)',
        'GET /api/projects': 'Get all projects (Protected)',
        'GET /api/projects/:id': 'Get project by ID (Protected)',
        'PUT /api/projects/:id': 'Update project (Protected)',
        'DELETE /api/projects/:id': 'Delete project (Protected)'
      }
    }
  })
})

// Mount route modules
router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)

export default router
