import { extractRequirements } from './llm.js'

export const processTextInput = async (content) => {
  try {
    console.log('Processing text input...')
    
    // Extract requirements using LLM
    const result = await extractRequirements(content)
    
    return {
      success: true,
      processedText: content,
      requirements: result.requirements
    }
  } catch (error) {
    console.error('Process text input error:', error)
    throw error
  }
}

export const processVoiceInput = async (filePath) => {
  try {
    console.log('Processing voice input:', filePath)
    
    // Mock transcription - will be replaced with actual speech-to-text
    const transcription = 'Mock transcription: User wants to create a login system with email verification.'
    
    // Extract requirements from transcription
    const result = await extractRequirements(transcription)
    
    return {
      success: true,
      transcription,
      requirements: result.requirements
    }
  } catch (error) {
    console.error('Process voice input error:', error)
    throw error
  }
}

export const processDocumentInput = async (filePath) => {
  try {
    console.log('Processing document input:', filePath)
    
    // Mock text extraction - will be replaced with actual PDF/document parser
    const extractedText = 'Mock extracted text: The system shall provide user authentication and authorization features.'
    
    // Extract requirements from document
    const result = await extractRequirements(extractedText)
    
    return {
      success: true,
      extractedText,
      requirements: result.requirements
    }
  } catch (error) {
    console.error('Process document input error:', error)
    throw error
  }
}

export const consolidateInputs = async (inputs) => {
  try {
    console.log('Consolidating inputs:', inputs.length)
    
    // Combine all requirements from inputs
    const allRequirements = []
    
    for (const input of inputs) {
      if (input.content) {
        const result = await processTextInput(input.content)
        allRequirements.push(...result.requirements)
      }
    }
    
    // Remove duplicates based on description
    const uniqueRequirements = allRequirements.filter((req, index, self) =>
      index === self.findIndex((r) => r.description === req.description)
    )
    
    return {
      success: true,
      consolidatedRequirements: uniqueRequirements,
      totalInputs: inputs.length,
      totalRequirements: uniqueRequirements.length
    }
  } catch (error) {
    console.error('Consolidate inputs error:', error)
    throw error
  }
}