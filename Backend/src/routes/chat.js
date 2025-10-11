const express = require('express');
const router = express.Router();
const { chatHandler } = require('../controllers/chat');
const { authenticateToken } = require('../middleware/auth');

// Optional auth; protect if required
router.use(authenticateToken);

// POST /api/chat
router.post('/', chatHandler);

module.exports = router;


