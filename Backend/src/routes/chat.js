import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { chatHandler } from '../controllers/chat.js'
import { validateRequest, chatSchema } from '../middleware/validation.js'

const router = Router()

// Protected route
router.use(authenticateToken)

// POST /api/chat
router.post('/', validateRequest(chatSchema), chatHandler)

export default router