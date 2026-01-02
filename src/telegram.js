const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor() {
    this.bot = null;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.alertCooldown = {}; // Prevent spam
    this.cooldownTime = 60000; // 1 minute cooldown between alerts
  }

  initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('⚠️  Telegram bot token not configured. Alerts will be disabled.');
      return false;
    }

    if (!this.chatId) {
      console.warn('⚠️  Telegram chat ID not configured. Alerts will be disabled.');
      return false;
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      console.log('✅ Telegram service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error.message);
      return false;
    }
  }

  isInCooldown(resourceType) {
    const lastAlert = this.alertCooldown[resourceType];
    if (!lastAlert) return false;
    
    return (Date.now() - lastAlert) < this.cooldownTime;
  }

  setCooldown(resourceType) {
    this.alertCooldown[resourceType] = Date.now();
  }

  async sendAlert(resourceType, currentUsage, threshold) {
    if (!this.bot || !this.chatId) {
      return;
    }

    // Prevent spam with cooldown
    if (this.isInCooldown(resourceType)) {
      return;
    }

    try {
      const message = `⚠️ *Resource Alert*

🔴 *${resourceType} Usage High*

Current: *${currentUsage.toFixed(1)}%*
Threshold: *${threshold}%*

⏰ ${new Date().toLocaleString()}

System: ${process.env.HOSTNAME || 'Server'}`;

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown'
      });

      this.setCooldown(resourceType);
      console.log(`📱 Telegram alert sent: ${resourceType} usage at ${currentUsage.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Failed to send Telegram alert:', error.message);
    }
  }

  async sendTestMessage() {
    if (!this.bot || !this.chatId) {
      throw new Error('Telegram not configured');
    }

    try {
      await this.bot.sendMessage(
        this.chatId,
        '✅ Health Monitor is now active and monitoring your system!'
      );
      console.log('✅ Test message sent to Telegram');
    } catch (error) {
      console.error('❌ Failed to send test message:', error.message);
      throw error;
    }
  }
}

const telegramService = new TelegramService();
// Initialize on module load if token is available
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  telegramService.initialize();
}

module.exports = telegramService;

