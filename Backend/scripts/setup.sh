#!/bin/bash

# SmartReq AI Backend Setup Script

echo "🚀 Setting up SmartReq AI Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd python
pip3 install -r requirements.txt

# Download spaCy model
echo "📚 Downloading spaCy model..."
python3 -m spacy download en_core_web_sm

cd ..

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database configuration"
echo "2. Set up your PostgreSQL database"
echo "3. Run: npm run db:push (to create database schema)"
echo "4. Run: npm run dev (to start development server)"
echo ""
echo "API will be available at: http://localhost:5000"
echo "API Documentation: http://localhost:5000/api/docs"
