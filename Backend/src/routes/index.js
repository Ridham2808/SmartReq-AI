import { Router } from 'express'
import authRoutes from './auth.js'
import projectRoutes from './projects.js'
import inputRoutes from './inputs.js'
import artifactRoutes from './artifacts.js'
import generateRoutes from './generate.js'
import integrateRoutes from './integrate.js'
import chatRoutes from './chat.js'
import { logger } from '../middleware/errorHandler.js'
import { checkEmailServiceHealth, testEmailConfiguration } from '../utils/emailService.js'
import prisma from '../config/db.js'
import { config } from '../config/env.js'

const router = Router()

// API versioning middleware
router.use((req, res, next) => {
  // Add API version to response headers
  res.setHeader('API-Version', 'v1');
  res.setHeader('API-Documentation', '/api/docs');
  next();
});

// Enhanced health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      success: true,
      message: 'SmartReq AI API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      apiVersion: 'v1',
      environment: config.NODE_ENV,
      services: {}
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = {
        status: 'healthy',
        message: 'Database connection successful'
      };
    } catch (error) {
      healthCheck.services.database = {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message
      };
    }

    // Check email service
    try {
      const emailHealth = await checkEmailServiceHealth();
      healthCheck.services.email = emailHealth;
    } catch (error) {
      healthCheck.services.email = {
        status: 'unhealthy',
        message: 'Email service check failed',
        error: error.message
      };
    }

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'SmartReq AI API Documentation',
    version: '1.0.0',
    apiVersion: 'v1',
    baseUrl: '/api',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile (Protected)'
      },
      projects: {
        'POST /api/projects': 'Create a new project (Protected)',
        'GET /api/projects': 'Get all projects for current user (Protected)',
        'GET /api/projects/:id': 'Get project by ID (Protected)',
        'PUT /api/projects/:id': 'Update project (Protected)',
        'DELETE /api/projects/:id': 'Delete project (Protected)'
      },
      inputs: {
        'POST /api/projects/:projectId/inputs': 'Create input (text/voice/document) (Protected)',
        'GET /api/projects/:projectId/inputs': 'Get all inputs for project (Protected)',
        'GET /api/projects/:projectId/inputs/:inputId': 'Get input by ID (Protected)',
        'DELETE /api/projects/:projectId/inputs/:inputId': 'Delete input (Protected)'
      },
      generate: {
        'POST /api/projects/:projectId/generate': 'Generate artifacts from inputs (Protected)',
        'GET /api/projects/:projectId/generate/status': 'Get generation status (Protected)'
      },
      artifacts: {
        'GET /api/projects/:projectId/artifacts': 'Get all artifacts for project (Protected)',
        'GET /api/projects/:projectId/artifacts/summary': 'Get artifacts summary (Protected)',
        'GET /api/projects/:projectId/artifacts/:artifactId': 'Get artifact by ID (Protected)',
        'PUT /api/projects/:projectId/artifacts/:artifactId': 'Update artifact (Protected)',
        'DELETE /api/projects/:projectId/artifacts/:artifactId': 'Delete artifact (Protected)',
        'PUT /api/projects/:projectId/artifacts/flow': 'Update process flow (Real-time)'
      },
      integrate: {
        'POST /api/projects/:projectId/integrate/jira': 'Sync artifacts to Jira (Protected)',
        'POST /api/projects/:projectId/integrate/jira/test': 'Test Jira connection (Protected)',
        'GET /api/projects/:projectId/integrate/status': 'Get integration status (Protected)'
      },
      chat: {
        'POST /api/chat': 'Chat with AI assistant (Protected)'
      },
      health: {
        'GET /api/health': 'Health check endpoint',
        'GET /api/docs': 'API documentation'
      }
    },
    features: [
      'JWT Authentication',
      'Real-time collaboration with Socket.IO',
      'File upload support',
      'AI-powered artifact generation',
      'Jira integration',
      'Email notifications',
      'Rate limiting',
      'Comprehensive logging',
      'Input validation'
    ]
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects', inputRoutes);
router.use('/projects', generateRoutes);
router.use('/projects', artifactRoutes);
router.use('/projects', integrateRoutes);
router.use('/chat', chatRoutes);

// Debug middleware to log all requests
router.use((req, res, next) => {
  logger.info(`Route accessed: ${req.method} ${req.path}`);
  next();
});

export default router;