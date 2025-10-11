const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import configuration
const config = require('./src/config/env');
const { logger } = require('./src/middleware/errorHandler');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Import routes
const apiRoutes = require('./src/routes/index');

// Import utilities
const { ensureUploadDir } = require('./src/utils/fileUtils');
const prisma = require('./src/config/db');

// Create Express app
const app = express();
const server = createServer(app);

// Build allowed origins from env + defaults
const envOrigins = (config.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://smart-req-ai.vercel.app',
  'https://smartreq-ai.vercel.app',
  'https://smart-req-ai-frontend.vercel.app',
  'https://smart-req-ai-wnj9.vercel.app' // preview/deploy domain
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

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow specific origins
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Ensure preflight handled for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Enhanced logging middleware
if (config.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Custom request logging middleware for debugging
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  });

  // Log request body for debugging (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.email) sanitizedBody.email = sanitizedBody.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    
    logger.info('Request body:', sanitizedBody);
  }

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Response sent:', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      success: data?.success,
      message: data?.message,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, data);
  };

  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, config.UPLOAD_DIR)));

// Create necessary directories
const createDirectories = async () => {
  try {
    await ensureUploadDir();
    
    // Create logs directory
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    logger.info('Directories created successfully');
  } catch (error) {
    logger.error('Error creating directories:', error);
  }
};

// Initialize directories
createDirectories();

// Ensure database schema (quick safety in case migrations did not run)
const ensureDatabaseSchema = async () => {
  try {
    // Add user verification/auth columns if missing
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationCode" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationExpiry" TIMESTAMP(3)'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetCode" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMP(3)'
    );
    
    // Add new user profile fields if missing
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedin" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3)'
    );
    
    logger.info('Database schema verified/updated successfully');
  } catch (error) {
    logger.error('Database schema verification failed', error);
  }
};

// Delay server listen until schema is ensured
const startServer = async () => {
  await ensureDatabaseSchema();

  const PORT = config.PORT;
  server.listen(PORT, () => {
    logger.info(`SmartReq AI Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SmartReq AI Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// CORS debug endpoint
app.get('/cors-debug', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

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
  
  // Handle real-time artifact updates
  socket.on('artifact-updated', (data) => {
    socket.to(`project-${data.projectId}`).emit('artifact-updated', data);
  });
  
  // Handle real-time generation progress
  socket.on('generation-progress', (data) => {
    socket.to(`project-${data.projectId}`).emit('generation-progress', data);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to other modules
app.set('io', io);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// server start moved into startServer()

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

module.exports = app;
