import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { chatHandler } from '../controllers/chat.js'

const router = Router()

// Protected route
router.use(authenticateToken)

// POST /api/chat
router.post('/', chatHandler)

export default router