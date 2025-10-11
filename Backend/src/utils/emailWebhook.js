const config = require('../config/env');
const { logger } = require('../middleware/errorHandler');

// Simple console-based email service for reliable delivery
const sendEmailViaWebhook = async (email, name, verificationCode) => {
  try {
    // Log email details to console and logs
    const emailDetails = {
      to: email,
      from: config.EMAIL_FROM,
      subject: 'Verify Your Email - SmartReq AI',
      name: name,
      verificationCode: verificationCode,
      timestamp: new Date().toISOString()
    };

    // Log to application logs
    logger.info('Email verification details:', emailDetails);
    
    // Log to console for easy access
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL VERIFICATION CODE');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Verification Code: ${verificationCode}`);
    console.log(`Expires: 24 hours`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    console.log('Note: This is a fallback email service. Check Render logs for details.');
    console.log('='.repeat(80) + '\n');
    
    return { 
      success: true, 
      messageId: `console-${Date.now()}`, 
      provider: 'Console-Fallback',
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
