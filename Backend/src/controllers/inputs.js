import prisma from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { processUploadedFile, deleteFile } from '../utils/fileUtils.js'

/**
 * Create a new input
 * POST /api/projects/:projectId/inputs
 */
export const createInput = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { type, content } = req.body;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  let inputData = {
    projectId: parseInt(projectId),
    type,
    content: null,
    filePath: null
  };

  // Handle different input types
  if (type === 'text') {
    inputData.content = content;
  } else if (type === 'voice' || type === 'document') {
    // Process uploaded file
    const fileInfo = await processUploadedFile(req.file, type);
    inputData.filePath = fileInfo.path;
    inputData.content = fileInfo.processedText || null;
  }

  // Create input
  const input = await prisma.input.create({
    data: inputData,
    select: {
      id: true,
      type: true,
      content: true,
      filePath: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Input created successfully',
    data: { input }
  });
});

/**
 * Get all inputs for a project
 * GET /api/projects/:projectId/inputs
 */
export const getInputs = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { type, page = 1, limit = 10 } = req.query;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    projectId: parseInt(projectId)
  };

  if (type) {
    where.type = type;
  }

  // Get inputs with pagination
  const [inputs, total] = await Promise.all([
    prisma.input.findMany({
      where,
      select: {
        id: true,
        type: true,
        content: true,
        filePath: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.input.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      inputs,
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
 * Get input by ID
 * GET /api/projects/:projectId/inputs/:inputId
 */
export const getInput = asyncHandler(async (req, res) => {
  const { projectId, inputId } = req.params;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Get input
  const input = await prisma.input.findFirst({
    where: {
      id: parseInt(inputId),
      projectId: parseInt(projectId)
    },
    select: {
      id: true,
      type: true,
      content: true,
      filePath: true,
      createdAt: true
    }
  });

  if (!input) {
    return res.status(404).json({
      success: false,
      message: 'Input not found'
    });
  }

  res.json({
    success: true,
    data: { input }
  });
});

/**
 * Delete input
 * DELETE /api/projects/:projectId/inputs/:inputId
 */
export const deleteInput = asyncHandler(async (req, res) => {
  const { projectId, inputId } = req.params;
  const userId = req.user.id;

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Get input to check file path
  const input = await prisma.input.findFirst({
    where: {
      id: parseInt(inputId),
      projectId: parseInt(projectId)
    }
  });

  if (!input) {
    return res.status(404).json({
      success: false,
      message: 'Input not found'
    });
  }

  // Delete associated file if exists
  if (input.filePath) {
    await deleteFile(input.filePath);
  }

  // Delete input
  await prisma.input.delete({
    where: { id: parseInt(inputId) }
  });

  res.status(204).send();
});