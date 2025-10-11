const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new email capture
 * POST /api/email-captures
 */
const createEmailCapture = asyncHandler(async (req, res) => {
  const { email, source = 'impact_page' } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Check if email already exists for this source
  const existingCapture = await prisma.emailCapture.findFirst({
    where: { 
      email,
      source 
    }
  });

  if (existingCapture) {
    return res.status(400).json({
      success: false,
      message: 'Email already captured from this source'
    });
  }

  // Create email capture
  const emailCapture = await prisma.emailCapture.create({
    data: {
      email,
      source
    },
    select: {
      id: true,
      email: true,
      source: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Email captured successfully',
    data: { emailCapture }
  });
});

/**
 * Get all email captures (admin only)
 * GET /api/email-captures
 */
const getEmailCaptures = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, source = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};
  if (source) {
    where.source = source;
  }

  // Get email captures with pagination
  const [emailCaptures, total] = await Promise.all([
    prisma.emailCapture.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.emailCapture.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      emailCaptures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Get email capture statistics (admin only)
 * GET /api/email-captures/stats
 */
const getEmailCaptureStats = asyncHandler(async (req, res) => {
  const [totalCaptures, capturesBySource, recentCaptures] = await Promise.all([
    prisma.emailCapture.count(),
    prisma.emailCapture.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    }),
    prisma.emailCapture.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalCaptures,
      recentCaptures,
      capturesBySource: capturesBySource.map(item => ({
        source: item.source,
        count: item._count.id
      }))
    }
  });
});

/**
 * Delete email capture (admin only)
 * DELETE /api/email-captures/:id
 */
const deleteEmailCapture = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.emailCapture.delete({
    where: { id: parseInt(id) }
  });

  res.status(204).send();
});

module.exports = {
  createEmailCapture,
  getEmailCaptures,
  getEmailCaptureStats,
  deleteEmailCapture
};
