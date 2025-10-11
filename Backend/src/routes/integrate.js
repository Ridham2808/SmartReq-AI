const express = require('express');
const router = express.Router();
const { 
  syncToJira, 
  testJiraConnection, 
  getIntegrationStatus 
} = require('../controllers/integrate');
const { 
  validate, 
  jiraIntegrationSchema 
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

// POST /api/projects/:projectId/integrate/jira
router.post('/:projectId/integrate/jira', validate(jiraIntegrationSchema), syncToJira);

// POST /api/projects/:projectId/integrate/jira/test
router.post('/:projectId/integrate/jira/test', validate(jiraIntegrationSchema), testJiraConnection);

// GET /api/projects/:projectId/integrate/status
router.get('/:projectId/integrate/status', getIntegrationStatus);

module.exports = router;
