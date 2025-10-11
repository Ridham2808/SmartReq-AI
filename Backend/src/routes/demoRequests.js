const express = require('express');
const router = express.Router();
const {
  createDemoRequest,
  getDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest
} = require('../controllers/demoRequests');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const createDemoRequestSchema = Joi.object({
  email: Joi.string().email().required(),
  company: Joi.string().min(1).max(255).required(),
  name: Joi.string().min(1).max(255).optional(),
  requirements: Joi.string().max(1000).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'contacted', 'completed', 'rejected').required()
});

// Public routes
router.post('/', validate(createDemoRequestSchema), createDemoRequest);

// Protected routes (admin only - you may want to add admin middleware)
router.get('/', authenticateToken, getDemoRequests);
router.put('/:id', authenticateToken, validate(updateStatusSchema), updateDemoRequestStatus);
router.delete('/:id', authenticateToken, deleteDemoRequest);

module.exports = router;
