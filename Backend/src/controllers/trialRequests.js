const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new trial request
 * POST /api/trial-requests
 */
const createTrialRequest = asyncHandler(async (req, res) => {
  const { email, company, teamSize, useCase } = req.body;

  // Validate required fields
  if (!email || !company) {
    return res.status(400).json({
      success: false,
      message: 'Email and company are required'
    });
  }

  // Check if trial request already exists for this email
  const existingRequest = await prisma.trialRequest.findFirst({
    where: { email }
  });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'Trial request already exists for this email'
    });
  }

  // Create trial request
  const trialRequest = await prisma.trialRequest.create({
    data: {
      email,
      company,
      teamSize: teamSize || null,
      useCase: useCase || null,
      status: 'pending'
    },
    select: {
      id: true,
      email: true,
      company: true,
      teamSize: true,
      useCase: true,
      status: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Trial request submitted successfully',
    data: { trialRequest }
  });
});

/**
 * Get all trial requests (admin only)
 * GET /api/trial-requests
 */
const getTrialRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};
  if (status) {
    where.status = status;
  }

  // Get trial requests with pagination
  const [trialRequests, total] = await Promise.all([
    prisma.trialRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.trialRequest.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      trialRequests,
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
 * Update trial request status (admin only)
 * PUT /api/trial-requests/:id
 */
const updateTrialRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (pending, contacted, approved, rejected)'
    });
  }

  const trialRequest = await prisma.trialRequest.update({
    where: { id: parseInt(id) },
    data: { 
      status,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      company: true,
      teamSize: true,
      useCase: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Trial request status updated successfully',
    data: { trialRequest }
  });
});

/**
 * Delete trial request (admin only)
 * DELETE /api/trial-requests/:id
 */
const deleteTrialRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.trialRequest.delete({
    where: { id: parseInt(id) }
  });

  res.status(204).send();
});

module.exports = {
  createTrialRequest,
  getTrialRequests,
  updateTrialRequestStatus,
  deleteTrialRequest
};
