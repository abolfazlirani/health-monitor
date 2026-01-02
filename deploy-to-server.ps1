#!/usr/bin/env pwsh
# Deploy Health Monitor to Linux Server

Write-Host "Deploying Health Monitor to Linux Server" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$SERVER_HOST = "linux-laptop.ir"
$SERVER_USER = "root"
$REMOTE_PATH = "/opt/health-monitor"

Write-Host ""
Write-Host "Server: $SERVER_USER@$SERVER_HOST" -ForegroundColor Yellow
Write-Host "Remote Path: $REMOTE_PATH" -ForegroundColor Yellow
Write-Host ""

# Create .env content
$envContent = @"
PORT=1641
MONITOR_INTERVAL=5000
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=80
TELEGRAM_BOT_TOKEN=8510543120:AAHvuoS6tMEloGwyfbYZeg4AA-OFHj7Vw5Y
TELEGRAM_CHAT_ID=893663453
TELEGRAM_PROXY_URL=https://asarmulticenter.ir/canBot/health-chech.php
AUTH_USER=1641
AUTH_PASS=1641
"@

# Save .env temporarily
$envContent | Out-File -FilePath ".env.deploy" -Encoding UTF8 -NoNewline
Write-Host "[OK] .env file prepared" -ForegroundColor Green

# Create remote directory
Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p $REMOTE_PATH"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create remote directory" -ForegroundColor Red
    Remove-Item ".env.deploy" -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "[OK] Remote directory ready" -ForegroundColor Green

# Upload files using scp
Write-Host "Uploading files..." -ForegroundColor Yellow

# Upload individual files and folders
scp -r server.js package.json public src ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to upload files" -ForegroundColor Red
    Remove-Item ".env.deploy" -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "[OK] Files uploaded" -ForegroundColor Green

# Upload .env
Write-Host "Uploading .env..." -ForegroundColor Yellow
scp .env.deploy ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/.env
Remove-Item ".env.deploy" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to upload .env" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .env uploaded" -ForegroundColor Green

# Install and start
Write-Host "Installing dependencies and starting service..." -ForegroundColor Yellow

ssh ${SERVER_USER}@${SERVER_HOST} "cd $REMOTE_PATH && npm install --production && pm2 delete health-monitor 2>/dev/null; pm2 start server.js --name health-monitor && pm2 save"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Dashboard: http://${SERVER_HOST}:1641" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    exit 1
}
