# Server Projects Resource Report
**Generated:** 2026-01-02 22:18:15
**Server:** linux-laptop.ir

---

## 📊 System Overview

**Total Memory:** 7.8 GB
**Used Memory:** 3.2 GB (41%)
**Free Memory:** 4.6 GB available
**Disk Total:** 148 GB
**Disk Used:** 7.5 GB (6%)
**Disk Available:** 134 GB

---

## 🐳 Docker Projects

### 1. Hooman Project

#### Containers:
- **hooman-api** (Container: hooman-app)
  - **Status:** Up 7 hours
  - **Port:** 127.0.0.1:3001->3000/tcp
  - **CPU Usage:** 0.02%
  - **Memory:** 61.4 MiB / 7.762 GiB (0.77%)
  - **Network I/O:** 3.03 MB / 3.21 MB
  - **Block I/O:** 307 kB / 4.1 kB
  - **Processes:** 22 PIDs
  - **Disk Space:** 114 MB (project directory)
  - **Image Size:** 325 MB
  - **Volumes:**
    - hooman_postgres_data: 239.6 MB
    - hooman_redis_data: 88 B
    - hooman_uploads: 0 B

- **hooman-db** (PostgreSQL 16 Alpine)
  - **Status:** Up 10 hours (healthy)
  - **Port:** 127.0.0.1:5433->5432/tcp
  - **CPU Usage:** 0.00%
  - **Memory:** 106.2 MiB / 7.762 GiB (1.34%)
  - **Network I/O:** 831 kB / 1.59 MB
  - **Block I/O:** 2.35 MB / 471 MB
  - **Processes:** 8 PIDs
  - **Image Size:** 276 MB

- **hooman-redis** (Redis 7 Alpine)
  - **Status:** Up 10 hours (healthy)
  - **Port:** 127.0.0.1:6380->6379/tcp
  - **CPU Usage:** 0.47%
  - **Memory:** 8.43 MiB / 7.762 GiB (0.11%)
  - **Network I/O:** 687 kB / 607 kB
  - **Block I/O:** 0 B / 45.1 kB
  - **Processes:** 6 PIDs
  - **Image Size:** 41.4 MB

**Total Hooman Project Resources:**
- CPU: ~0.49%
- Memory: ~176 MB (2.22%)
- Disk: ~650 MB (images + volumes + project)

---

### 2. Storysaz Project

#### Containers:
- **storysaz-api** (Container: storysaz-back-app)
  - **Status:** Up 7 hours
  - **Port:** 0.0.0.0:3002->3000/tcp (public)
  - **CPU Usage:** 0.03%
  - **Memory:** 82.18 MiB / 7.762 GiB (1.03%)
  - **Network I/O:** 1.53 MB / 4.61 MB
  - **Block I/O:** 0 B / 4.1 kB
  - **Processes:** 22 PIDs
  - **Disk Space:** 6.8 MB (project directory)
  - **Image Size:** 319 MB
  - **Volumes:**
    - storysaz-back_db_data: 157.8 MB
    - storysaz-back_redis_data: 321 B

- **storysaz-db** (PostgreSQL Latest)
  - **Status:** Up 7 hours (healthy)
  - **Port:** 0.0.0.0:5434->5432/tcp (public)
  - **CPU Usage:** 0.00%
  - **Memory:** 30.16 MiB / 7.762 GiB (0.38%)
  - **Network I/O:** 564 kB / 485 kB
  - **Block I/O:** 0 B / 2.62 MB
  - **Processes:** 9 PIDs
  - **Image Size:** 456 MB

- **storysaz-redis** (Redis 7 Alpine)
  - **Status:** Up 7 hours (healthy)
  - **Port:** 0.0.0.0:6381->6379/tcp (public)
  - **CPU Usage:** 0.50%
  - **Memory:** 8.922 MiB / 7.762 GiB (0.11%)
  - **Network I/O:** 4.47 MB / 1.38 MB
  - **Block I/O:** 73.7 kB / 1.81 MB
  - **Processes:** 6 PIDs
  - **Image Size:** 41.4 MB

**Total Storysaz Project Resources:**
- CPU: ~0.53%
- Memory: ~121 MB (1.52%)
- Disk: ~980 MB (images + volumes + project)

---

## 📦 PM2 Projects

### 1. linux-backend
- **Status:** Online
- **Uptime:** 3 hours
- **Restarts:** 134
- **CPU:** 0%
- **Memory:** 101.3 MB
- **PID:** 648568
- **Process:** node /var/www/linux-laptop/backend/index.js
- **Path:** /var/www/linux-laptop/backend

### 2. linux-frontend
- **Status:** Online
- **Uptime:** 14 hours
- **Restarts:** 7
- **CPU:** 0%
- **Memory:** 63.2 MB
- **PID:** 457988 (npm), 458002 (node)
- **Process:** 
  - npm run start
  - vite preview --port 4173
- **Path:** /var/www/linux-laptop/frontend

**Total PM2 Resources:**
- CPU: ~0%
- Memory: ~164.5 MB

---

## 🚀 Direct Node.js Processes

### Additional Node Processes (Not managed by PM2):
1. **Process 570321**
   - **Memory:** 127.3 MB
   - **Command:** node index.js
   - **Started:** 15:04

2. **Process 572800**
   - **Memory:** 97.6 MB
   - **Command:** node index.js
   - **Started:** 15:10

**Total Direct Node Resources:**
- Memory: ~225 MB

---

## 🌐 Web Servers

### Nginx
- **Status:** Active (running)
- **Configured Sites:**
  1. hooman → /etc/nginx/sites-available/hooman
  2. linux-laptop.conf → /etc/nginx/sites-available/linux-laptop.conf
  3. storysaz-back → /etc/nginx/sites-available/storysaz-back

### Apache
- **Status:** Active (running)
- **Configured Sites:**
  1. 000-default.conf → /etc/apache2/sites-available/000-default.conf

---

## 📁 Project Locations

1. **Hooman Project:**
   - `/opt/hooman` (114 MB)
   - Docker Compose: `/opt/hooman/docker-compose.yml`
   - Docker Compose (Backend): `/opt/hooman/backend/docker-compose.yml`

2. **Storysaz Project:**
   - `/opt/storysaz-back` (6.8 MB)
   - Docker Compose: `/opt/storysaz-back/docker-compose.yml`

3. **Linux Laptop Project:**
   - `/var/www/linux-laptop` (410 MB)
   - Frontend: `/var/www/linux-laptop/frontend`
   - Backend: `/var/www/linux-laptop/backend`
   - Docker Compose: `/var/www/linux-laptop/backend/docker-compose.yml`

---

## 📊 Total Resource Summary

### Docker Projects:
- **Total Containers:** 6
- **Total CPU Usage:** ~1.02%
- **Total Memory Usage:** ~297 MB (3.74%)
- **Total Disk Usage:** ~1.6 GB (images + volumes)

### PM2 Projects:
- **Total Processes:** 2
- **Total Memory:** ~164.5 MB (2.07%)

### Direct Node Processes:
- **Total Memory:** ~225 MB (2.83%)

### Grand Total:
- **CPU Usage:** ~1-2% (very low)
- **Memory Usage:** ~686 MB (8.64% of 7.8 GB)
- **Disk Usage:** ~2 GB (1.35% of 148 GB)

---

## ⚠️ Notes & Recommendations

1. **PM2 Process "linux-backend" has 134 restarts** - This indicates potential stability issues. Review logs.
2. **All resources are well within limits** - System has plenty of capacity.
3. **Storysaz API is publicly exposed** - Port 3002, 5434, and 6381 are open to 0.0.0.0
4. **Hooman API is localhost only** - More secure configuration
5. **Both Nginx and Apache are running** - Consider using only one reverse proxy

---

## 🔍 Docker Compose Files Found

1. `/opt/hooman/docker-compose.yml`
2. `/opt/hooman/backend/docker-compose.yml`
3. `/opt/storysaz-back/docker-compose.yml`
4. `/var/www/linux-laptop/backend/docker-compose.yml`

---

*Report generated automatically*

