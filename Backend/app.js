import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './src/config/env.js'
import { router as healthRouter } from './src/routes/health.js'
import apiRouter from './src/routes/index.js'
import { errorHandler, notFound } from './src/middleware/errorHandler.js'
import prisma from './src/config/db.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ 
  origin: config.CORS_ORIGIN,
  credentials: true 
}))

// Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Logging
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use('/health', healthRouter)
app.use('/api', apiRouter)

app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'smartreq-ai-backend-skeleton',
    version: '1.0.0',
    documentation: '/api/docs'
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
  
  app.listen(config.PORT, () => {
    console.log(`🚀 Backend listening on :${config.PORT}`)
    console.log(`📚 API Documentation: http://localhost:${config.PORT}/api/docs`)
    console.log(`💚 Health Check: http://localhost:${config.PORT}/health`)
  })
}

startServer()

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)
  
  prisma.$disconnect()
    .then(() => {
      console.log('Database disconnected')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error during shutdown:', error)
      process.exit(1)
    })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))