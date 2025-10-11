const express = require('express');
const router = express.Router();
const { logger } = require('../middleware/errorHandler');
const { checkEmailServiceHealth, testEmailConfiguration } = require('../utils/emailService');
const prisma = require('../config/db');
const config = require('../config/env');

// Import route modules
const authRoutes = require('./auth');
const projectRoutes = require('./projects');
const inputRoutes = require('./inputs');
const generateRoutes = require('./generate');
const artifactRoutes = require('./artifacts');
const integrateRoutes = require('./integrate');
const chatRoutes = require('./chat');
const net = require('net');

// Enhanced health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
    success: true,
    message: 'SmartReq AI API is running',
    timestamp: new Date().toISOString(),
      version: '1.0.0',
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
        status: 'error',
        message: 'Email service check failed',
        error: error.message
      };
    }

    // Determine overall health
    const allServicesHealthy = Object.values(healthCheck.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      healthCheck.success = false;
      healthCheck.message = 'Some services are experiencing issues';
    }

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Email service test endpoint
router.post('/test-email', async (req, res) => {
  try {
    logger.info('Email service test requested');
    const testResult = await testEmailConfiguration();
    
    res.json({
      success: testResult.success,
      message: testResult.success ? 'Email service is working' : 'Email service test failed',
      timestamp: new Date().toISOString(),
      details: testResult
    });
  } catch (error) {
    logger.error('Email test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// SMTP connectivity test (server-side TCP dial)
router.get('/smtp-test', async (req, res) => {
  const results = [];
  const targets = [
    { host: 'smtp.gmail.com', port: 587 },
    { host: 'smtp.gmail.com', port: 465 }
  ];

  const testOnce = (host, port) => new Promise(resolve => {
    const socket = new net.Socket();
    const startedAt = Date.now();
    const timeoutMs = 5000;
    let outcome = { host, port };

    const finalize = (status, error) => {
      outcome.status = status;
      outcome.ms = Date.now() - startedAt;
      if (error) outcome.error = error.message || String(error);
      try { socket.destroy(); } catch (_) {}
      resolve(outcome);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finalize('connected'));
    socket.once('timeout', () => finalize('timeout'));
    socket.once('error', (err) => finalize('error', err));
    try {
      socket.connect(port, host);
    } catch (err) {
      finalize('error', err);
    }
  });

  for (const t of targets) {
    // run sequentially to keep response readable
    // eslint-disable-next-line no-await-in-loop
    results.push(await testOnce(t.host, t.port));
  }

  res.json({ success: true, results, timestamp: new Date().toISOString() });
});

// System diagnostics endpoint
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {}
    };

    // Database diagnostics
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;
      
      diagnostics.services.database = {
        status: 'healthy',
        responseTime: `${dbTime}ms`,
        connectionPool: prisma._engine?.connectionPool || 'unknown'
      };
    } catch (error) {
      diagnostics.services.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Email service diagnostics
    try {
      const emailHealth = await checkEmailServiceHealth();
      diagnostics.services.email = emailHealth;
    } catch (error) {
      diagnostics.services.email = {
        status: 'error',
        error: error.message
      };
    }

    res.json({
      success: true,
      message: 'System diagnostics completed',
      diagnostics
    });
  } catch (error) {
    logger.error('Diagnostics endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Diagnostics failed',
      error: error.message
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'SmartReq AI API Documentation',
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
        'DELETE /api/projects/:projectId/artifacts/:artifactId': 'Delete artifact (Protected)'
      },
      integrate: {
        'POST /api/projects/:projectId/integrate/jira': 'Sync artifacts to Jira (Protected)',
        'POST /api/projects/:projectId/integrate/jira/test': 'Test Jira connection (Protected)',
        'GET /api/projects/:projectId/integrate/status': 'Get integration status (Protected)'
      }
    }
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
  console.log(`Route accessed: ${req.method} ${req.path}`);
  next();
});

module.exports = router;