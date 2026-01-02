#!/usr/bin/env pwsh
# GitHub Deployment Script for Health Monitor
# This script creates a GitHub repository and pushes the code

Write-Host "🚀 GitHub Deployment Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$REPO_NAME = "health-monitor"
$REPO_DESCRIPTION = "Modern health monitoring dashboard for Linux servers with Docker, PM2, and Node.js process tracking"
$REPO_VISIBILITY = "public"  # Change to "private" if needed

# Check if gh CLI is installed
Write-Host "Checking for GitHub CLI..." -ForegroundColor Yellow
try {
    $ghVersion = gh --version 2>&1
    Write-Host "✅ GitHub CLI found: $($ghVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
Write-Host "`nChecking GitHub authentication..." -ForegroundColor Yellow
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not authenticated with GitHub!" -ForegroundColor Red
        Write-Host "Please run: gh auth login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Authenticated with GitHub" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication check failed!" -ForegroundColor Red
    exit 1
}

# Initialize git if not already initialized
Write-Host "`nInitializing Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Create .gitignore if it doesn't exist
Write-Host "`nCreating .gitignore..." -ForegroundColor Yellow
if (-not (Test-Path ".gitignore")) {
    @"
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build output
dist/
build/

# Temporary files
*.tmp
*.temp
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "✅ .gitignore created" -ForegroundColor Green
} else {
    Write-Host "✅ .gitignore already exists" -ForegroundColor Green
}

# Create README.md if it doesn't exist
Write-Host "`nCreating README.md..." -ForegroundColor Yellow
if (-not (Test-Path "README.md")) {
    @"
# 🚀 Health Monitor Dashboard

A modern, real-time health monitoring dashboard for Linux servers with a beautiful glassmorphism UI.

## ✨ Features

- **Real-time Monitoring**: CPU, Memory, and Disk usage with circular progress indicators
- **Application Tracking**: Monitor Docker containers, PM2 processes, and Node.js applications
- **Modern UI**: Glassmorphism design with dark theme and turquoise accents
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Live Updates**: Auto-refresh every 5 seconds

## 📸 Screenshot

![Dashboard Preview](./screenshot.png)

## 🛠️ Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/$REPO_NAME.git
cd $REPO_NAME

# Install dependencies
npm install

# Create .env file (optional)
cp .env.example .env

# Start the server
npm start
\`\`\`

## 🔧 Configuration

Create a \`.env\` file in the root directory:

\`\`\`env
PORT=3000
MONITOR_INTERVAL=5000
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=80
\`\`\`

## 📊 API Endpoints

| Endpoint | Description |
|----------|-------------|
| \`/api/health\` | Basic CPU, Memory, Disk stats |
| \`/api/stats\` | Detailed system information |
| \`/api/applications\` | Docker, PM2, and Node.js processes |

## 🚀 Usage

Access the dashboard at \`http://localhost:3000\`

## 🎨 Tech Stack

- **Backend**: Node.js, Express
- **Monitoring**: systeminformation
- **Frontend**: Vanilla JavaScript, Modern CSS
- **Design**: Glassmorphism, Dark Theme

## 📝 License

MIT

## 👨‍💻 Author

Built with ❤️ using Node.js
"@ | Out-File -FilePath "README.md" -Encoding UTF8
    Write-Host "✅ README.md created" -ForegroundColor Green
} else {
    Write-Host "✅ README.md already exists" -ForegroundColor Green
}

# Add all files to git
Write-Host "`nAdding files to Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added to staging" -ForegroundColor Green

# Commit changes
Write-Host "`nCommitting changes..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Health Monitor Dashboard with glassmorphism UI"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
}

# Create GitHub repository
Write-Host "`nCreating GitHub repository..." -ForegroundColor Yellow
try {
    gh repo create $REPO_NAME --$REPO_VISIBILITY --description $REPO_DESCRIPTION --source=. --remote=origin --push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repository created and code pushed!" -ForegroundColor Green
        
        # Get repository URL
        $repoUrl = gh repo view --json url -q .url
        Write-Host "`n🎉 Success!" -ForegroundColor Green
        Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
        Write-Host "`nYou can view your repository at: $repoUrl" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to create repository" -ForegroundColor Red
        Write-Host "The repository might already exist. Trying to push to existing repo..." -ForegroundColor Yellow
        
        # Try to add remote and push
        git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git" 2>$null
        git branch -M main
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Code pushed to existing repository!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to push code" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
