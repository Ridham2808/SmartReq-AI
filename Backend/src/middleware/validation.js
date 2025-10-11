import Joi from 'joi'

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      })
    }
    
    req.body = value
    next()
  }
}

// Auth validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional()
})

// Project validation schemas
export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional().allow('')
})

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional().allow('')
})

// Input validation schemas
export const createInputSchema = Joi.object({
  type: Joi.string().valid('text', 'voice', 'document').required(),
  content: Joi.string().when('type', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.optional().allow('')
  })
})

// Artifact validation schemas
export const updateArtifactSchema = Joi.object({
  content: Joi.alternatives().try(Joi.string(), Joi.object()).required()
})

// Chat validation schemas
export const chatSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  context: Joi.array().items(Joi.object()).optional()
})

// Integration validation schemas
export const jiraSyncSchema = Joi.object({
  jiraUrl: Joi.string().uri().required(),
  jiraEmail: Joi.string().email().required(),
  jiraApiToken: Joi.string().required(),
  jiraProjectKey: Joi.string().required()
})

export const jiraTestSchema = Joi.object({
  jiraUrl: Joi.string().uri().required(),
  jiraEmail: Joi.string().email().required(),
  jiraApiToken: Joi.string().required()
})