# راهنمای استقرار روی سرور لینوکس

## پیش‌نیازها

### روی سیستم ویندوز شما:
- PowerShell
- SSH Client (معمولاً در ویندوز 10/11 نصب است)
- دسترسی SSH به سرور

### روی سرور لینوکس:
- Node.js (نسخه 14 یا بالاتر)
- npm
- PM2 (برای مدیریت پروسس)

## نصب PM2 روی سرور (اگر نصب نیست)

```bash
ssh root@linux-laptop.ir
npm install -g pm2
pm2 startup
```

## استقرار خودکار

### روش اول: استفاده از اسکریپت PowerShell (توصیه می‌شود)

```powershell
.\deploy-to-server.ps1
```

این اسکریپت به صورت خودکار:
1. ✅ فایل‌های پروژه را به سرور آپلود می‌کند
2. ✅ فایل `.env` با تنظیمات صحیح ایجاد می‌کند
3. ✅ Dependencies را نصب می‌کند
4. ✅ سرویس را با PM2 راه‌اندازی می‌کند

### روش دوم: استقرار دستی

#### مرحله 1: آپلود فایل‌ها

```powershell
# با rsync (سریع‌تر)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' . root@linux-laptop.ir:/opt/health-monitor/

# یا با scp
scp -r * root@linux-laptop.ir:/opt/health-monitor/
```

#### مرحله 2: ایجاد فایل .env روی سرور

```bash
ssh root@linux-laptop.ir

cd /opt/health-monitor

cat > .env << 'EOF'
PORT=3000
MONITOR_INTERVAL=5000
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=80
TELEGRAM_BOT_TOKEN=8510543120:AAHvuoS6tMEloGwyfbYZeg4AA-OFHj7Vw5Y
TELEGRAM_CHAT_ID=893663453
TELEGRAM_PROXY_URL=https://asarmulticenter.ir/canBot/health-chech.php
EOF
```

#### مرحله 3: نصب و راه‌اندازی

```bash
# نصب dependencies
npm install --production

# راه‌اندازی با PM2
pm2 start server.js --name health-monitor
pm2 save
pm2 startup
```

## مدیریت سرویس

### مشاهده وضعیت
```bash
pm2 status health-monitor
```

### مشاهده لاگ‌ها
```bash
pm2 logs health-monitor
```

### ری‌استارت
```bash
pm2 restart health-monitor
```

### توقف
```bash
pm2 stop health-monitor
```

### حذف
```bash
pm2 delete health-monitor
```

## دسترسی به داشبورد

پس از استقرار، داشبورد در آدرس زیر در دسترس است:

```
http://linux-laptop.ir:3000
```

## تنظیم Nginx (اختیاری)

برای دسترسی بدون پورت و با HTTPS:

```bash
# ایجاد فایل پیکربندی Nginx
cat > /etc/nginx/sites-available/health-monitor << 'EOF'
server {
    listen 80;
    server_name health.linux-laptop.ir;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# فعال‌سازی
ln -s /etc/nginx/sites-available/health-monitor /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## به‌روزرسانی

برای به‌روزرسانی پروژه:

```powershell
# روی ویندوز
.\deploy-to-server.ps1
```

یا به صورت دستی:

```bash
ssh root@linux-laptop.ir
cd /opt/health-monitor
git pull  # اگر از Git استفاده می‌کنید
npm install --production
pm2 restart health-monitor
```

## عیب‌یابی

### سرویس شروع نمی‌شود
```bash
# بررسی لاگ‌ها
pm2 logs health-monitor --lines 50

# بررسی پورت
netstat -tulpn | grep 3000

# تست دستی
node server.js
```

### تلگرام کار نمی‌کند
```bash
# بررسی .env
cat /opt/health-monitor/.env

# تست اتصال به proxy
curl https://asarmulticenter.ir/canBot/health-chech.php
```

### مصرف منابع بالا
```bash
# بررسی مصرف
pm2 monit

# محدود کردن حافظه
pm2 delete health-monitor
pm2 start server.js --name health-monitor --max-memory-restart 200M
pm2 save
```

## پشتیبان‌گیری

```bash
# پشتیبان از تنظیمات PM2
pm2 save

# پشتیبان از فایل .env
cp /opt/health-monitor/.env /opt/health-monitor/.env.backup
```

## امنیت

1. **فایروال:** اطمینان حاصل کنید که فقط پورت‌های لازم باز هستند
2. **HTTPS:** از Nginx با Let's Encrypt برای HTTPS استفاده کنید
3. **احراز هویت:** در صورت نیاز، احراز هویت به داشبورد اضافه کنید
4. **.env:** مطمئن شوید که `.env` در `.gitignore` است

## لاگ‌ها

لاگ‌های PM2 در مسیر زیر ذخیره می‌شوند:
```
~/.pm2/logs/health-monitor-out.log
~/.pm2/logs/health-monitor-error.log
```
