import prisma from '../config/db.js'
import { asyncHandler } from '../middleware/errorHandler.js'

/**
 * Get all artifacts for a project
 * GET /api/projects/:projectId/artifacts
 */
export const getArtifacts = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const { type, page = 1, limit = 10 } = req.query
  const userId = req.user.id

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const take = parseInt(limit)

  // Build where clause
  const where = {
    projectId: parseInt(projectId)
  }

  if (type) {
    where.type = type
  }

  // Get artifacts with pagination
  const [artifacts, total] = await Promise.all([
    prisma.artifact.findMany({
      where,
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.artifact.count({ where })
  ])

  res.json({
    success: true,
    data: {
      artifacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  })
})

/**
 * Get artifact by ID
 * GET /api/projects/:projectId/artifacts/:artifactId
 */
export const getArtifact = asyncHandler(async (req, res) => {
  const { projectId, artifactId } = req.params
  const userId = req.user.id

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  // Get artifact
  const artifact = await prisma.artifact.findFirst({
    where: {
      id: parseInt(artifactId),
      projectId: parseInt(projectId)
    },
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true
    }
  })

  if (!artifact) {
    return res.status(404).json({
      success: false,
      message: 'Artifact not found'
    })
  }

  res.json({
    success: true,
    data: { artifact }
  })
})

/**
 * Update artifact
 * PUT /api/projects/:projectId/artifacts/:artifactId
 */
export const updateArtifact = asyncHandler(async (req, res) => {
  const { projectId, artifactId } = req.params
  const { content } = req.body
  const userId = req.user.id

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  // Check if artifact exists
  const existingArtifact = await prisma.artifact.findFirst({
    where: {
      id: parseInt(artifactId),
      projectId: parseInt(projectId)
    }
  })

  if (!existingArtifact) {
    return res.status(404).json({
      success: false,
      message: 'Artifact not found'
    })
  }

  // Update artifact
  const artifact = await prisma.artifact.update({
    where: { id: parseInt(artifactId) },
    data: { content },
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true
    }
  })

  res.json({
    success: true,
    message: 'Artifact updated successfully',
    data: { artifact }
  })
})

/**
 * Delete artifact
 * DELETE /api/projects/:projectId/artifacts/:artifactId
 */
export const deleteArtifact = asyncHandler(async (req, res) => {
  const { projectId, artifactId } = req.params
  const userId = req.user.id

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  // Check if artifact exists
  const artifact = await prisma.artifact.findFirst({
    where: {
      id: parseInt(artifactId),
      projectId: parseInt(projectId)
    }
  })

  if (!artifact) {
    return res.status(404).json({
      success: false,
      message: 'Artifact not found'
    })
  }

  // Delete artifact
  await prisma.artifact.delete({
    where: { id: parseInt(artifactId) }
  })

  res.status(204).send()
})

/**
 * Get artifacts summary for a project
 * GET /api/projects/:projectId/artifacts/summary
 */
export const getArtifactsSummary = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const userId = req.user.id

  // Verify project exists and user owns it
  const project = await prisma.project.findFirst({
    where: {
      id: parseInt(projectId),
      ownerId: userId
    }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    })
  }

  // Get summary statistics
  const [totalArtifacts, storiesCount, flowsCount] = await Promise.all([
    prisma.artifact.count({
      where: { projectId: parseInt(projectId) }
    }),
    prisma.artifact.count({
      where: { 
        projectId: parseInt(projectId),
        type: 'story'
      }
    }),
    prisma.artifact.count({
      where: { 
        projectId: parseInt(projectId),
        type: 'flow'
      }
    })
  ])

  // Get recent artifacts
  const recentArtifacts = await prisma.artifact.findMany({
    where: { projectId: parseInt(projectId) },
    select: {
      id: true,
      type: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  res.json({
    success: true,
    data: {
      summary: {
        totalArtifacts,
        storiesCount,
        flowsCount
      },
      recentArtifacts
    }
  })
})

// Convenience: create/update/delete user stories as dedicated endpoints
export const createUserStory = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const userId = req.user.id
  const { content } = req.body || {}
  if (!content || !String(content).trim()) {
    return res.status(400).json({ success: false, message: 'Content is required' })
  }
  const project = await prisma.project.findFirst({ where: { id: parseInt(projectId), ownerId: userId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }
  const story = await prisma.artifact.create({ data: { projectId: parseInt(projectId), type: 'story', content: { content: String(content).trim() } } })
  return res.status(201).json({ success: true, data: { id: story.id } })
})

export const updateUserStory = asyncHandler(async (req, res) => {
  const { projectId, storyId } = req.params
  const userId = req.user.id
  const { content } = req.body || {}
  if (!content || !String(content).trim()) {
    return res.status(400).json({ success: false, message: 'Content is required' })
  }
  const project = await prisma.project.findFirst({ where: { id: parseInt(projectId), ownerId: userId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }
  await prisma.artifact.update({ where: { id: parseInt(storyId) }, data: { content: { content: String(content).trim() } } })
  return res.json({ success: true })
})

export const deleteUserStory = asyncHandler(async (req, res) => {
  const { projectId, storyId } = req.params
  const userId = req.user.id
  const project = await prisma.project.findFirst({ where: { id: parseInt(projectId), ownerId: userId } })
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' })
  }
  await prisma.artifact.delete({ where: { id: parseInt(storyId) } })
  return res.status(204).send()
})