import { logger } from '../middleware/errorHandler.js';
import sgMail from '@sendgrid/mail';
import config from '../config/env.js';

// Generate unique verification code
const generateVerificationCode = () => {
  // Generate a 6-digit random number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email via SendGrid
const sendVerificationEmail = async (email, name, verificationCode) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const sender = process.env.SENDER_EMAIL || config.EMAIL_FROM;

    if (!apiKey) throw new Error('SENDGRID_API_KEY is not configured');
    if (!sender) throw new Error('SENDER_EMAIL is not configured');

    sgMail.setApiKey(apiKey);

    const subject = 'Verify Your Email - SmartReq AI';

    const msg = {
      to: email,
      from: sender,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Email Verification</title>
        </head>
          <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#333;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.06);overflow:hidden;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 24px;text-align:center;">
                        <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:0.5px;">SmartReq AI</h1>
                        <p style="margin:8px 0 0;color:#e9e9ff;font-size:14px;">Email Verification</p>
                    </td>
                  </tr>
                  <tr>
                      <td style="padding:28px 24px;">
                        <h2 style="margin:0 0 12px 0;font-size:20px;color:#333;">Welcome ${name}!</h2>
                        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#555;">
                          Use the verification code below to complete your registration:
                        </p>
                        <div style="background:#f7f9ff;border:2px dashed #667eea;border-radius:10px;padding:18px;text-align:center;margin:18px 0;">
                          <span style="display:inline-block;font-size:30px;letter-spacing:6px;font-family:Courier New,monospace;font-weight:700;color:#3b4cca;">
                ${verificationCode}
                          </span>
            </div>
                        <p style="margin:0 0 8px 0;font-size:13px;color:#666;">This code expires in 24 hours.</p>
                        <p style="margin:0;font-size:12px;color:#999;">If you didn’t request this, you can ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 24px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px;">
                        © 2024 SmartReq AI. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Your SmartReq AI verification code is: ${verificationCode} (valid for 24 hours)`
    };

    const [response] = await sgMail.send(msg);
    logger.info(`Verification email sent to ${email} via SendGrid (inline HTML). Status: ${response.statusCode}`);
    return { success: true, provider: 'SendGrid', statusCode: response.statusCode };
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send password reset email via SendGrid (inline HTML)
const sendPasswordResetEmail = async (email, name, resetCode) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const sender = process.env.SENDER_EMAIL || config.EMAIL_FROM;

    if (!apiKey) throw new Error('SENDGRID_API_KEY is not configured');
    if (!sender) throw new Error('SENDER_EMAIL is not configured');

    sgMail.setApiKey(apiKey);

    const subject = 'Reset Your Password - SmartReq AI';

    const msg = {
      to: email,
      from: sender,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Password Reset</title>
          </head>
          <body style=\"margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#333;\">
            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f6f7fb;padding:24px 0;\">
              <tr>
                <td align=\"center\">
                  <table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.06);overflow:hidden;\">
                    <tr>
                      <td style=\"background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 24px;text-align:center;\">
                        <h1 style=\"margin:0;color:#fff;font-size:24px;\">SmartReq AI</h1>
                        <p style=\"margin:8px 0 0;color:#e9e9ff;font-size:14px;\">Password Reset</p>
                      </td>
                    </tr>
                    <tr>
                      <td style=\"padding:28px 24px;\">
                        <h2 style=\"margin:0 0 12px 0;font-size:20px;color:#333;\">Hi ${name},</h2>
                        <p style=\"margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#555;\">
                          Use the code below to reset your password:
                        </p>
                        <div style=\"background:#fff7f7;border:2px dashed #e74c3c;border-radius:10px;padding:18px;text-align:center;margin:18px 0;\">
                          <span style=\"display:inline-block;font-size:30px;letter-spacing:6px;font-family:Courier New,monospace;font-weight:700;color:#e74c3c;\">${resetCode}</span>
                        </div>
                        <p style=\"margin:0 0 8px 0;font-size:13px;color:#666;\">This code expires in 1 hour.</p>
                        <p style=\"margin:0;font-size:12px;color:#999;\">If you didn’t request this, you can ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style=\"padding:18px 24px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px;\">
                        © 2024 SmartReq AI. All rights reserved.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Your SmartReq AI password reset code is: ${resetCode} (valid for 1 hour)`
    };

    const [response] = await sgMail.send(msg);
    logger.info(`Password reset email sent to ${email} via SendGrid (inline HTML). Status: ${response.statusCode}`);
    return { success: true, provider: 'SendGrid', statusCode: response.statusCode };
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Check email service health
const checkEmailServiceHealth = async () => {
  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });

    const domain = process.env.MAILGUN_DOMAIN || "sandboxc5dc3bb641da48f0a4a442fa67efb33f.mailgun.org";

    return {
      status: 'healthy',
      message: 'Mailgun client initialized',
      provider: 'Mailgun',
      domain: domain,
      note: 'Sandbox domain - recipients must be authorized'
    };
  } catch (error) {
    logger.error('Email service health check failed:', error.message);
    return {
      status: 'unhealthy',
      message: 'Email service unavailable',
      error: error.message
    };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });

    const domain = process.env.MAILGUN_DOMAIN || "sandboxc5dc3bb641da48f0a4a442fa67efb33f.mailgun.org";

    // Test by sending to syntaxsorcery4@gmail.com (should be authorized)
    const data = await mg.messages.create(domain, {
      from: `SmartReq AI <postmaster@${domain}>`,
      to: ["syntaxsorcery4@gmail.com"],
      subject: "Mailgun Test - SmartReq AI",
      text: "This is a test email to verify Mailgun configuration."
    });

    return {
      success: true,
      message: 'Mailgun connection verified and test email sent',
      messageId: data.id
    };
  } catch (error) {
    logger.error('Mailgun configuration test failed:', error.message);
    return { success: false, error: error.message };
  }
};

export {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConfiguration,
  checkEmailServiceHealth
};