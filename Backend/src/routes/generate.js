const express = require('express');
const router = express.Router();
const { 
  generateArtifacts, 
  getGenerationStatus 
} = require('../controllers/generate');
const { 
  validate, 
  validateQuery, 
  generateSchema, 
  paginationSchema 
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

// POST(SSE) /api/projects/:projectId/generate
// Uses Server-Sent Events to stream progress and final JSON
router.post('/:projectId/generate', validate(generateSchema), generateArtifacts);

// GET /api/projects/:projectId/generate/status
router.get('/:projectId/generate/status', getGenerationStatus);

module.exports = router;
