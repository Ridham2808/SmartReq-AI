# SmartReq AI Backend Setup Script (PowerShell)

Write-Host "🚀 Setting up SmartReq AI Backend..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 16 or higher." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
try {
    $psqlVersion = psql --version
    Write-Host "✅ PostgreSQL found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not installed. Please install PostgreSQL 12 or higher." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Install Python dependencies
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location python
pip install -r requirements.txt

# Download spaCy model
Write-Host "📚 Downloading spaCy model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

Set-Location ..

# Create environment file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "⚠️  Please edit .env file with your configuration" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path uploads
New-Item -ItemType Directory -Force -Path logs

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your database configuration" -ForegroundColor White
Write-Host "2. Set up your PostgreSQL database" -ForegroundColor White
Write-Host "3. Run: npm run db:push (to create database schema)" -ForegroundColor White
Write-Host "4. Run: npm run dev (to start development server)" -ForegroundColor White
Write-Host ""
Write-Host "API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:5000/api/docs" -ForegroundColor Cyan
