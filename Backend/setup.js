#!/usr/bin/env node

/**
 * Setup script for SmartReq AI Backend
 * Checks environment and creates necessary directories
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Setting up SmartReq AI Backend...\n')

// Check if .env exists
const envPath = path.join(__dirname, '.env')
const envExamplePath = path.join(__dirname, '.env.example')

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found')
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Copying .env.example to .env...')
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env file created\n')
  } else {
    console.log('❌ .env.example not found\n')
  }
} else {
  console.log('✅ .env file exists\n')
}

// Create necessary directories
const directories = ['uploads', 'logs']

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Created ${dir}/ directory`)
  } else {
    console.log(`✅ ${dir}/ directory exists`)
  }
})

console.log('\n✨ Setup complete!')
console.log('\n📝 Next steps:')
console.log('1. Update .env with your configuration')
console.log('2. Run: npm install')
console.log('3. Run: npm run db:generate')
console.log('4. Run: npm run db:push')
console.log('5. Run: npm run dev')
