/**
 * Context-Aware Requirement Refinement Service
 * This service handles AI-powered requirement refinement using semantic context
 */

const { findSimilarRequirements } = require('./mockVectorDB');
const logger = require('./logger');

// Initialize OpenAI client (optional)
let openai = null;
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  logger.warn('OpenAI module not available, using enhanced local analysis only');
}

/**
 * Enhanced AI refinement function using OpenAI GPT-4
 * Provides sophisticated requirement enhancement with semantic context
 */
async function refineRequirementWithAI(originalRequirement, contextRequirements) {
  try {
    // Try OpenAI API first if available
    if (openai && process.env.OPENAI_API_KEY) {
      return await refineWithOpenAI(originalRequirement, contextRequirements);
    }
  } catch (error) {
    logger.warn('OpenAI refinement failed, falling back to enhanced local analysis', { error: error.message });
  }
  
  // Enhanced fallback with better semantic analysis
  return await refineWithEnhancedLocalAnalysis(originalRequirement, contextRequirements);
}

/**
 * Refine requirement using OpenAI GPT-4 with sophisticated prompting
 */
async function refineWithOpenAI(originalRequirement, contextRequirements) {
  const contextTexts = contextRequirements.map(req => req.text).join('\n');
  const contextSummary = contextRequirements.length > 0 
    ? `\n\nContext from similar requirements:\n${contextTexts}`
    : '';

  const prompt = `You are an expert software requirements analyst and technical architect. Your task is to enhance and refine a software requirement using semantic context from similar requirements.

ORIGINAL REQUIREMENT:
"${originalRequirement}"

${contextSummary}

Please provide a comprehensive, detailed, and technically sound refinement of this requirement. Consider:

1. **Technical Depth**: Add specific technical details, protocols, and standards
2. **Security**: Include security considerations and best practices
3. **Performance**: Add performance requirements and scalability considerations
4. **User Experience**: Enhance user experience and accessibility aspects
5. **Integration**: Consider integration points and dependencies
6. **Compliance**: Include relevant compliance and regulatory requirements
7. **Testing**: Add testing and validation requirements
8. **Documentation**: Include documentation and maintenance considerations

Based on the context from similar requirements, ensure consistency and leverage proven patterns.

Provide your response in this exact JSON format:
{
  "refinedRequirement": "Enhanced requirement text here",
  "technicalSpecifications": [
    "Specific technical detail 1",
    "Specific technical detail 2"
  ],
  "securityConsiderations": [
    "Security aspect 1",
    "Security aspect 2"
  ],
  "performanceRequirements": [
    "Performance requirement 1",
    "Performance requirement 2"
  ],
  "integrationPoints": [
    "Integration point 1",
    "Integration point 2"
  ],
  "testingCriteria": [
    "Test criteria 1",
    "Test criteria 2"
  ],
  "enhancementScore": 0.85,
  "reasoning": "Brief explanation of key enhancements made"
}

IMPORTANT: 
- Make the refined requirement comprehensive but concise (max 300 words)
- Base enhancements on the context provided
- Use industry-standard terminology and best practices
- Ensure the requirement is actionable and measurable
- Focus on technical accuracy and completeness`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software requirements analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse the JSON response
    let refinementData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refinementData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      logger.error('Failed to parse OpenAI refinement response', { error: parseError.message, response: aiResponse });
      throw new Error('Failed to parse AI refinement response');
    }

    return {
      refinedRequirement: refinementData.refinedRequirement,
      technicalSpecifications: refinementData.technicalSpecifications || [],
      securityConsiderations: refinementData.securityConsiderations || [],
      performanceRequirements: refinementData.performanceRequirements || [],
      integrationPoints: refinementData.integrationPoints || [],
      testingCriteria: refinementData.testingCriteria || [],
      enhancementScore: refinementData.enhancementScore || 0.8,
      reasoning: refinementData.reasoning || 'Enhanced using AI analysis',
      source: 'OpenAI GPT-4'
    };

  } catch (error) {
    logger.error('OpenAI API call failed', { error: error.message });
    throw error;
  }
}

/**
 * Enhanced local analysis with sophisticated semantic understanding
 */
async function refineWithEnhancedLocalAnalysis(originalRequirement, contextRequirements) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const contextTexts = contextRequirements.map(req => req.text).join('; ');
  const lowerReq = originalRequirement.toLowerCase();
  
  // Enhanced semantic analysis with context awareness
  let refinedRequirement = originalRequirement;
  let technicalSpecs = [];
  let securityConsiderations = [];
  let performanceRequirements = [];
  let integrationPoints = [];
  let testingCriteria = [];
  
  // Authentication & Security Analysis
  if (lowerReq.includes('login') || lowerReq.includes('auth') || lowerReq.includes('authentication')) {
    if (contextTexts.toLowerCase().includes('oauth')) {
      refinedRequirement = `Implement enterprise-grade OAuth 2.0 authentication with OpenID Connect, multi-factor authentication (MFA), and advanced fraud detection using machine learning algorithms. ${originalRequirement}`;
      technicalSpecs = ['OAuth 2.0 with PKCE', 'JWT token management', 'Session management with Redis'];
      securityConsiderations = ['Rate limiting', 'Account lockout policies', 'Audit logging', 'GDPR compliance'];
    } else if (contextTexts.toLowerCase().includes('otp')) {
      refinedRequirement = `Develop secure authentication system with OTP verification via SMS/Email, biometric authentication support, and comprehensive session management with real-time security monitoring. ${originalRequirement}`;
      technicalSpecs = ['TOTP/HOTP implementation', 'Biometric API integration', 'Session invalidation'];
      securityConsiderations = ['OTP expiration', 'Brute force protection', 'Device fingerprinting'];
    } else {
      refinedRequirement = `Build robust authentication system with password encryption (bcrypt), secure session management, comprehensive audit logging, and real-time security monitoring with anomaly detection. ${originalRequirement}`;
      technicalSpecs = ['bcrypt password hashing', 'JWT with refresh tokens', 'Session storage'];
      securityConsiderations = ['Password complexity', 'Session timeout', 'Failed login tracking'];
    }
    performanceRequirements = ['< 200ms authentication response', 'Support 10,000 concurrent sessions'];
    testingCriteria = ['Load testing with 1000+ users', 'Security penetration testing', 'Session management testing'];
  }
  
  // Dashboard & Analytics Analysis
  else if (lowerReq.includes('dashboard') || lowerReq.includes('analytics') || lowerReq.includes('reporting')) {
    refinedRequirement = `Create comprehensive, real-time dashboard with advanced analytics, customizable widgets, interactive data visualization, user preference management, and automated report generation with export capabilities. ${originalRequirement}`;
    technicalSpecs = ['Real-time WebSocket connections', 'Chart.js/D3.js visualization', 'Responsive grid layout'];
    performanceRequirements = ['< 1s dashboard load time', 'Real-time updates every 5s', 'Support 50+ concurrent users'];
    integrationPoints = ['Analytics APIs', 'Database connections', 'Export services'];
    testingCriteria = ['Performance testing', 'Cross-browser compatibility', 'Mobile responsiveness'];
  }
  
  // Payment & Financial Analysis
  else if (lowerReq.includes('payment') || lowerReq.includes('billing') || lowerReq.includes('transaction')) {
    refinedRequirement = `Build secure, PCI-DSS compliant payment processing system with multiple payment methods (credit cards, digital wallets, bank transfers), comprehensive transaction history, automated refund handling, and advanced fraud detection. ${originalRequirement}`;
    technicalSpecs = ['PCI-DSS compliance', 'Payment gateway integration', 'Encrypted data storage'];
    securityConsiderations = ['End-to-end encryption', 'Tokenization', 'Fraud detection algorithms'];
    performanceRequirements = ['< 3s payment processing', '99.9% uptime', 'Support 1000+ transactions/hour'];
    testingCriteria = ['Security audit', 'Load testing', 'Payment gateway testing'];
  }
  
  // API & Integration Analysis
  else if (lowerReq.includes('api') || lowerReq.includes('endpoint') || lowerReq.includes('integration')) {
    refinedRequirement = `Develop comprehensive RESTful API with OpenAPI 3.0 documentation, advanced rate limiting, OAuth 2.0 authentication, comprehensive error handling, versioning strategy, and automated testing suite. ${originalRequirement}`;
    technicalSpecs = ['OpenAPI 3.0 specification', 'Rate limiting middleware', 'API versioning'];
    securityConsiderations = ['API key management', 'CORS configuration', 'Input validation'];
    performanceRequirements = ['< 100ms API response', 'Support 10,000 requests/minute', '99.9% availability'];
    testingCriteria = ['API load testing', 'Security testing', 'Documentation validation'];
  }
  
  // UI/UX Analysis
  else if (lowerReq.includes('interface') || lowerReq.includes('ui') || lowerReq.includes('page') || lowerReq.includes('frontend')) {
    refinedRequirement = `Design responsive, accessible user interface following WCAG 2.1 AA standards with modern UX patterns, mobile-first approach, progressive enhancement, and comprehensive user testing integration. ${originalRequirement}`;
    technicalSpecs = ['Responsive CSS Grid/Flexbox', 'Accessibility ARIA labels', 'Progressive Web App features'];
    performanceRequirements = ['< 2s page load time', 'Lighthouse score > 90', 'Mobile performance optimization'];
    testingCriteria = ['Accessibility testing', 'Cross-device testing', 'User experience testing'];
  }
  
  // Data Management Analysis
  else if (lowerReq.includes('data') || lowerReq.includes('database') || lowerReq.includes('storage')) {
    refinedRequirement = `Implement robust data management system with ACID compliance, automated backups, data encryption at rest and in transit, comprehensive audit trails, and GDPR compliance features. ${originalRequirement}`;
    technicalSpecs = ['Database optimization', 'Encryption algorithms', 'Backup automation'];
    securityConsiderations = ['Data encryption', 'Access controls', 'Audit logging'];
    performanceRequirements = ['< 50ms query response', '99.99% data availability', 'Automated scaling'];
    testingCriteria = ['Data integrity testing', 'Backup recovery testing', 'Performance benchmarking'];
  }
  
  // General Enhancement
  else {
    const enhancements = [
      'with comprehensive error handling and logging',
      'including security best practices and compliance',
      'with user-friendly interface and accessibility',
      'following industry standards and best practices',
      'with comprehensive documentation and testing',
      'including performance optimization and monitoring'
    ];
    
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    refinedRequirement = `${originalRequirement} ${randomEnhancement}`;
    technicalSpecs = ['Error handling framework', 'Logging system', 'Monitoring tools'];
    securityConsiderations = ['Input validation', 'Output encoding', 'Security headers'];
    performanceRequirements = ['Response time optimization', 'Resource management', 'Caching strategy'];
    testingCriteria = ['Unit testing', 'Integration testing', 'Performance testing'];
  }
  
  // Ensure the refined requirement is not too long
  if (refinedRequirement.length > 500) {
    refinedRequirement = refinedRequirement.substring(0, 497) + '...';
  }
  
  return {
    refinedRequirement,
    technicalSpecifications: technicalSpecs,
    securityConsiderations,
    performanceRequirements,
    integrationPoints,
    testingCriteria,
    enhancementScore: calculateEnhancedRefinementScore(originalRequirement, refinedRequirement, contextRequirements),
    reasoning: 'Enhanced using advanced semantic analysis with context awareness',
    source: 'Enhanced Local Analysis'
  };
}

/**
 * Main function to refine a requirement using context
 * @param {string} requirement - The original requirement text
 * @param {string} projectId - Optional project ID for context filtering
 * @returns {Object} Refinement result with original, refined, and context
 */
async function refineRequirement(requirement, projectId = null) {
  try {
    logger.info('Starting requirement refinement process', { 
      requirement: requirement.substring(0, 100) + '...',
      projectId 
    });
    
    // Step 1: Find similar requirements from context
    const similarRequirements = findSimilarRequirements(requirement, 3, 0.3);
    
    logger.info('Found similar requirements', { 
      count: similarRequirements.length,
      similarities: similarRequirements.map(req => ({
        id: req.id,
        similarity: req.similarity.toFixed(3),
        text: req.text.substring(0, 50) + '...'
      }))
    });
    
    // Step 2: Use AI to refine the requirement
    const refinedRequirement = await refineRequirementWithAI(requirement, similarRequirements);
    
    // Step 3: Prepare context information
    const contextUsed = similarRequirements.map(req => ({
      id: req.id,
      text: req.text,
      similarity: req.similarity,
      category: req.category,
      projectId: req.projectId
    }));
    
    const result = {
      originalRequirement: requirement,
      refinedRequirement: refinedRequirement.refinedRequirement || refinedRequirement,
      contextUsed,
      refinementScore: refinedRequirement.enhancementScore || calculateRefinementScore(requirement, refinedRequirement.refinedRequirement || refinedRequirement),
      technicalSpecifications: refinedRequirement.technicalSpecifications || [],
      securityConsiderations: refinedRequirement.securityConsiderations || [],
      performanceRequirements: refinedRequirement.performanceRequirements || [],
      integrationPoints: refinedRequirement.integrationPoints || [],
      testingCriteria: refinedRequirement.testingCriteria || [],
      reasoning: refinedRequirement.reasoning || 'Enhanced using semantic context',
      source: refinedRequirement.source || 'Local Analysis',
      timestamp: new Date().toISOString()
    };
    
    logger.info('Requirement refinement completed', {
      originalLength: requirement.length,
      refinedLength: refinedRequirement.length,
      contextCount: contextUsed.length,
      refinementScore: result.refinementScore
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in requirement refinement', { error: error.message });
    throw new Error(`Requirement refinement failed: ${error.message}`);
  }
}

/**
 * Calculate a simple refinement score based on text enhancement
 * @param {string} original - Original requirement
 * @param {string} refined - Refined requirement
 * @returns {number} Score between 0 and 1
 */
function calculateRefinementScore(original, refined) {
  const originalWords = original.toLowerCase().split(' ').length;
  const refinedWords = refined.toLowerCase().split(' ').length;
  
  // Base score on word count increase and content enhancement
  const wordIncrease = Math.min((refinedWords - originalWords) / originalWords, 1);
  const hasEnhancements = refined.toLowerCase().includes('secure') || 
                         refined.toLowerCase().includes('comprehensive') ||
                         refined.toLowerCase().includes('real-time') ||
                         refined.toLowerCase().includes('responsive');
  
  const enhancementBonus = hasEnhancements ? 0.2 : 0;
  
  return Math.min(wordIncrease + enhancementBonus, 1);
}

/**
 * Calculate enhanced refinement score with context awareness
 * @param {string} original - Original requirement
 * @param {string} refined - Refined requirement
 * @param {Array} contextRequirements - Context requirements used
 * @returns {number} Score between 0 and 1
 */
function calculateEnhancedRefinementScore(original, refined, contextRequirements) {
  const originalWords = original.toLowerCase().split(' ').length;
  const refinedWords = refined.toLowerCase().split(' ').length;
  
  // Base score on word count increase
  const wordIncrease = Math.min((refinedWords - originalWords) / originalWords, 0.4);
  
  // Technical enhancement score
  const technicalKeywords = ['api', 'oauth', 'jwt', 'encryption', 'authentication', 'security', 'performance', 'scalability'];
  const technicalScore = technicalKeywords.filter(keyword => 
    refined.toLowerCase().includes(keyword)
  ).length * 0.05;
  
  // Security enhancement score
  const securityKeywords = ['secure', 'encrypted', 'authentication', 'authorization', 'audit', 'compliance', 'gdpr', 'pci'];
  const securityScore = securityKeywords.filter(keyword => 
    refined.toLowerCase().includes(keyword)
  ).length * 0.08;
  
  // Performance enhancement score
  const performanceKeywords = ['real-time', 'optimized', 'scalable', 'efficient', 'fast', 'responsive', 'concurrent'];
  const performanceScore = performanceKeywords.filter(keyword => 
    refined.toLowerCase().includes(keyword)
  ).length * 0.06;
  
  // Context utilization score
  const contextScore = contextRequirements.length > 0 ? 0.15 : 0;
  
  // Specificity score (more specific technical terms)
  const specificityKeywords = ['bcrypt', 'jwt', 'oauth 2.0', 'openapi', 'wcag', 'pci-dss', 'redis', 'websocket'];
  const specificityScore = specificityKeywords.filter(keyword => 
    refined.toLowerCase().includes(keyword)
  ).length * 0.1;
  
  const totalScore = Math.min(
    wordIncrease + technicalScore + securityScore + performanceScore + contextScore + specificityScore,
    1.0
  );
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Get enhanced refinement suggestions based on requirement type and context
 * @param {string} requirement - The requirement text
 * @param {Array} contextRequirements - Optional context requirements
 * @returns {Array} Array of suggestion objects
 */
function getRefinementSuggestions(requirement, contextRequirements = []) {
  const suggestions = [];
  const lowerReq = requirement.toLowerCase();
  const contextTexts = contextRequirements.map(req => req.text).join(' ').toLowerCase();
  
  // Authentication & Security Suggestions
  if (lowerReq.includes('login') || lowerReq.includes('auth') || lowerReq.includes('authentication')) {
    suggestions.push({
      type: 'security',
      suggestion: 'Implement OAuth 2.0 with PKCE and multi-factor authentication (MFA)',
      priority: 'high',
      category: 'authentication',
      technicalDetails: ['JWT token management', 'Session invalidation', 'Rate limiting']
    });
    suggestions.push({
      type: 'compliance',
      suggestion: 'Add comprehensive audit logging and GDPR compliance features',
      priority: 'high',
      category: 'compliance',
      technicalDetails: ['Audit trail', 'Data retention policies', 'User consent management']
    });
    suggestions.push({
      type: 'performance',
      suggestion: 'Implement session caching and optimize authentication response times',
      priority: 'medium',
      category: 'performance',
      technicalDetails: ['Redis session storage', '< 200ms response time', 'Connection pooling']
    });
  }
  
  // API & Integration Suggestions
  if (lowerReq.includes('api') || lowerReq.includes('endpoint') || lowerReq.includes('integration')) {
    suggestions.push({
      type: 'documentation',
      suggestion: 'Create comprehensive OpenAPI 3.0 specification with interactive documentation',
      priority: 'high',
      category: 'documentation',
      technicalDetails: ['Swagger UI', 'API versioning', 'Request/response examples']
    });
    suggestions.push({
      type: 'security',
      suggestion: 'Implement advanced rate limiting, API key management, and CORS configuration',
      priority: 'high',
      category: 'security',
      technicalDetails: ['Token-based authentication', 'Request throttling', 'Input validation']
    });
    suggestions.push({
      type: 'monitoring',
      suggestion: 'Add comprehensive API monitoring, logging, and health checks',
      priority: 'medium',
      category: 'monitoring',
      technicalDetails: ['Request tracking', 'Error logging', 'Performance metrics']
    });
  }
  
  // UI/UX Suggestions
  if (lowerReq.includes('ui') || lowerReq.includes('interface') || lowerReq.includes('frontend')) {
    suggestions.push({
      type: 'accessibility',
      suggestion: 'Ensure WCAG 2.1 AA compliance with comprehensive accessibility testing',
      priority: 'high',
      category: 'accessibility',
      technicalDetails: ['ARIA labels', 'Keyboard navigation', 'Screen reader support']
    });
    suggestions.push({
      type: 'responsive',
      suggestion: 'Implement mobile-first design with progressive enhancement',
      priority: 'high',
      category: 'responsive',
      technicalDetails: ['CSS Grid/Flexbox', 'Touch-friendly interfaces', 'Progressive Web App']
    });
    suggestions.push({
      type: 'performance',
      suggestion: 'Optimize for Core Web Vitals and implement lazy loading',
      priority: 'medium',
      category: 'performance',
      technicalDetails: ['Code splitting', 'Image optimization', 'Critical CSS']
    });
  }
  
  // Data Management Suggestions
  if (lowerReq.includes('data') || lowerReq.includes('database') || lowerReq.includes('storage')) {
    suggestions.push({
      type: 'security',
      suggestion: 'Implement end-to-end encryption and comprehensive data protection',
      priority: 'high',
      category: 'data-security',
      technicalDetails: ['Encryption at rest', 'Encryption in transit', 'Key management']
    });
    suggestions.push({
      type: 'backup',
      suggestion: 'Set up automated backups with point-in-time recovery',
      priority: 'high',
      category: 'backup',
      technicalDetails: ['Automated scheduling', 'Cross-region replication', 'Recovery testing']
    });
    suggestions.push({
      type: 'performance',
      suggestion: 'Optimize database queries and implement caching strategies',
      priority: 'medium',
      category: 'performance',
      technicalDetails: ['Query optimization', 'Indexing strategy', 'Connection pooling']
    });
  }
  
  // Payment & Financial Suggestions
  if (lowerReq.includes('payment') || lowerReq.includes('billing') || lowerReq.includes('transaction')) {
    suggestions.push({
      type: 'compliance',
      suggestion: 'Ensure PCI-DSS compliance and implement fraud detection',
      priority: 'critical',
      category: 'compliance',
      technicalDetails: ['PCI-DSS certification', 'Tokenization', 'Fraud monitoring']
    });
    suggestions.push({
      type: 'security',
      suggestion: 'Implement secure payment processing with multiple payment methods',
      priority: 'high',
      category: 'payment-security',
      technicalDetails: ['Payment gateway integration', 'Encrypted transactions', 'Audit trails']
    });
  }
  
  // Dashboard & Analytics Suggestions
  if (lowerReq.includes('dashboard') || lowerReq.includes('analytics') || lowerReq.includes('reporting')) {
    suggestions.push({
      type: 'real-time',
      suggestion: 'Implement real-time data updates with WebSocket connections',
      priority: 'high',
      category: 'real-time',
      technicalDetails: ['WebSocket implementation', 'Data streaming', 'Live updates']
    });
    suggestions.push({
      type: 'visualization',
      suggestion: 'Add interactive data visualization with customizable widgets',
      priority: 'medium',
      category: 'visualization',
      technicalDetails: ['Chart.js/D3.js', 'Responsive charts', 'Export functionality']
    });
  }
  
  // General Enhancement Suggestions
  suggestions.push({
    type: 'testing',
    suggestion: 'Implement comprehensive testing strategy with automated test suites',
    priority: 'high',
    category: 'testing',
    technicalDetails: ['Unit tests', 'Integration tests', 'End-to-end testing']
  });
  
  suggestions.push({
    type: 'monitoring',
    suggestion: 'Set up application monitoring and alerting systems',
    priority: 'medium',
    category: 'monitoring',
    technicalDetails: ['Application metrics', 'Error tracking', 'Performance monitoring']
  });
  
  // Context-aware suggestions based on similar requirements
  if (contextRequirements.length > 0) {
    const contextCategories = contextRequirements.map(req => req.category).filter(Boolean);
    const uniqueCategories = [...new Set(contextCategories)];
    
    uniqueCategories.forEach(category => {
      suggestions.push({
        type: 'consistency',
        suggestion: `Ensure consistency with existing ${category} requirements in the project`,
        priority: 'medium',
        category: 'consistency',
        technicalDetails: ['Pattern matching', 'Standard compliance', 'Architecture alignment']
      });
    });
  }
  
  // Remove duplicates and sort by priority
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.suggestion === suggestion.suggestion)
  );
  
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  return uniqueSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

module.exports = {
  refineRequirement,
  refineRequirementWithAI,
  refineWithOpenAI,
  refineWithEnhancedLocalAnalysis,
  calculateRefinementScore,
  calculateEnhancedRefinementScore,
  getRefinementSuggestions
};
