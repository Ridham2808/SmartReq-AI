const express = require('express');
const router = express.Router();
const {
  createEmailCapture,
  getEmailCaptures,
  getEmailCaptureStats,
  deleteEmailCapture
} = require('../controllers/emailCaptures');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const createEmailCaptureSchema = Joi.object({
  email: Joi.string().email().required(),
  source: Joi.string().max(100).optional().default('impact_page')
});

// Public routes
router.post('/', validate(createEmailCaptureSchema), createEmailCapture);

// Protected routes (admin only - you may want to add admin middleware)
router.get('/', authenticateToken, getEmailCaptures);
router.get('/stats', authenticateToken, getEmailCaptureStats);
router.delete('/:id', authenticateToken, deleteEmailCapture);

module.exports = router;
