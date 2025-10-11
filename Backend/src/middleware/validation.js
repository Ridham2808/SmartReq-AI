const Joi = require('joi');

// Auth validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
  rememberMe: Joi.boolean().optional().messages({
    'boolean.base': 'Remember me must be a boolean value'
  })
});

// Forgot / Reset password schemas
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  resetCode: Joi.string().length(6).required().messages({
    'string.length': 'Reset code must be 6 digits',
    'any.required': 'Reset code is required'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'any.required': 'New password is required'
  })
});

// Email verification schema
const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  verificationCode: Joi.string().min(1).max(10).required().messages({
    'string.min': 'Verification code is required',
    'string.max': 'Verification code is too long',
    'any.required': 'Verification code is required'
  })
});

// Resend verification schema
const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Update profile schema
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  currentPassword: Joi.string().when('newPassword', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Current password is required when changing password'
  }),
  newPassword: Joi.string().min(8).optional().messages({
    'string.min': 'New password must be at least 8 characters long'
  })
});

// Project validation schemas
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Project name is required',
    'string.max': 'Project name must not exceed 100 characters',
    'any.required': 'Project name is required'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description must not exceed 500 characters'
  })
});

const projectUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Project name cannot be empty',
    'string.max': 'Project name must not exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description must not exceed 500 characters'
  })
});

// Input validation schemas
const inputSchema = Joi.object({
  type: Joi.string().valid('text', 'voice', 'document').required().messages({
    'any.only': 'Type must be one of: text, voice, document',
    'any.required': 'Type is required'
  }),
  content: Joi.string().when('type', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'Content is required for text type'
  })
});

// Generate validation schemas
const generateSchema = Joi.object({
  inputId: Joi.string().optional().messages({
    'string.base': 'Input ID must be a string'
  })
});

// Artifact validation schemas
const artifactUpdateSchema = Joi.object({
  content: Joi.alternatives().try(
    Joi.string(),
    Joi.object()
  ).required().messages({
    'any.required': 'Content is required'
  })
});

// Jira integration validation schemas
const jiraIntegrationSchema = Joi.object({
  jiraUrl: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid Jira URL',
    'any.required': 'Jira URL is required'
  }),
  apiKey: Joi.string().min(1).required().messages({
    'any.required': 'API key is required'
  }),
  projectKey: Joi.string().min(1).required().messages({
    'any.required': 'Project key is required'
  })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    // Log the request for debugging
    console.log('Validation check:', {
      method: req.method,
      path: req.path,
      body: req.body,
      contentType: req.headers['content-type']
    });
    
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      console.log('Validation failed:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors
      });
    }
    
    req.query = value;
    next();
  };
};

// Pagination query schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).allow('').optional()
});

module.exports = {
  validate,
  validateQuery,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  projectSchema,
  projectUpdateSchema,
  inputSchema,
  generateSchema,
  artifactUpdateSchema,
  jiraIntegrationSchema,
  paginationSchema
};
