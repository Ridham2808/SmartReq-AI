import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Protected route
router.use(authenticateToken)

// POST /api/chat
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chat endpoint (to be implemented)',
    response: 'AI response will be here'
  })
})

export default router
