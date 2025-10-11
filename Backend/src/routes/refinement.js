/**
 * Context-Aware Requirement Refinement Routes
 * Handles AI-powered requirement refinement using semantic context
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, logger } = require('../middleware/errorHandler');
const { refineRequirement, getRefinementSuggestions } = require('../utils/contextRefinementService');

/**
 * POST /api/refine-requirement
 * Refine a requirement using AI and semantic context
 * 
 * Request Body:
 * {
 *   "requirement": "User login feature",
 *   "projectId": "optional-project-id"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "originalRequirement": "User login feature",
 *     "refinedRequirement": "Implement secure OAuth 2.0 authentication...",
 *     "contextUsed": [...],
 *     "refinementScore": 0.85,
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.post('/refine-requirement', asyncHandler(async (req, res) => {
  const { requirement, projectId } = req.body;
  
  // Validation
  if (!requirement || typeof requirement !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Requirement text is required and must be a string'
    });
  }
  
  if (requirement.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Requirement must be at least 10 characters long'
    });
  }
  
  if (requirement.trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Requirement must be less than 1000 characters'
    });
  }
  
  try {
    logger.info('Processing requirement refinement request', {
      requirementLength: requirement.length,
      projectId: projectId || 'none'
    });
    
    // Refine the requirement using AI and context
    const refinementResult = await refineRequirement(requirement.trim(), projectId);
    
    // Get additional suggestions
    const suggestions = getRefinementSuggestions(requirement);
    
    const response = {
      success: true,
      data: {
        ...refinementResult,
        suggestions
      },
      message: 'Requirement refined successfully using AI context'
    };
    
    logger.info('Requirement refinement completed successfully', {
      originalLength: refinementResult.originalRequirement.length,
      refinedLength: refinementResult.refinedRequirement.length,
      contextCount: refinementResult.contextUsed.length,
      refinementScore: refinementResult.refinementScore
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Requirement refinement failed', {
      error: error.message,
      requirement: requirement.substring(0, 100)
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to refine requirement',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * GET /api/refinement/suggestions
 * Get refinement suggestions for a requirement without full refinement
 * 
 * Query Parameters:
 * - requirement: The requirement text
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": [...]
 *   }
 * }
 */
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { requirement } = req.query;
  
  if (!requirement || typeof requirement !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Requirement parameter is required'
    });
  }
  
  try {
    const suggestions = getRefinementSuggestions(requirement);
    
    res.json({
      success: true,
      data: { suggestions },
      message: 'Refinement suggestions retrieved successfully'
    });
    
  } catch (error) {
    logger.error('Failed to get refinement suggestions', {
      error: error.message,
      requirement: requirement.substring(0, 100)
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get refinement suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * POST /api/refinement/feedback
 * Submit feedback on refinement quality for future improvements
 * 
 * Request Body:
 * {
 *   "originalRequirement": "...",
 *   "refinedRequirement": "...",
 *   "rating": 5, // 1-5 scale
 *   "feedback": "Very helpful refinement"
 * }
 */
router.post('/feedback', asyncHandler(async (req, res) => {
  const { originalRequirement, refinedRequirement, rating, feedback } = req.body;
  
  // Validation
  if (!originalRequirement || !refinedRequirement) {
    return res.status(400).json({
      success: false,
      message: 'Original and refined requirements are required'
    });
  }
  
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }
  
  try {
    // In a real implementation, this would store feedback in a database
    // For now, we'll just log it
    logger.info('Refinement feedback received', {
      rating: rating || 'not provided',
      feedback: feedback || 'no feedback',
      originalLength: originalRequirement.length,
      refinedLength: refinedRequirement.length
    });
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    logger.error('Failed to submit refinement feedback', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

module.exports = router;
