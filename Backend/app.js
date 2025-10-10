import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './src/config/env.js'
import { router as healthRouter } from './src/routes/health.js'
import apiRouter from './src/routes/index.js'
import { errorHandler, notFound } from './src/middleware/errorHandler.js'

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

app.listen(config.PORT, () => {
  console.log(`Backend skeleton listening on :${config.PORT}`)
})


