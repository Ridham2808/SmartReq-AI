import prisma from '../config/db.js'

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body
    const ownerId = req.user.id

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId
      }
    })

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    })
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    })
  }
}

export const getProjects = async (req, res) => {
  try {
    const ownerId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const skip = (page - 1) * limit
    const take = parseInt(limit)

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { inputs: true, artifacts: true }
          }
        }
      }),
      prisma.project.count({ where: { ownerId } })
    ])

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      }
    })
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: error.message
    })
  }
}

export const getProject = async (req, res) => {
  try {
    const { id } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        ownerId
      },
      include: {
        inputs: true,
        artifacts: true
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    res.json({
      success: true,
      data: { project }
    })
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: error.message
    })
  }
}

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { name, description }
    })

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    })
  }
}

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    await prisma.project.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    })
  }
}