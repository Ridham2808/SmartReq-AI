const express = require('express');
const router = express.Router();
const { 
  createInput, 
  getInputs, 
  getInput, 
  deleteInput 
} = require('../controllers/inputs');
const { 
  validate, 
  validateQuery, 
  inputSchema, 
  paginationSchema 
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { uploadMiddleware } = require('../utils/fileUtils');

// All routes are protected
router.use(authenticateToken);

// POST /api/projects/:projectId/inputs
router.post('/:projectId/inputs', uploadMiddleware, validate(inputSchema), createInput);

// GET /api/projects/:projectId/inputs
router.get('/:projectId/inputs', validateQuery(paginationSchema), getInputs);

// GET /api/projects/:projectId/inputs/:inputId
router.get('/:projectId/inputs/:inputId', getInput);

// DELETE /api/projects/:projectId/inputs/:inputId
router.delete('/:projectId/inputs/:inputId', deleteInput);

module.exports = router;
