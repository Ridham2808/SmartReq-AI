/**
 * Input History Routes
 * Handles input history and project activity tracking
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * GET /api/input-history/user/:userId
 * Get all inputs for a specific user across all projects
 */
router.get('/user/:userId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, projectId } = req.query;
    
    // Verify user can access this data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      project: {
        ownerId: userId
      }
    };
    
    if (projectId) {
      where.projectId = projectId;
    }

    const [inputs, totalCount] = await Promise.all([
      prisma.input.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: parseInt(skip),
        take: parseInt(limit)
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
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      },
      message: 'Input history retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching input history', { error: error.message, userId: req.params.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch input history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * GET /api/input-history/project/:projectId
 * Get input history for a specific project
 */
router.get('/project/:projectId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ownerId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Build where clause
    const where = {
      projectId: parseInt(projectId)
    };
    
    if (type) {
      where.type = type;
    }

    const [inputs, totalCount] = await Promise.all([
      prisma.input.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.input.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        inputs,
        project: {
          id: project.id,
          name: project.name,
          description: project.description
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      },
      message: 'Project input history retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching project input history', { error: error.message, projectId: req.params.projectId });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project input history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * GET /api/input-history/recent
 * Get recent inputs for the authenticated user
 */
router.get('/recent', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const inputs = await prisma.input.findMany({
      where: {
        project: {
          ownerId: req.user.id
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: inputs,
      message: 'Recent inputs retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching recent inputs', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent inputs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * GET /api/input-history/stats
 * Get input statistics for the authenticated user
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalInputs,
      inputsByType,
      inputsByProject,
      recentActivity
    ] = await Promise.all([
      // Total inputs count
      prisma.input.count({
        where: {
          project: {
            ownerId: userId
          }
        }
      }),
      
      // Inputs by type
      prisma.input.groupBy({
        by: ['type'],
        where: {
          project: {
            ownerId: userId
          }
        },
        _count: {
          type: true
        }
      }),
      
      // Inputs by project
      prisma.input.groupBy({
        by: ['projectId'],
        where: {
          project: {
            ownerId: userId
          }
        },
        _count: {
          projectId: true
        }
      }),
      
      // Recent activity (last 7 days)
      prisma.input.count({
        where: {
          project: {
            ownerId: userId
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get project names for inputs by project
    const projectIds = inputsByProject.map(item => item.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        ownerId: userId
      },
      select: {
        id: true,
        name: true
      }
    });

    const inputsByProjectWithNames = inputsByProject.map(item => {
      const project = projects.find(p => p.id === item.projectId);
      return {
        projectId: item.projectId,
        projectName: project?.name || 'Unknown Project',
        count: item._count.projectId
      };
    });

    res.json({
      success: true,
      data: {
        totalInputs,
        inputsByType: inputsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        inputsByProject: inputsByProjectWithNames,
        recentActivity: {
          last7Days: recentActivity
        }
      },
      message: 'Input statistics retrieved successfully'
    });

  } catch (error) {
    logger.error('Error fetching input statistics', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch input statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

module.exports = router;
