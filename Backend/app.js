import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './src/config/env.js'
import { router as healthRouter } from './src/routes/health.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: config.CORS_ORIGIN }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.use('/health', healthRouter)

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'smartreq-ai-backend' })
})

app.listen(config.PORT, () => {
  console.log(`Backend skeleton listening on :${config.PORT}`)
})


