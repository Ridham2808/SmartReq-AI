const express = require('express');
const router = express.Router();
const {
  createTrialRequest,
  getTrialRequests,
  updateTrialRequestStatus,
  deleteTrialRequest
} = require('../controllers/trialRequests');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const createTrialRequestSchema = Joi.object({
  email: Joi.string().email().required(),
  company: Joi.string().min(1).max(255).required(),
  teamSize: Joi.string().max(100).optional(),
  useCase: Joi.string().max(1000).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'contacted', 'approved', 'rejected').required()
});

// Public routes
router.post('/', validate(createTrialRequestSchema), createTrialRequest);

// Protected routes (admin only - you may want to add admin middleware)
router.get('/', authenticateToken, getTrialRequests);
router.put('/:id', authenticateToken, validate(updateStatusSchema), updateTrialRequestStatus);
router.delete('/:id', authenticateToken, deleteTrialRequest);

module.exports = router;
