import prisma from '../config/db.js'

export const getArtifacts = async (req, res) => {
  try {
    const { projectId } = req.params
    const ownerId = req.user.id
    const { type } = req.query

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const where = { projectId: parseInt(projectId) }
    if (type) where.type = type

    const artifacts = await prisma.artifact.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: { artifacts }
    })
  } catch (error) {
    console.error('Get artifacts error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get artifacts',
      error: error.message
    })
  }
}

export const getArtifactsSummary = async (req, res) => {
  try {
    const { projectId } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const [totalStories, totalFlows] = await Promise.all([
      prisma.artifact.count({
        where: { projectId: parseInt(projectId), type: 'story' }
      }),
      prisma.artifact.count({
        where: { projectId: parseInt(projectId), type: 'flow' }
      })
    ])

    res.json({
      success: true,
      data: {
        totalStories,
        totalFlows,
        totalArtifacts: totalStories + totalFlows
      }
    })
  } catch (error) {
    console.error('Get artifacts summary error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get artifacts summary',
      error: error.message
    })
  }
}

export const getArtifact = async (req, res) => {
  try {
    const { projectId, artifactId } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

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

    res.json({
      success: true,
      data: { artifact }
    })
  } catch (error) {
    console.error('Get artifact error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get artifact',
      error: error.message
    })
  }
}

export const updateArtifact = async (req, res) => {
  try {
    const { projectId, artifactId } = req.params
    const { content } = req.body
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

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

    const updatedArtifact = await prisma.artifact.update({
      where: { id: parseInt(artifactId) },
      data: { content }
    })

    res.json({
      success: true,
      message: 'Artifact updated successfully',
      data: { artifact: updatedArtifact }
    })
  } catch (error) {
    console.error('Update artifact error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update artifact',
      error: error.message
    })
  }
}

export const deleteArtifact = async (req, res) => {
  try {
    const { projectId, artifactId } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

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

    await prisma.artifact.delete({
      where: { id: parseInt(artifactId) }
    })

    res.json({
      success: true,
      message: 'Artifact deleted successfully'
    })
  } catch (error) {
    console.error('Delete artifact error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete artifact',
      error: error.message
    })
  }
}