import { Router } from 'express'

const router = Router()

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'SmartReq AI API Documentation',
    version: '1.0.0'
  })
})

export default router
