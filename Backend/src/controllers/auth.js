const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, logger } = require('../middleware/errorHandler');
const { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const config = require('../config/env');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate 6-digit verification code and expiry (24h)
  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create user as unverified with code
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationExpiry
    },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true
    }
  });

  // Send verification email with code
  try {
    await sendVerificationEmail(email, name, verificationCode);
    logger.info(`User registered: ${email} (ID: ${user.id}). Verification email sent.`);
  } catch (error) {
    logger.error('Failed to send verification email after registration:', error);
    // Note: user is created; client can request resend
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please verify your email using the 6-digit code sent to you.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: false,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Log the request for debugging
  console.log('Login attempt:', { 
    email, 
    rememberMe,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    method: req.method,
    url: req.url
  });

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Enforce email verification before login
  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required.',
      requiresVerification: true
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate JWT token with appropriate expiry based on rememberMe
  const tokenExpiry = rememberMe ? '30d' : '7d'; // 30 days if rememberMe is true, 7 days otherwise
  const token = generateToken(user.id, tokenExpiry);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      token,
      rememberMe: rememberMe || false
    }
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Verify user email with verification code
 * POST /api/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  // Debug: Log everything about the request
  console.log('=== VERIFY EMAIL DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('========================');

  const { email, verificationCode, code } = req.body;
  
  // Handle both field names (frontend sends 'code', backend expects 'verificationCode')
  const actualVerificationCode = verificationCode || code;

  // Basic validation
  if (!email || !actualVerificationCode) {
    console.log('Validation failed - missing fields:', {
      email: !!email,
      verificationCode: !!verificationCode,
      code: !!code,
      actualVerificationCode: !!actualVerificationCode,
      emailValue: email,
      codeValue: actualVerificationCode
    });
    return res.status(400).json({
      success: false,
      message: 'Email and verification code are required'
    });
  }

  // Debug logging
  console.log('Email verification attempt:', {
    email,
    verificationCode,
    code,
    actualVerificationCode,
    codeType: typeof actualVerificationCode,
    codeLength: actualVerificationCode?.length,
    rawBody: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log('User not found for email:', email);
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Debug logging for user data
  console.log('User found:', {
    id: user.id,
    email: user.email,
    isVerified: user.isVerified,
    storedCode: user.verificationCode,
    storedCodeType: typeof user.verificationCode,
    storedCodeLength: user.verificationCode?.length,
    verificationExpiry: user.verificationExpiry
  });

  // Check if already verified
  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Normalize verification codes for comparison (remove any whitespace, convert to string)
  const normalizedProvided = actualVerificationCode.toString().trim();
  const normalizedStored = user.verificationCode?.toString().trim();
  
  console.log('Code comparison:', {
    provided: actualVerificationCode,
    normalizedProvided,
    stored: user.verificationCode,
    normalizedStored,
    exactMatch: normalizedStored === normalizedProvided
  });

  // Check verification code
  if (normalizedStored !== normalizedProvided) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code'
    });
  }

  // Check if code is expired
  if (user.verificationExpiry && new Date() > user.verificationExpiry) {
    return res.status(400).json({
      success: false,
      message: 'Verification code has expired. Please request a new one.'
    });
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationCode: null,
      verificationExpiry: null
    }
  });

  res.json({
    success: true,
    message: 'Email verified successfully! You can now login to your account.'
  });
});

/**
 * Request password reset code
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not leak existence; respond success
    return res.json({ success: true, message: 'If the email exists, a reset code has been sent' });
  }

  const resetCode = generateVerificationCode();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode, resetExpiry }
  });

  try {
    await sendPasswordResetEmail(email, user.name, resetCode);
  } catch (error) {
    // Still respond success to avoid user enumeration; log error
    logger.error('Failed to send reset email:', error.message || error);
  }

  res.json({ success: true, message: 'If the email exists, a reset code has been sent' });
});

/**
 * Reset password using code
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid reset request' });
  }

  if (!user.resetCode || user.resetCode !== resetCode) {
    return res.status(400).json({ success: false, message: 'Invalid reset code' });
  }

  if (!user.resetExpiry || new Date() > user.resetExpiry) {
    return res.status(400).json({ success: false, message: 'Reset code has expired' });
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetCode: null,
      resetExpiry: null
    }
  });

  res.json({ success: true, message: 'Password has been reset successfully' });
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already verified
  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user with new verification code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode,
      verificationExpiry
    }
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, user.name, verificationCode);
    logger.info(`Verification email resent to ${email}`);
  } catch (error) {
    logger.error('Failed to resend verification email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!currentUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== currentUser.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }
  }

  // If password change is requested
  if (currentPassword && newPassword) {
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user with new password and other fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || currentUser.name,
        email: email || currentUser.email,
        password: hashedNewPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true
      }
    });

    logger.info(`User profile updated with password change: ${updatedUser.email}`);
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  }

  // Update user without password change
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || currentUser.name,
      email: email || currentUser.email
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true
    }
  });

  logger.info(`User profile updated: ${updatedUser.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
});

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile
};