import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { config } from './src/config/env.js'
import { logger } from './src/middleware/errorHandler.js'
import { router as healthRouter } from './src/routes/health.js'
import apiRouter from './src/routes/index.js'
import { errorHandler, notFound } from './src/middleware/errorHandler.js'
import prisma from './src/config/db.js'
import { ensureUploadDir } from './src/utils/fileUtils.js'

const app = express()
const server = createServer(app)

// Build allowed origins from env + defaults
const envOrigins = (config.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet())
app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}))

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Logging
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Join project room for real-time updates
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    logger.info(`Client ${socket.id} joined project ${projectId}`);
  });
  
  // Leave project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    logger.info(`Client ${socket.id} left project ${projectId}`);
  });
  
  // Handle real-time flow updates
  socket.on('flow-update', (data) => {
    const { projectId, flowData } = data;
    socket.to(`project-${projectId}`).emit('flow-updated', flowData);
    logger.info(`Flow update broadcasted for project ${projectId}`);
  });
  
  // Handle real-time artifact updates
  socket.on('artifact-update', (data) => {
    const { projectId, artifactData } = data;
    socket.to(`project-${projectId}`).emit('artifact-updated', artifactData);
    logger.info(`Artifact update broadcasted for project ${projectId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/health', healthRouter)
app.use('/api', apiRouter)
app.use('/v1', apiRouter) // API versioning support

app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'smartreq-ai-backend',
    version: '1.0.0',
    apiVersion: 'v1',
    documentation: '/api/docs',
    health: '/api/health',
    features: [
      'JWT Authentication',
      'Real-time collaboration',
      'AI-powered generation',
      'Jira integration',
      'Email notifications',
      'File upload support',
      'Rate limiting',
      'Comprehensive logging'
    ]
  })
})

// 404 handler
app.use(notFound)

// Error handler
app.use(errorHandler)

// Database connection check
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

// Start server
const startServer = async () => {
  await checkDatabaseConnection()
  await ensureUploadDir()
  
  server.listen(config.PORT, () => {
    console.log(`🚀 Backend listening on :${config.PORT}`)
    console.log(`📚 API Documentation: http://localhost:${config.PORT}/api/docs`)
    console.log(`💚 Health Check: http://localhost:${config.PORT}/health`)
    console.log(`🔌 Socket.IO enabled for real-time updates`)
  })
}

startServer()

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close Socket.IO server
  io.close(() => {
    logger.info('Socket.IO server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Disconnect from database
  prisma.$disconnect()
    .then(() => {
      logger.info('Database disconnected');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
