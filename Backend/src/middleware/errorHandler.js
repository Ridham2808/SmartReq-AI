// Error handler middleware

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 400
    message = 'Duplicate field value entered'
  }

  if (err.code === 'P2025') {
    statusCode = 404
    message = 'Record not found'
  }

  if (err.code === 'P2003') {
    statusCode = 400
    message = 'Foreign key constraint failed'
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large'
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field'
    } else {
      message = err.message
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
}

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}