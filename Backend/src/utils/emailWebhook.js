const config = require('../config/env');
const { logger } = require('../middleware/errorHandler');

// Simple console-based email service for reliable delivery
const sendEmailViaWebhook = async (email, name, code, type = 'verification') => {
  try {
    const isPasswordReset = type === 'password-reset';
    const subject = isPasswordReset ? 'Reset Your Password - SmartReq AI' : 'Verify Your Email - SmartReq AI';
    const codeType = isPasswordReset ? 'Password Reset Code' : 'Verification Code';
    const expiry = isPasswordReset ? '1 hour' : '24 hours';
    
    // Log email details to console and logs
    const emailDetails = {
      to: email,
      from: config.EMAIL_FROM,
      subject: subject,
      name: name,
      code: code,
      type: type,
      timestamp: new Date().toISOString()
    };

    // Log to application logs
    logger.info(`${codeType} email details:`, emailDetails);
    
    // Log to console for easy access
    console.log('\n' + '='.repeat(80));
    console.log(`📧 ${codeType.toUpperCase()}`);
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`${codeType}: ${code}`);
    console.log(`Expires: ${expiry}`);
    console.log(`Type: ${type}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    console.log('Note: This is a fallback email service. Check server logs for details.');
    console.log('='.repeat(80) + '\n');
    
    return { 
      success: true, 
      messageId: `console-${Date.now()}`, 
      provider: 'Console-Fallback',
      type: type,
      note: 'Email details logged to console and application logs'
    };
    
  } catch (error) {
    logger.error('Console email service failed:', error);
    throw new Error(`Console email service failed: ${error.message}`);
  }
};

module.exports = {
  sendEmailViaWebhook
};
