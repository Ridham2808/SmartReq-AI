const prisma = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new demo request
 * POST /api/demo-requests
 */
const createDemoRequest = asyncHandler(async (req, res) => {
  const { email, company, name, requirements } = req.body;

  // Validate required fields
  if (!email || !company) {
    return res.status(400).json({
      success: false,
      message: 'Email and company are required'
    });
  }

  // Check if demo request already exists for this email
  const existingRequest = await prisma.demoRequest.findFirst({
    where: { email }
  });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'Demo request already exists for this email'
    });
  }

  // Create demo request
  const demoRequest = await prisma.demoRequest.create({
    data: {
      email,
      company,
      name: name || null,
      requirements: requirements || null,
      status: 'pending'
    },
    select: {
      id: true,
      email: true,
      company: true,
      name: true,
      requirements: true,
      status: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Demo request submitted successfully',
    data: { demoRequest }
  });
});

/**
 * Get all demo requests (admin only)
 * GET /api/demo-requests
 */
const getDemoRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};
  if (status) {
    where.status = status;
  }

  // Get demo requests with pagination
  const [demoRequests, total] = await Promise.all([
    prisma.demoRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.demoRequest.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      demoRequests,
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
 * Update demo request status (admin only)
 * PUT /api/demo-requests/:id
 */
const updateDemoRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'contacted', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (pending, contacted, completed, rejected)'
    });
  }

  const demoRequest = await prisma.demoRequest.update({
    where: { id: parseInt(id) },
    data: { 
      status,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      company: true,
      name: true,
      requirements: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Demo request status updated successfully',
    data: { demoRequest }
  });
});

/**
 * Delete demo request (admin only)
 * DELETE /api/demo-requests/:id
 */
const deleteDemoRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.demoRequest.delete({
    where: { id: parseInt(id) }
  });

  res.status(204).send();
});

module.exports = {
  createDemoRequest,
  getDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest
};
