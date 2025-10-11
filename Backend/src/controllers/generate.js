import prisma from '../config/db.js'
import { generateUserStories, generateProcessFlow } from '../utils/llm.js'

export const generateArtifacts = async (req, res) => {
  try {
    const { projectId } = req.params
    const ownerId = req.user.id

    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId },
      include: { inputs: true }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Combine all input content
    const combinedRequirements = project.inputs
      .map(input => input.content)
      .filter(Boolean)
      .join('\n')

    // Generate user stories
    const storiesResult = await generateUserStories(combinedRequirements)
    
    // Generate process flow
    const flowResult = await generateProcessFlow(combinedRequirements)

    // Save artifacts to database
    const artifacts = []
    
    for (const story of storiesResult.stories) {
      const artifact = await prisma.artifact.create({
        data: {
          projectId: parseInt(projectId),
          type: 'story',
          content: story
        }
      })
      artifacts.push(artifact)
    }

    const flowArtifact = await prisma.artifact.create({
      data: {
        projectId: parseInt(projectId),
        type: 'flow',
        content: flowResult.flow
      }
    })
    artifacts.push(flowArtifact)

    res.json({
      success: true,
      message: 'Artifacts generated successfully',
      data: { artifacts }
    })
  } catch (error) {
    console.error('Generate artifacts error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate artifacts',
      error: error.message
    })
  }
}

export const getGenerationStatus = async (req, res) => {
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

    const artifactCount = await prisma.artifact.count({
      where: { projectId: parseInt(projectId) }
    })

    res.json({
      success: true,
      data: {
        status: artifactCount > 0 ? 'completed' : 'idle',
        artifactCount
      }
    })
  } catch (error) {
    console.error('Get generation status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get generation status',
      error: error.message
    })
  }
}