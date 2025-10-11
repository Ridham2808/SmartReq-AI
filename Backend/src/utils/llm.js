import { config } from '../config/env.js'

// Mock LLM service - will be replaced with actual OpenAI/Gemini integration
export const generateUserStories = async (requirements) => {
  try {
    console.log('Generating user stories for:', requirements)
    
    // Simulate AI processing
    const stories = [
      {
        title: 'User Registration',
        description: 'As a user, I want to register an account so that I can access the system',
        acceptanceCriteria: [
          'User can enter email and password',
          'System validates email format',
          'User receives confirmation email'
        ]
      }
    ]

    return {
      success: true,
      stories
    }
  } catch (error) {
    console.error('Generate user stories error:', error)
    throw error
  }
}

export const generateProcessFlow = async (requirements) => {
  try {
    console.log('Generating process flow for:', requirements)
    
    // Simulate AI processing
    const flow = {
      nodes: [
        { id: '1', label: 'Start', type: 'start' },
        { id: '2', label: 'User Input', type: 'process' },
        { id: '3', label: 'End', type: 'end' }
      ],
      edges: [
        { source: '1', target: '2' },
        { source: '2', target: '3' }
      ]
    }

    return {
      success: true,
      flow
    }
  } catch (error) {
    console.error('Generate process flow error:', error)
    throw error
  }
}

export const chatWithAI = async (message, context = []) => {
  try {
    console.log('Chat with AI:', message)
    
    // Simulate AI response
    const response = `I understand you're asking about: "${message}". How can I help you further with your requirements?`

    return {
      success: true,
      response
    }
  } catch (error) {
    console.error('Chat with AI error:', error)
    throw error
  }
}

export const extractRequirements = async (text) => {
  try {
    console.log('Extracting requirements from text')
    
    // Simulate requirement extraction
    const requirements = [
      {
        type: 'functional',
        description: 'System shall allow user authentication',
        priority: 'high'
      }
    ]

    return {
      success: true,
      requirements
    }
  } catch (error) {
    console.error('Extract requirements error:', error)
    throw error
  }
}