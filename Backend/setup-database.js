#!/usr/bin/env node

/**
 * Database Setup Script for SmartReq AI Backend
 * This script helps set up the database and run migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SmartReq AI Backend Database Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Database
DATABASE_URL=postgresql://smartreq_user:smartreq_password@localhost:5432/smartreq_ai

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-${Date.now()}
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Python NLP Script
PYTHON_SCRIPT_PATH=./python/nlp_script.py

# LLM Providers
LLM_PROVIDER=
OPENAI_API_KEY=
GEMINI_API_KEY=

# Jira Integration
JIRA_ENCRYPTION_KEY=your-jira-encryption-key
JIRA_ENABLED=false

# Email Configuration
BREVO_API_KEY=
EMAIL_FROM=noreply@smartreq.ai
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=http://localhost:3000`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Function to run command with error handling
function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    console.log('💡 Make sure Docker is running and PostgreSQL container is up\n');
    return false;
  }
  return true;
}

// Check if Docker is running
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is installed');
} catch (error) {
  console.log('❌ Docker is not installed or not running');
  console.log('Please install Docker Desktop and start it before running this script\n');
  process.exit(1);
}

// Start PostgreSQL container
console.log('🐳 Starting PostgreSQL container...');
try {
  execSync('docker-compose up -d postgres', { stdio: 'inherit' });
  console.log('✅ PostgreSQL container started\n');
} catch (error) {
  console.log('❌ Failed to start PostgreSQL container');
  console.log('💡 Make sure Docker Desktop is running\n');
  process.exit(1);
}

// Wait for database to be ready
console.log('⏳ Waiting for database to be ready...');
setTimeout(() => {
  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');
  
  // Push schema to database
  if (runCommand('npx prisma db push', 'Pushing schema to database')) {
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Visit http://localhost:5000/api/docs for API documentation');
    console.log('3. Visit http://localhost:5000/api/health for health check');
    console.log('\n💡 To stop the database: docker-compose down');
  } else {
    console.log('❌ Database setup failed');
    console.log('💡 Make sure PostgreSQL container is running and accessible');
  }
}, 5000);
