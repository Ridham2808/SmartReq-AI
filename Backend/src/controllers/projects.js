import prisma from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'

/**
 * Create a new project
 * POST /api/projects
 */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  // Check if project name is unique for this user
  const existingProject = await prisma.project.findFirst({
    where: {
      name,
      ownerId: userId
    }
  });

  if (existingProject) {
    return res.status(400).json({
      success: false,
      message: 'Project with this name already exists'
    });
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      ownerId: userId
    },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project }
  });
});

/**
 * Get all projects for current user
 * GET /api/projects
 */
export const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, search = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    ownerId: userId
  };

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }

  // Get projects with pagination
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            inputs: true,
            artifacts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      projects,
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
 * Get project by ID
 * GET /api/projects/:id
 */
export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(id),
      ownerId: userId
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          inputs: true,
          artifacts: true
        }
      }
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.json({
    success: true,
    data: { project }
  });
});

/**
 * Update project
 * PUT /api/projects/:id
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  // Check if project exists and user owns it
  const existingProject = await prisma.project.findFirst({
    where: {
      id: parseInt(id),
      ownerId: userId
    }
  });

  if (!existingProject) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if new name is unique (if name is being changed)
  if (name && name !== existingProject.name) {
    const duplicateProject = await prisma.project.findFirst({
      where: {
        name,
        ownerId: userId,
        id: { not: parseInt(id) }
      }
    });

    if (duplicateProject) {
      return res.status(400).json({
        success: false,
        message: 'Project with this name already exists'
      });
    }
  }

  // Update project
  const project = await prisma.project.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description })
    },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project }
  });
});

/**
 * Delete project
 * DELETE /api/projects/:id
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(id),
      ownerId: userId
    }
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Delete project (cascade delete will handle inputs and artifacts)
  await prisma.project.delete({
    where: { id: parseInt(id) }
  });

  res.status(204).send();
});