# Health Monitor Dashboard

A beautiful, modern system health monitoring dashboard with Telegram alerts. Built with Node.js, featuring a dark teal glassmorphism design.

## Features

- 📊 Real-time system monitoring (CPU, Memory, Disk)
- 📱 Telegram alerts when resource usage exceeds thresholds
- 🎨 Beautiful glassmorphism UI with dark teal/turquoise theme
- 📈 Live updating dashboard
- 🖥️ Detailed system information
- 🚀 Easy to install and configure

## Screenshots

The dashboard features:
- Glassmorphism card design with blur effects
- Smooth animations and transitions
- Real-time progress bars
- Responsive layout

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Linux server (for deployment)
- Telegram Bot Token (optional, for alerts)

## Installation

### 1. Clone or download this repository

```bash
cd health-check
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=3000
HOSTNAME=server

# Monitoring intervals (milliseconds)
MONITOR_INTERVAL=5000

# Alert thresholds (percentage)
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=80

# Telegram Configuration (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 4. Set up Telegram Bot (Optional)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow instructions to create a bot
3. Copy the bot token
4. Send a message to your bot
5. Get your chat ID by visiting:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
6. Look for `"chat":{"id":123456789}` in the response

### 5. Run the application

#### Development mode:
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

The dashboard will be available at `http://localhost:3000`

## Linux Server Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start server.js --name health-monitor
```

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

4. Access logs:
```bash
pm2 logs health-monitor
```

### Using systemd Service

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/health-monitor.service
```

2. Add the following content (adjust paths):

```ini
[Unit]
Description=Health Monitor Dashboard
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/health-check
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable health-monitor
sudo systemctl start health-monitor
sudo systemctl status health-monitor
```

### Using Nginx Reverse Proxy (Optional)

If you want to access the dashboard via a domain:

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Create a configuration file:
```bash
sudo nano /etc/nginx/sites-available/health-monitor
```

3. Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/health-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Configuration

### Monitoring Intervals

- `MONITOR_INTERVAL`: How often to check system resources (default: 5000ms = 5 seconds)

### Alert Thresholds

Set thresholds as percentages:
- `CPU_THRESHOLD`: CPU usage percentage to trigger alert (default: 80%)
- `MEMORY_THRESHOLD`: Memory usage percentage to trigger alert (default: 80%)
- `DISK_THRESHOLD`: Disk usage percentage to trigger alert (default: 80%)

### Telegram Alerts

Alerts are sent when resource usage **increases** and exceeds the threshold. There's a 1-minute cooldown between alerts for the same resource type to prevent spam.

## API Endpoints

- `GET /api/health` - Get current system health metrics
- `GET /api/stats` - Get detailed system statistics

## Troubleshooting

### Port already in use
Change the `PORT` in `.env` file

### Telegram alerts not working
1. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correct
2. Make sure you've sent a message to your bot
3. Check server logs for error messages

### Permission errors on Linux
Make sure the user running the application has necessary permissions to read system information (usually requires no special permissions)

## License

MIT

## Support

For issues or questions, please check the logs or create an issue in the repository.

