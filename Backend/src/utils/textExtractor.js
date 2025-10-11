import fs from 'fs'
import path from 'path'

export const extractTextFromPDF = async (filePath) => {
  try {
    console.log('Extracting text from PDF:', filePath)
    
    // Mock PDF extraction - will be replaced with pdf-parse
    const mockText = `
      Requirements Document
      
      1. User Authentication
      - Users shall be able to register with email and password
      - Users shall be able to login with credentials
      - System shall verify email addresses
      
      2. Project Management
      - Users shall be able to create projects
      - Users shall be able to add requirements to projects
      - System shall generate user stories automatically
    `
    
    return {
      success: true,
      text: mockText.trim(),
      pageCount: 1,
      metadata: {
        fileName: path.basename(filePath),
        fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
      }
    }
  } catch (error) {
    console.error('Extract text from PDF error:', error)
    throw error
  }
}

export const extractTextFromAudio = async (filePath) => {
  try {
    console.log('Extracting text from audio:', filePath)
    
    // Mock speech-to-text - will be replaced with Google STT or Whisper
    const mockTranscription = `
      I need a system that allows users to register and login.
      The system should have email verification.
      Users should be able to create projects and add requirements.
      The system should automatically generate user stories from the requirements.
    `
    
    return {
      success: true,
      text: mockTranscription.trim(),
      confidence: 0.92,
      duration: 45.5,
      metadata: {
        fileName: path.basename(filePath),
        fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
      }
    }
  } catch (error) {
    console.error('Extract text from audio error:', error)
    throw error
  }
}

export const extractTextFromImage = async (filePath) => {
  try {
    console.log('Extracting text from image:', filePath)
    
    // Mock OCR - will be replaced with Tesseract.js or Google Vision
    const mockText = `
      System Requirements:
      - User registration
      - Email verification
      - Project creation
      - Requirement management
    `
    
    return {
      success: true,
      text: mockText.trim(),
      confidence: 0.88,
      metadata: {
        fileName: path.basename(filePath),
        fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
      }
    }
  } catch (error) {
    console.error('Extract text from image error:', error)
    throw error
  }
}