#!/bin/bash

# Script to generate server projects resource report
# Usage: ./generate-server-report.sh

SERVER="root@linux-laptop.ir"
REPORT_FILE="server-projects-report.md"

echo "Connecting to server and generating report..."

ssh $SERVER << 'EOF' > /tmp/server_data.txt
echo "=== DOCKER CONTAINERS ==="
docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'

echo ""
echo "=== DOCKER STATS ==="
docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}'

echo ""
echo "=== SYSTEM MEMORY ==="
free -h

echo ""
echo "=== DISK USAGE ==="
df -h | head -8

echo ""
echo "=== PM2 PROCESSES ==="
pm2 list 2>/dev/null || echo "PM2 not available"

echo ""
echo "=== NODE PROCESSES ==="
ps aux | grep -E 'node|npm' | grep -v grep | head -10

echo ""
echo "=== PROJECT DIRECTORIES ==="
du -sh /opt/hooman /opt/storysaz-back /var/www/linux-laptop 2>/dev/null

echo ""
echo "=== DOCKER VOLUMES ==="
docker system df -v | grep -A 100 "Local Volumes"

EOF

echo "Report generated: $REPORT_FILE"
echo "To regenerate, run this script again."

