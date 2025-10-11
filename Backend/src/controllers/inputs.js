import prisma from '../config/db.js'
import { deleteFile } from '../utils/fileUtils.js'
import path from 'path'

export const createInput = async (req, res) => {
  try {
    const { projectId } = req.params
    const { type, content } = req.body
    const ownerId = req.user.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const inputData = {
      projectId: parseInt(projectId),
      type,
      content: type === 'text' ? content : null,
      filePath: req.file ? req.file.path : null
    }

    const input = await prisma.input.create({
      data: inputData
    })

    res.status(201).json({
      success: true,
      message: 'Input created successfully',
      data: { input }
    })
  } catch (error) {
    console.error('Create input error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create input',
      error: error.message
    })
  }
}

export const getInputs = async (req, res) => {
  try {
    const { projectId } = req.params
    const ownerId = req.user.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const inputs = await prisma.input.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: { inputs }
    })
  } catch (error) {
    console.error('Get inputs error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get inputs',
      error: error.message
    })
  }
}

export const getInput = async (req, res) => {
  try {
    const { projectId, inputId } = req.params
    const ownerId = req.user.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const input = await prisma.input.findFirst({
      where: {
        id: parseInt(inputId),
        projectId: parseInt(projectId)
      }
    })

    if (!input) {
      return res.status(404).json({
        success: false,
        message: 'Input not found'
      })
    }

    res.json({
      success: true,
      data: { input }
    })
  } catch (error) {
    console.error('Get input error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get input',
      error: error.message
    })
  }
}

export const deleteInput = async (req, res) => {
  try {
    const { projectId, inputId } = req.params
    const ownerId = req.user.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ownerId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    const input = await prisma.input.findFirst({
      where: {
        id: parseInt(inputId),
        projectId: parseInt(projectId)
      }
    })

    if (!input) {
      return res.status(404).json({
        success: false,
        message: 'Input not found'
      })
    }

    // Delete file if exists
    if (input.filePath) {
      try {
        await deleteFile(input.filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }

    await prisma.input.delete({
      where: { id: parseInt(inputId) }
    })

    res.json({
      success: true,
      message: 'Input deleted successfully'
    })
  } catch (error) {
    console.error('Delete input error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete input',
      error: error.message
    })
  }
}