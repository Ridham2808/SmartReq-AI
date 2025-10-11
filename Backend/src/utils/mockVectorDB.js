/**
 * Mock Vector Database for Context-Aware Requirement Refinement
 * This simulates a vector database like Pinecone or FAISS for semantic similarity search
 */

// Mock requirements with their embeddings (simplified vectors)
const mockRequirements = [
  {
    id: 1,
    text: "Implement OAuth 2.0 authentication with Google and Microsoft providers",
    embedding: [0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7, 0.5],
    projectId: "proj-1",
    category: "authentication"
  },
  {
    id: 2,
    text: "Add secure login with OTP verification and fraud detection",
    embedding: [0.7, 0.8, 0.6, 0.9, 0.7, 0.6, 0.8, 0.7, 0.9, 0.6],
    projectId: "proj-2",
    category: "authentication"
  },
  {
    id: 3,
    text: "Create user dashboard with real-time analytics and notifications",
    embedding: [0.6, 0.5, 0.7, 0.8, 0.9, 0.7, 0.5, 0.6, 0.8, 0.9],
    projectId: "proj-3",
    category: "dashboard"
  },
  {
    id: 4,
    text: "Build payment processing system with Stripe integration and refund handling",
    embedding: [0.9, 0.7, 0.8, 0.6, 0.5, 0.9, 0.7, 0.8, 0.6, 0.5],
    projectId: "proj-4",
    category: "payment"
  },
  {
    id: 5,
    text: "Develop API endpoints for user management with role-based access control",
    embedding: [0.5, 0.9, 0.6, 0.7, 0.8, 0.5, 0.9, 0.6, 0.7, 0.8],
    projectId: "proj-5",
    category: "api"
  },
  {
    id: 6,
    text: "Design responsive mobile interface with offline capability",
    embedding: [0.7, 0.6, 0.5, 0.8, 0.9, 0.7, 0.6, 0.5, 0.8, 0.9],
    projectId: "proj-6",
    category: "ui"
  }
];

/**
 * Generate a mock embedding for input text
 * In real implementation, this would use OpenAI Embeddings API
 */
function generateMockEmbedding(text) {
  // Simple hash-based embedding generation for consistency
  const words = text.toLowerCase().split(' ');
  const embedding = new Array(10).fill(0);
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    embedding[index % 10] += Math.abs(hash) / 1000000;
  });
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Find similar requirements based on semantic similarity
 * @param {string} inputText - The input requirement text
 * @param {number} limit - Maximum number of similar requirements to return
 * @param {number} threshold - Minimum similarity threshold (0-1)
 * @returns {Array} Array of similar requirements with similarity scores
 */
function findSimilarRequirements(inputText, limit = 3, threshold = 0.3) {
  const inputEmbedding = generateMockEmbedding(inputText);
  
  const similarities = mockRequirements.map(req => ({
    ...req,
    similarity: cosineSimilarity(inputEmbedding, req.embedding)
  }));
  
  // Filter by threshold and sort by similarity
  return similarities
    .filter(req => req.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Add a new requirement to the mock database
 * @param {string} text - The requirement text
 * @param {string} projectId - The project ID
 * @param {string} category - The requirement category
 * @returns {Object} The added requirement with generated embedding
 */
function addRequirement(text, projectId, category = 'general') {
  const newRequirement = {
    id: mockRequirements.length + 1,
    text,
    embedding: generateMockEmbedding(text),
    projectId,
    category
  };
  
  mockRequirements.push(newRequirement);
  return newRequirement;
}

/**
 * Get all requirements (for debugging/admin purposes)
 */
function getAllRequirements() {
  return mockRequirements;
}

/**
 * Get requirements by project ID
 */
function getRequirementsByProject(projectId) {
  return mockRequirements.filter(req => req.projectId === projectId);
}

module.exports = {
  findSimilarRequirements,
  addRequirement,
  getAllRequirements,
  getRequirementsByProject,
  generateMockEmbedding,
  cosineSimilarity
};
