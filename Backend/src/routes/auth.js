const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/auth');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

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