const express = require('express');
const cors = require('cors');
const path = require('path');
const systemMonitor = require('./src/monitor');
const telegramService = require('./src/telegram');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Authentication credentials from environment
const AUTH_USER = process.env.AUTH_USER || 'admin';
const AUTH_PASS = process.env.AUTH_PASS || 'admin123';

// Basic Authentication Middleware
const basicAuth = (req, res, next) => {
  // Skip auth for health check endpoint (optional)
  if (req.path === '/api/ping') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Health Monitor"');
    return res.status(401).send('Authentication required');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username === AUTH_USER && password === AUTH_PASS) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Health Monitor"');
  return res.status(401).send('Invalid credentials');
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(basicAuth); // Add authentication
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const healthData = await systemMonitor.getSystemHealth();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await systemMonitor.getDetailedStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications', async (req, res) => {
  try {
    const appStats = await systemMonitor.getApplicationStats();
    res.json(appStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Health Monitor Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Monitoring system resources...`);

  // Initialize Telegram service
  if (telegramService.initialize()) {
    console.log('✅ Telegram alerts enabled');

    // Start scheduled checks every 15 minutes
    const thresholds = {
      cpu: parseFloat(process.env.CPU_THRESHOLD) || 80,
      memory: parseFloat(process.env.MEMORY_THRESHOLD) || 80,
      disk: parseFloat(process.env.DISK_THRESHOLD) || 80
    };

    telegramService.startScheduledReports(
      () => systemMonitor.getSystemHealth(),
      thresholds
    );
  }

  // Initialize monitoring with alerts
  systemMonitor.startMonitoring((data) => {
    // Check thresholds and send Telegram alerts
    const thresholds = {
      cpu: parseFloat(process.env.CPU_THRESHOLD) || 80,
      memory: parseFloat(process.env.MEMORY_THRESHOLD) || 80,
      disk: parseFloat(process.env.DISK_THRESHOLD) || 80
    };

    if (data.cpu.usage > thresholds.cpu) {
      telegramService.sendAlert('cpu', data.cpu.usage, thresholds.cpu, {
        topProcesses: data.cpu.topProcesses || []
      });
    }
    if (data.memory.usage > thresholds.memory) {
      telegramService.sendAlert('memory', data.memory.usage, thresholds.memory, {
        total: data.memory.total,
        used: data.memory.used,
        free: data.memory.free,
        topProcesses: data.memory.topProcesses || []
      });
    }
    if (data.disk.usage > thresholds.disk) {
      telegramService.sendAlert('disk', data.disk.usage, thresholds.disk, {
        total: data.disk.total,
        used: data.disk.used,
        free: data.disk.free
      });
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

