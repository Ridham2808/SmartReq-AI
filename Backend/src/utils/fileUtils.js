import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { config } from '../config/env.js'

const __filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

export const ensureUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), config.UPLOAD_DIR)
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log('✅ Upload directory created:', uploadDir)
  }
}

export const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log('File deleted:', filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

export const validateFileType = (mimetype) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'text/plain'
  ]
  return allowedTypes.includes(mimetype)
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), config.UPLOAD_DIR)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  if (validateFileType(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and audio files are allowed.'), false)
  }
}

// Multer upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
})

export const uploadMiddleware = upload.single('file')