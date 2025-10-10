import { Router } from 'express'
import authRoutes from './auth.js'
import projectRoutes from './projects.js'
import inputRoutes from './inputs.js'
import artifactRoutes from './artifacts.js'
import generateRoutes from './generate.js'
import integrateRoutes from './integrate.js'
import chatRoutes from './chat.js'

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
      },
      inputs: {
        'POST /api/projects/:projectId/inputs': 'Create input (Protected)',
        'GET /api/projects/:projectId/inputs': 'Get all inputs (Protected)',
        'GET /api/projects/:projectId/inputs/:inputId': 'Get input by ID (Protected)',
        'DELETE /api/projects/:projectId/inputs/:inputId': 'Delete input (Protected)'
      },
      artifacts: {
        'GET /api/projects/:projectId/artifacts': 'Get all artifacts (Protected)',
        'GET /api/projects/:projectId/artifacts/summary': 'Get artifacts summary (Protected)',
        'GET /api/projects/:projectId/artifacts/:artifactId': 'Get artifact by ID (Protected)',
        'PUT /api/projects/:projectId/artifacts/:artifactId': 'Update artifact (Protected)',
        'DELETE /api/projects/:projectId/artifacts/:artifactId': 'Delete artifact (Protected)'
      },
      generate: {
        'POST /api/projects/:projectId/generate': 'Generate artifacts (Protected)',
        'GET /api/projects/:projectId/generate/status': 'Get generation status (Protected)'
      },
      integrate: {
        'POST /api/projects/:projectId/integrate/jira': 'Sync to Jira (Protected)',
        'POST /api/projects/:projectId/integrate/jira/test': 'Test Jira connection (Protected)',
        'GET /api/projects/:projectId/integrate/status': 'Get integration status (Protected)'
      },
      chat: {
        'POST /api/chat': 'Chat with AI assistant (Protected)'
      }
    }
  })
})

// Mount route modules
router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/projects', inputRoutes)
router.use('/projects', artifactRoutes)
router.use('/projects', generateRoutes)
router.use('/projects', integrateRoutes)
router.use('/chat', chatRoutes)

export default router
