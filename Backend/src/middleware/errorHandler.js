const winston = require('winston');
const config = require('../config/env');

// Create logger instance
const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'warn' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'smartreq-ai' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for non-production environments
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging with more details
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
    errorCode: err.code,
    errorName: err.name
  };

  // Log error with enhanced details
  logger.error('Error occurred:', errorDetails);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = { message, statusCode: 404 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field';
    error = { message, statusCode: 400 };
  }

  // Email service errors
  if (err.message && err.message.includes('Email service')) {
    error = { 
      message: 'Email service temporarily unavailable. Please try again later.', 
      statusCode: 503,
      errorType: 'EMAIL_SERVICE_ERROR'
    };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.message.includes('connect ECONNREFUSED')) {
    error = { 
      message: 'Database connection failed. Please try again later.', 
      statusCode: 503,
      errorType: 'DATABASE_CONNECTION_ERROR'
    };
  }

  // Network timeout errors
  if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
    error = { 
      message: 'Request timeout. Please try again later.', 
      statusCode: 408,
      errorType: 'TIMEOUT_ERROR'
    };
  }

  // Prepare response
  const response = {
    success: false,
    message: error.message || 'Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error type if available
  if (error.errorType) {
    response.errorType = error.errorType;
  }

  // Add stack trace in development
  if (config.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.errorDetails = {
      code: err.code,
      name: err.name,
      originalMessage: err.message
    };
  }

  res.status(error.statusCode || 500).json(response);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  logger
};