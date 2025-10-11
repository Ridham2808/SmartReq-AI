import { Router } from 'express'
import { register, login, getMe } from '../controllers/auth.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateRequest, registerSchema, loginSchema } from '../middleware/validation.js'

const router = Router()

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), register)

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), login)

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, getMe)

export default router