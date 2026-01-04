const express = require('express');
const cors = require('cors');
const path = require('path');
const systemMonitor = require('./src/monitor');
const telegramService = require('./src/telegram');
const database = require('./src/database');
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

// Historical Metrics Endpoints
app.get('/api/metrics/hourly', async (req, res) => {
  try {
    const metrics = await database.getHourlyMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics/daily', async (req, res) => {
  try {
    const metrics = await database.getDailyMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics/weekly', async (req, res) => {
  try {
    const metrics = await database.getWeeklyMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROCESS MANAGEMENT ====================

app.post('/api/process/kill', async (req, res) => {
  try {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: 'PID required' });
    const result = await systemMonitor.killProcess(pid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pm2/restart', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Process name required' });
    const result = await systemMonitor.restartPM2(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pm2/stop', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Process name required' });
    const result = await systemMonitor.stopPM2(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/restart', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Container name required' });
    const result = await systemMonitor.restartDocker(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/stop', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Container name required' });
    const result = await systemMonitor.stopDocker(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Command required' });
    const result = await systemMonitor.runCommand(command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NETWORK MONITORING ====================

app.get('/api/network', async (req, res) => {
  try {
    const overview = await systemMonitor.getNetworkOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/network/ping', async (req, res) => {
  try {
    const { host } = req.body;
    if (!host) return res.status(400).json({ error: 'Host required' });
    const result = await systemMonitor.pingHost(host);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/network/check', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    const result = await systemMonitor.checkHttpUptime(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Health Monitor Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Monitoring system resources...`);

  // Initialize Database
  try {
    await database.init();
    console.log('✅ Database initialized');

    // Start collecting metrics every minute
    setInterval(async () => {
      try {
        const health = await systemMonitor.getSystemHealth();
        await database.saveMetrics(health);
        console.log('📝 Metrics saved to database');
      } catch (error) {
        console.error('❌ Error saving metrics:', error);
      }
    }, 60000); // Every 1 minute

    // Cleanup old data daily
    setInterval(async () => {
      try {
        await database.cleanup(7); // Keep 7 days
      } catch (error) {
        console.error('❌ Error cleaning up database:', error);
      }
    }, 86400000); // Every 24 hours

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }

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
      thresholds,
      database // Pass database for smart alerting
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

