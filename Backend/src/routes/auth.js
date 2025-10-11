const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile } = require('../controllers/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema, updateProfileSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { ensureUploadDir } = require('../utils/fileUtils');
const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, getMe);

// POST /api/auth/verify-email
router.post('/verify-email', (req, res, next) => {
  console.log('=== ROUTE MIDDLEWARE DEBUG ===');
  console.log('Body received in route:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Content-Type:', req.headers['content-type']);
  console.log('================================');
  next();
}, verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// PUT /api/auth/profile (Protected)
router.put('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);

// POST /api/auth/profile/avatar - upload avatar
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }).single('avatar');

router.post('/profile/avatar', authenticateToken, (req, res, next) => uploadAvatar(req, res, next), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const filePath = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`.replace('\\', '/');
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: filePath },
    select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true, createdAt: true }
  });
  res.json({ success: true, message: 'Avatar updated', user: updated });
}));

// Test endpoint for CORS debugging
router.post('/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: req.headers.origin,
    method: req.method,
    body: req.body
  });
});

// Simple test endpoint to verify routing
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test login without validation
router.post('/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'Test login endpoint working',
    body: req.body,
    headers: req.headers
  });
});

module.exports = router;