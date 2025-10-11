const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/env');
const { logger } = require('../middleware/errorHandler');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create upload directory:', error);
    throw error;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'audio/': ['.mp3', '.wav', '.m4a', '.ogg'],
    'application/pdf': ['.pdf'],
    'text/': ['.txt', '.doc', '.docx'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };

  const fileType = Object.keys(allowedTypes).find(type => 
    file.mimetype.startsWith(type)
  );

  if (fileType) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[fileType].includes(ext)) {
      return cb(null, true);
    }
  }

  cb(new Error(`File type not allowed. Allowed types: ${Object.values(allowedTypes).flat().join(', ')}`), false);
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

// File upload middleware
const uploadMiddleware = upload.single('file');

// Delete file utility
const deleteFile = async (filePath) => {
  try {
    if (filePath && filePath.startsWith(config.UPLOAD_DIR)) {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
    // Don't throw error for file deletion failures
  }
};

// Get file info
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  };
};

// Validate file size
const validateFileSize = (file) => {
  if (file && file.size > config.MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  return true;
};

// Process uploaded file based on type
const processUploadedFile = async (file, inputType) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  validateFileSize(file);
  
  const fileInfo = getFileInfo(file);
  
  // For voice files, you would typically convert to text here
  // For document files, you would extract text content here
  // This is a placeholder - in production, you'd integrate with appropriate services
  
  if (inputType === 'voice') {
    // Placeholder for speech-to-text conversion
    // In production, integrate with Google Speech-to-Text, AWS Transcribe, etc.
    logger.info('Voice file uploaded - speech-to-text conversion needed');
    return {
      ...fileInfo,
      processedText: 'Speech-to-text conversion placeholder'
    };
  }
  
  if (inputType === 'document') {
    // Placeholder for document text extraction
    // In production, integrate with pdf-parse, mammoth, etc.
    logger.info('Document file uploaded - text extraction needed');
    return {
      ...fileInfo,
      processedText: 'Document text extraction placeholder'
    };
  }
  
  return fileInfo;
};

// Clean up old files (utility for maintenance)
const cleanupOldFiles = async (olderThanDays = 30) => {
  try {
    const files = await fs.readdir(config.UPLOAD_DIR);
    const now = Date.now();
    const olderThan = olderThanDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    for (const file of files) {
      const filePath = path.join(config.UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > olderThan) {
        await fs.unlink(filePath);
        logger.info(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Error during file cleanup:', error);
  }
};

module.exports = {
  uploadMiddleware,
  deleteFile,
  getFileInfo,
  validateFileSize,
  processUploadedFile,
  cleanupOldFiles,
  ensureUploadDir
};
