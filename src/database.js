const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '..', 'data', 'health-monitor.db');
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          reject(err);
        } else {
          console.log('✅ Database connected');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const createMetricsTable = `
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        cpu_usage REAL NOT NULL,
        memory_usage REAL NOT NULL,
        disk_usage REAL NOT NULL,
        top_process_name TEXT,
        top_process_cpu REAL,
        top_process_user TEXT,
        top_process_pid INTEGER
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics(timestamp DESC);
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createMetricsTable, (err) => {
        if (err) {
          console.error('❌ Error creating metrics table:', err);
          reject(err);
        } else {
          this.db.run(createIndexes, (err) => {
            if (err) {
              console.error('❌ Error creating indexes:', err);
              reject(err);
            } else {
              console.log('✅ Database tables ready');
              resolve();
            }
          });
        }
      });
    });
  }

  async saveMetrics(data) {
    const sql = `
      INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, top_process_name, top_process_cpu, top_process_user, top_process_pid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const topProcess = data.cpu?.topProcesses?.[0];
    const values = [
      data.cpu?.usage || 0,
      data.memory?.usage || 0,
      data.disk?.usage || 0,
      topProcess?.name || null,
      topProcess?.cpu ? parseFloat(topProcess.cpu) : null,
      topProcess?.user || null,
      topProcess?.pid || null
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function (err) {
        if (err) {
          console.error('❌ Error saving metrics:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getRecentMetrics(minutes = 60) {
    const sql = `
      SELECT * FROM metrics 
      WHERE timestamp >= datetime('now', '-${minutes} minutes')
      ORDER BY timestamp DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('❌ Error fetching metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAverageCPU(minutes = 5) {
    const sql = `
      SELECT AVG(cpu_usage) as avg_cpu, COUNT(*) as count
      FROM metrics 
      WHERE timestamp >= datetime('now', '-${minutes} minutes')
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) {
          console.error('❌ Error calculating average CPU:', err);
          reject(err);
        } else {
          resolve({
            average: row?.avg_cpu || 0,
            sampleCount: row?.count || 0
          });
        }
      });
    });
  }

  async getAverageMemory(minutes = 5) {
    const sql = `
      SELECT AVG(memory_usage) as avg_mem
      FROM metrics 
      WHERE timestamp >= datetime('now', '-${minutes} minutes')
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.avg_mem || 0);
        }
      });
    });
  }

  async getCPUTrend(minutes = 15) {
    const sql = `
      SELECT 
        strftime('%Y-%m-%d %H:%M', timestamp) as time,
        AVG(cpu_usage) as cpu
      FROM metrics 
      WHERE timestamp >= datetime('now', '-${minutes} minutes')
      GROUP BY strftime('%Y-%m-%d %H:%M', timestamp)
      ORDER BY timestamp ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async cleanup(daysToKeep = 7) {
    const sql = `
      DELETE FROM metrics 
      WHERE timestamp < datetime('now', '-${daysToKeep} days')
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, function (err) {
        if (err) {
          console.error('❌ Error cleaning up old metrics:', err);
          reject(err);
        } else {
          console.log(`✅ Cleaned up ${this.changes} old metric records`);
          resolve(this.changes);
        }
      });
    });
  }

  async getHourlyMetrics() {
    const sql = `
      SELECT 
        strftime('%Y-%m-%d %H:00:00', timestamp) as time_period,
        AVG(cpu_usage) as avg_cpu,
        MAX(cpu_usage) as max_cpu,
        MIN(cpu_usage) as min_cpu,
        AVG(memory_usage) as avg_memory,
        MAX(memory_usage) as max_memory,
        MIN(memory_usage) as min_memory
      FROM metrics 
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY strftime('%Y-%m-%d %H', timestamp)
      ORDER BY time_period ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('❌ Error fetching hourly metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getDailyMetrics() {
    const sql = `
      SELECT 
        strftime('%Y-%m-%d', timestamp) as time_period,
        AVG(cpu_usage) as avg_cpu,
        MAX(cpu_usage) as max_cpu,
        MIN(cpu_usage) as min_cpu,
        AVG(memory_usage) as avg_memory,
        MAX(memory_usage) as max_memory,
        MIN(memory_usage) as min_memory
      FROM metrics 
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY strftime('%Y-%m-%d', timestamp)
      ORDER BY time_period ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('❌ Error fetching daily metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getWeeklyMetrics() {
    const sql = `
      SELECT 
        strftime('%Y-W%W', timestamp) as time_period,
        AVG(cpu_usage) as avg_cpu,
        MAX(cpu_usage) as max_cpu,
        MIN(cpu_usage) as min_cpu,
        AVG(memory_usage) as avg_memory,
        MAX(memory_usage) as max_memory,
        MIN(memory_usage) as min_memory
      FROM metrics 
      WHERE timestamp >= datetime('now', '-28 days')
      GROUP BY strftime('%Y-%W', timestamp)
      ORDER BY time_period ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('❌ Error fetching weekly metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
