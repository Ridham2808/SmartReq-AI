import { config } from '../config/env.js'

export const sendVerificationEmail = async (email, name, code) => {
  try {
    // Mock email sending - will be replaced with actual email service (SendGrid/Mailgun)
    console.log(`📧 Sending verification email to: ${email}`)
    console.log(`Verification code: ${code}`)
    console.log(`Recipient: ${name}`)
    
    // Simulate email content
    const emailContent = `
      Hi ${name},
      
      Welcome to SmartReq AI! Please verify your email address using the code below:
      
      Verification Code: ${code}
      
      This code will expire in 24 hours.
      
      Best regards,
      SmartReq AI Team
    `
    
    console.log('Email content:', emailContent)
    
    return { 
      success: true,
      message: 'Verification email sent successfully'
    }
  } catch (error) {
    console.error('Send verification email error:', error)
    throw error
  }
}

export const sendPasswordResetEmail = async (email, name, code) => {
  try {
    // Mock email sending
    console.log(`📧 Sending password reset email to: ${email}`)
    console.log(`Reset code: ${code}`)
    
    const emailContent = `
      Hi ${name},
      
      We received a request to reset your password. Use the code below:
      
      Reset Code: ${code}
      
      This code will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      SmartReq AI Team
    `
    
    console.log('Email content:', emailContent)
    
    return { 
      success: true,
      message: 'Password reset email sent successfully'
    }
  } catch (error) {
    console.error('Send password reset email error:', error)
    throw error
  }
}

export const generateVerificationCode = () => {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const checkEmailServiceHealth = async () => {
  try {
    // Mock health check - will be replaced with actual service check
    console.log('Checking email service health...')
    
    return {
      status: 'healthy',
      message: 'Email service is operational',
      provider: 'Mock (Ready for SendGrid/Mailgun)'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Email service check failed',
      error: error.message
    }
  }
}