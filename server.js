const express = require('express');
const cors = require('cors');
const path = require('path');
const systemMonitor = require('./src/monitor');
const telegramService = require('./src/telegram');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
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
      telegramService.sendAlert('CPU', data.cpu.usage, thresholds.cpu);
    }
    if (data.memory.usage > thresholds.memory) {
      telegramService.sendAlert('Memory', data.memory.usage, thresholds.memory);
    }
    if (data.disk.usage > thresholds.disk) {
      telegramService.sendAlert('Disk', data.disk.usage, thresholds.disk);
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

