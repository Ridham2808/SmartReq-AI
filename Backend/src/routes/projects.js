const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/projects');
const { 
  validate, 
  validateQuery, 
  projectSchema, 
  projectUpdateSchema, 
  paginationSchema 
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

// POST /api/projects
router.post('/', validate(projectSchema), createProject);

// GET /api/projects
router.get('/', validateQuery(paginationSchema), getProjects);

// GET /api/projects/:id
router.get('/:id', getProject);

// PUT /api/projects/:id
router.put('/:id', validate(projectUpdateSchema), updateProject);

// DELETE /api/projects/:id
router.delete('/:id', deleteProject);

module.exports = router;