const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateLastLogin,
  deleteUserProfile
} = require('../controllers/userProfile');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  avatarUrl: Joi.string().uri().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  role: Joi.string().max(100).optional().allow(''),
  company: Joi.string().max(255).optional().allow(''),
  location: Joi.string().max(255).optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
  bio: Joi.string().max(1000).optional().allow(''),
  twitter: Joi.string().uri().optional().allow(''),
  linkedin: Joi.string().uri().optional().allow(''),
  github: Joi.string().uri().optional().allow('')
});

const deleteAccountSchema = Joi.object({
  password: Joi.string().min(6).required()
});

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/profile', getUserProfile);
router.put('/profile', validate(updateProfileSchema), updateUserProfile);
router.put('/last-login', updateLastLogin);
router.delete('/profile', validate(deleteAccountSchema), deleteUserProfile);

module.exports = router;
