#!/usr/bin/env pwsh
# Git Push Script - Commit and push all changes to GitHub

param(
    [string]$Message = "Update health monitor"
)

Write-Host "Git Push Script" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

# Check if in git repository
if (-not (Test-Path ".git")) {
    Write-Host "[ERROR] Not a git repository!" -ForegroundColor Red
    exit 1
}

# Show status
Write-Host "Checking changes..." -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host ""
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host "[OK] Changes staged" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m $Message

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Committed" -ForegroundColor Green
} else {
    Write-Host "[INFO] Nothing to commit or commit failed" -ForegroundColor Yellow
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Pushed to GitHub" -ForegroundColor Green
} else {
    # Try main branch
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Pushed to GitHub (main branch)" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Push failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Green
Write-Host "All changes pushed to GitHub!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
