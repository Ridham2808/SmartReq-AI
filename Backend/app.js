import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { router as healthRouter } from './src/routes/health.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.use('/health', healthRouter)

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'smartreq-ai-backend' })
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`Backend skeleton listening on :${port}`)
})


