# Health Monitor - راهنمای نصب و استفاده

## نصب با Docker Compose (توصیه می‌شود)

### 1. نصب sqlite3 در سیستم لوکال

```bash
npm install sqlite3
```

### 2. آپلود فایل‌ها به سرور

```bash
scp -r ./* root@linux-laptop.ir:/opt/health-monitor/
```

### 3. ایجاد فایل .env

```bash
cd /opt/health-monitor
nano .env
```

محتوای .env:
```
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
```

### 4. اجرا با Docker Compose

```bash
docker-compose up -d
```

### 5. مشاهده لاگ‌ها

```bash
docker-compose logs -f
```

---

## تغییرات جدید

### ✅ دیتابیس SQLite
- ذخیره متریک‌ها هر 1 دقیقه
- محاسبه میانگین 5 دقیقه برای CPU و Memory
- نگهداری 7 روز داده

### ✅ الارم هوشمند
- **قبل:** الارم اگر CPU > 80% در لحظه
- **بعد:** الارم اگر میانگین 5 دقیقه CPU > 80%
- فیلتر کردن پروسه‌های مانیتورینگ (`ps`, `top`, `htop`)

### ✅ جلوگیری از False Positive
- پروسه `ps` دیگه باعث الارم نمی‌شه
- فقط مشکلات واقعی و مداوم رو گزارش می‌ده

---

## دستورات مفید

### مشاهده دیتابیس
```bash
sqlite3 /opt/health-monitor/data/health-monitor.db
SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 10;
.exit
```

### Restart سرویس
```bash
docker-compose restart
```

### Stop سرویس
```bash
docker-compose down
```

### پاک کردن دیتابیس
```bash
rm /opt/health-monitor/data/health-monitor.db
docker-compose restart
```

---

## نکات مهم

1. **دایرکتوری data** باید قابل نوشتن باشه:
   ```bash
   mkdir -p /opt/health-monitor/data
   chmod 777 /opt/health-monitor/data
   ```

2. **اولین 5 دقیقه** الارمی ارسال نمی‌شه (در حال جمع‌آوری داده)

3. **پورت 1641** باید باز باشه:
   ```bash
   ufw allow 1641/tcp
   ufw reload
   ```

---

## مثال پیام تلگرام جدید

```
🔥 CPU Alert!

⚠️ CPU usage is 85.3%
📊 Threshold: 80%
⏰ Time: ۱۴۰۴/۱۰/۱۳, ۱۴:۳۰:۰۰
📝 5-min average (5 samples)

👤 Top Processes:
1. postgres (70)
   CPU: 71.1% | MEM: 0.3%
2. node (root)
   CPU: 12.5% | MEM: 1.1%
```

توجه: دیگه `ps` و `systeminformation` در لیست نیستن! ✅
