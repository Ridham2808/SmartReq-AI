const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get user profile
 * GET /api/user/profile
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      phone: true,
      role: true,
      company: true,
      location: true,
      website: true,
      bio: true,
      twitter: true,
      linkedin: true,
      github: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Update user profile
 * PUT /api/user/profile
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    avatarUrl,
    phone,
    role,
    company,
    location,
    website,
    bio,
    twitter,
    linkedin,
    github
  } = req.body;

  // Validate name if provided
  if (name !== undefined && (!name || name.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Name cannot be empty'
    });
  }

  // Validate URL fields if provided
  const urlFields = { website, twitter, linkedin, github };
  for (const [field, value] of Object.entries(urlFields)) {
    if (value && value.trim().length > 0) {
      try {
        new URL(value);
      } catch {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} URL format`
        });
      }
    }
  }

  // Update user profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(role !== undefined && { role: role || null }),
      ...(company !== undefined && { company: company || null }),
      ...(location !== undefined && { location: location || null }),
      ...(website !== undefined && { website: website || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(twitter !== undefined && { twitter: twitter || null }),
      ...(linkedin !== undefined && { linkedin: linkedin || null }),
      ...(github !== undefined && { github: github || null })
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      phone: true,
      role: true,
      company: true,
      location: true,
      website: true,
      bio: true,
      twitter: true,
      linkedin: true,
      github: true,
      lastLoginAt: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * Update last login time
 * PUT /api/user/last-login
 */
const updateLastLogin = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  });

  res.json({
    success: true,
    message: 'Last login updated'
  });
});

/**
 * Delete user account
 * DELETE /api/user/profile
 */
const deleteUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required to delete account'
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify password
  const bcrypt = require('bcrypt');
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Delete user (cascade delete will handle projects, inputs, artifacts)
  await prisma.user.delete({
    where: { id: userId }
  });

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateLastLogin,
  deleteUserProfile
};
