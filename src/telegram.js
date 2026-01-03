const axios = require('axios');
require('dotenv').config();

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.proxyUrl = process.env.TELEGRAM_PROXY_URL; // PHP proxy URL
    this.enabled = false;
    this.lastAlerts = {
      cpu: 0,
      memory: 0,
      disk: 0
    };
    this.alertCooldown = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.checkInterval = null;
  }

  initialize() {
    if (!this.botToken || !this.chatId) {
      console.log('⚠️  Telegram bot token or chat ID not configured. Alerts will be disabled.');
      return false;
    }

    if (!this.proxyUrl) {
      console.log('⚠️  Telegram proxy URL not configured. Using direct connection (may not work in Iran).');
    }

    this.enabled = true;
    console.log('✅ Telegram alerts enabled');

    // Send startup notification
    this.sendMessage('🚀 *Health Monitor Started*\n\nMonitoring system resources every 15 minutes.\nYou will receive alerts when thresholds are exceeded.');

    return true;
  }

  async sendMessage(text, parseMode = 'Markdown') {
    if (!this.enabled) return false;

    try {
      const payload = {
        chat_id: this.chatId,
        text: text,
        parse_mode: parseMode
      };

      let response;

      if (this.proxyUrl) {
        // Use PHP proxy
        response = await axios.post(this.proxyUrl, {
          bot_token: this.botToken,
          method: 'sendMessage',
          params: payload
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.ok || response.data.success) {
          console.log('✅ Telegram message sent successfully via proxy');
          return true;
        } else {
          console.error('❌ Telegram API error:', JSON.stringify(response.data));
          return false;
        }
      } else {
        // Direct Telegram API call (won't work in Iran)
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        response = await axios.post(url, payload, { timeout: 10000 });

        if (response.data.ok) {
          console.log('✅ Telegram message sent successfully');
          return true;
        } else {
          console.error('❌ Telegram API error:', JSON.stringify(response.data));
          return false;
        }
      }
    } catch (error) {
      if (error.response) {
        console.error('❌ Telegram API error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ No response from Telegram/Proxy. Check your internet or proxy URL.');
      } else {
        console.error('❌ Failed to send Telegram message:', error.message);
      }
      return false;
    }
  }

  shouldSendAlert(type) {
    const now = Date.now();
    const lastAlert = this.lastAlerts[type];

    if (now - lastAlert < this.alertCooldown) {
      return false; // Still in cooldown period
    }

    return true;
  }

  async sendAlert(type, value, threshold, additionalInfo = {}) {
    if (!this.enabled || !this.shouldSendAlert(type)) {
      return false;
    }

    const emoji = {
      cpu: '🔥',
      memory: '💾',
      disk: '📀'
    };

    const labels = {
      cpu: 'CPU',
      memory: 'Memory',
      disk: 'Disk'
    };

    let message = `${emoji[type]} *${labels[type]} Alert!*\n\n`;
    message += `⚠️ ${labels[type]} usage is *${value.toFixed(1)}%*\n`;
    message += `📊 Threshold: ${threshold}%\n`;
    message += `⏰ Time: ${new Date().toLocaleString('fa-IR')}\n`;

    // Add additional info
    if (additionalInfo.total) {
      message += `\n📈 Total: ${additionalInfo.total} GB`;
    }
    if (additionalInfo.used) {
      message += `\n📉 Used: ${additionalInfo.used} GB`;
    }
    if (additionalInfo.free) {
      message += `\n✅ Free: ${additionalInfo.free} GB`;
    }

    // Add top processes
    if (additionalInfo.topProcesses && additionalInfo.topProcesses.length > 0) {
      message += `\n\n👤 *Top Processes:*`;
      additionalInfo.topProcesses.forEach((proc, i) => {
        message += `\n${i + 1}. \`${proc.name}\` (${proc.user})`;
        message += `\n   CPU: ${proc.cpu}% | MEM: ${proc.mem}%`;
      });
    }

    const success = await this.sendMessage(message);

    if (success) {
      this.lastAlerts[type] = Date.now();
    }

    return success;
  }

  async sendSystemReport(data) {
    if (!this.enabled) return false;

    const cpuStatus = data.cpu.usage >= 80 ? '🔴' : data.cpu.usage >= 60 ? '🟡' : '🟢';
    const memStatus = data.memory.usage >= 80 ? '🔴' : data.memory.usage >= 60 ? '🟡' : '🟢';
    const diskStatus = data.disk.usage >= 80 ? '🔴' : data.disk.usage >= 60 ? '🟡' : '🟢';

    const message = `📊 *System Health Report*\n\n` +
      `${cpuStatus} *CPU:* ${data.cpu.usage.toFixed(1)}%\n` +
      `   Cores: ${data.cpu.cores}\n\n` +
      `${memStatus} *Memory:* ${data.memory.usage.toFixed(1)}%\n` +
      `   Used: ${data.memory.used} GB / ${data.memory.total} GB\n\n` +
      `${diskStatus} *Disk:* ${data.disk.usage.toFixed(1)}%\n` +
      `   Used: ${data.disk.used} GB / ${data.disk.total} GB\n\n` +
      `⏰ ${new Date().toLocaleString('fa-IR')}`;

    return await this.sendMessage(message);
  }

  startScheduledReports(getSystemHealth, thresholds, database = null) {
    if (!this.enabled) return;

    // Check every 15 minutes
    const interval = 15 * 60 * 1000;

    this.checkInterval = setInterval(async () => {
      try {
        const data = await getSystemHealth();

        // If database is available, use 5-minute average for smarter alerts
        if (database) {
          try {
            const cpuAvg = await database.getAverageCPU(5);
            const memAvg = await database.getAverageMemory(5);

            // Only alert if we have enough samples (at least 3 minutes of data)
            if (cpuAvg.sampleCount >= 3) {
              // Check CPU average
              if (cpuAvg.average > thresholds.cpu) {
                await this.sendAlert('cpu', cpuAvg.average, thresholds.cpu, {
                  cores: data.cpu.cores,
                  topProcesses: data.cpu.topProcesses || [],
                  note: `5-min average (${cpuAvg.sampleCount} samples)`
                });
              }

              // Check Memory average
              if (memAvg > thresholds.memory) {
                await this.sendAlert('memory', memAvg, thresholds.memory, {
                  total: data.memory.total,
                  used: data.memory.used,
                  free: data.memory.free,
                  topProcesses: data.memory.topProcesses || [],
                  note: `5-min average`
                });
              }
            } else {
              console.log(`⏳ Waiting for more data (${cpuAvg.sampleCount}/3 samples)`);
            }
          } catch (dbError) {
            console.error('Database query error, falling back to instant check:', dbError);
            // Fallback to instant check if database fails
            this.performInstantCheck(data, thresholds);
          }
        } else {
          // No database, use instant readings
          this.performInstantCheck(data, thresholds);
        }

        // Always check disk (doesn't need averaging)
        if (data.disk.usage > thresholds.disk) {
          await this.sendAlert('disk', data.disk.usage, thresholds.disk, {
            total: data.disk.total,
            used: data.disk.used,
            free: data.disk.free
          });
        }
      } catch (error) {
        console.error('Error in scheduled check:', error);
      }
    }, interval);

    console.log(`✅ Scheduled checks every 15 minutes`);
  }

  async performInstantCheck(data, thresholds) {
    // Check CPU
    if (data.cpu.usage > thresholds.cpu) {
      await this.sendAlert('cpu', data.cpu.usage, thresholds.cpu, {
        cores: data.cpu.cores,
        topProcesses: data.cpu.topProcesses || []
      });
    }

    // Check Memory
    if (data.memory.usage > thresholds.memory) {
      await this.sendAlert('memory', data.memory.usage, thresholds.memory, {
        total: data.memory.total,
        used: data.memory.used,
        free: data.memory.free,
        topProcesses: data.memory.topProcesses || []
      });
    }
  }

  stopScheduledReports() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️  Scheduled checks stopped');
    }
  }
}

module.exports = new TelegramService();
