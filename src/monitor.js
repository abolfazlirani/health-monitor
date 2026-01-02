const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SystemMonitor {
  constructor() {
    this.monitoringInterval = null;
    this.intervalMs = parseInt(process.env.MONITOR_INTERVAL) || 5000; // 5 seconds
    this.lastData = null;
  }

  async getTopProcesses(sortBy = 'cpu', limit = 5) {
    try {
      const processes = await si.processes();

      // Sort by CPU or memory
      const sorted = processes.list.sort((a, b) => {
        if (sortBy === 'cpu') {
          return (b.cpu || 0) - (a.cpu || 0);
        } else {
          return (b.mem || 0) - (a.mem || 0);
        }
      });

      return sorted.slice(0, limit).map(p => ({
        pid: p.pid,
        name: p.name,
        user: p.user || 'unknown',
        cpu: (p.cpu || 0).toFixed(1),
        mem: (p.mem || 0).toFixed(1),
        command: (p.command || '').substring(0, 50)
      }));
    } catch (error) {
      console.error('Error getting top processes:', error);
      return [];
    }
  }

  async getSystemHealth() {
    try {
      const [cpu, mem, fs] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize()
      ]);

      const cpuUsage = Math.round(cpu.currentLoad || 0);
      // Use active memory (excludes cache/buffers) for accurate usage like htop
      const activeMemory = mem.active || mem.used;
      const memUsage = Math.round((activeMemory / mem.total) * 100);
      const diskUsage = fs.length > 0
        ? Math.round((fs[0].used / fs[0].size) * 100)
        : 0;

      // Get top processes when usage is high
      let topCpuProcesses = [];
      let topMemProcesses = [];

      if (cpuUsage > 50) {
        topCpuProcesses = await this.getTopProcesses('cpu', 3);
      }
      if (memUsage > 50) {
        topMemProcesses = await this.getTopProcesses('mem', 3);
      }

      return {
        cpu: {
          usage: cpuUsage,
          cores: cpu.cpus?.length || 0,
          model: cpu.cpus?.[0]?.model || 'Unknown',
          topProcesses: topCpuProcesses
        },
        memory: {
          usage: memUsage,
          total: Math.round(mem.total / 1024 / 1024 / 1024), // GB
          used: Math.round(activeMemory / 1024 / 1024 / 1024), // GB (active, not used)
          free: Math.round(mem.available / 1024 / 1024 / 1024), // GB (available, not free)
          topProcesses: topMemProcesses
        },
        disk: {
          usage: diskUsage,
          total: fs.length > 0 ? Math.round(fs[0].size / 1024 / 1024 / 1024) : 0, // GB
          used: fs.length > 0 ? Math.round(fs[0].used / 1024 / 1024 / 1024) : 0, // GB
          free: fs.length > 0 ? Math.round((fs[0].size - fs[0].used) / 1024 / 1024 / 1024) : 0, // GB
          mount: fs.length > 0 ? fs[0].mount : '/'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  async getDetailedStats() {
    try {
      const [cpu, mem, fs, network, processes] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.processes()
      ]);

      return {
        cpu: {
          manufacturer: cpu.manufacturer || 'Unknown',
          brand: cpu.brand || 'Unknown',
          cores: cpu.cores || 0,
          physicalCores: cpu.physicalCores || 0,
          speed: cpu.speed || 'Unknown'
        },
        memory: {
          total: Math.round(mem.total / 1024 / 1024 / 1024),
          used: Math.round(mem.used / 1024 / 1024 / 1024),
          free: Math.round(mem.free / 1024 / 1024 / 1024),
          available: Math.round(mem.available / 1024 / 1024 / 1024),
          swapTotal: Math.round((mem.swapTotal || 0) / 1024 / 1024 / 1024),
          swapUsed: Math.round((mem.swapUsed || 0) / 1024 / 1024 / 1024)
        },
        disk: fs.map(f => ({
          fs: f.fs,
          type: f.type,
          size: Math.round(f.size / 1024 / 1024 / 1024),
          used: Math.round(f.used / 1024 / 1024 / 1024),
          available: Math.round((f.size - f.used) / 1024 / 1024 / 1024),
          mount: f.mount,
          usage: Math.round((f.used / f.size) * 100)
        })),
        network: network.length > 0 ? {
          interface: network[0].iface,
          received: Math.round(network[0].rx_bytes / 1024 / 1024),
          sent: Math.round(network[0].tx_bytes / 1024 / 1024)
        } : null,
        processes: {
          total: processes.all || 0,
          running: processes.running || 0,
          sleeping: processes.sleeping || 0,
          blocked: processes.blocked || 0,
          zombies: processes.zombies || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      throw error;
    }
  }

  async getDockerContainers() {
    try {
      // Check if Docker is available
      const { stdout: dockerCheck } = await execPromise('docker --version').catch(() => ({ stdout: '' }));
      if (!dockerCheck) {
        return [];
      }

      // Get running containers with stats
      const { stdout } = await execPromise(
        'docker stats --no-stream --format "{{.Container}}|{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}"'
      ).catch(() => ({ stdout: '' }));

      if (!stdout.trim()) {
        return [];
      }

      const containers = stdout.trim().split('\n').map(line => {
        const [id, name, cpu, memUsage, memPerc, netIO, blockIO, pids] = line.split('|');

        // Parse memory usage (e.g., "61.4MiB / 7.762GiB")
        const memParts = memUsage.split(' / ');
        const used = memParts[0] || '0';
        const total = memParts[1] || '0';

        return {
          id: id.substring(0, 12),
          name,
          cpu: parseFloat(cpu) || 0,
          memory: {
            usage: parseFloat(memPerc) || 0,
            used,
            total
          },
          network: netIO,
          blockIO,
          pids: parseInt(pids) || 0
        };
      });

      return containers;
    } catch (error) {
      console.error('Error getting Docker containers:', error);
      return [];
    }
  }

  async getPM2Processes() {
    try {
      // Check if PM2 is available
      const { stdout: pm2Check } = await execPromise('pm2 --version').catch(() => ({ stdout: '' }));
      if (!pm2Check) {
        return [];
      }

      const { stdout } = await execPromise('pm2 jlist').catch(() => ({ stdout: '[]' }));
      const processes = JSON.parse(stdout || '[]');

      return processes.map(proc => ({
        name: proc.name,
        pid: proc.pid,
        status: proc.pm2_env?.status || 'unknown',
        cpu: proc.monit?.cpu || 0,
        memory: Math.round((proc.monit?.memory || 0) / 1024 / 1024), // MB
        uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
        restarts: proc.pm2_env?.restart_time || 0
      }));
    } catch (error) {
      console.error('Error getting PM2 processes:', error);
      return [];
    }
  }

  async getNodeProcesses() {
    try {
      const processes = await si.processes();

      // Filter for Node.js processes (excluding PM2 and this process)
      const nodeProcs = processes.list
        .filter(proc =>
          proc.command &&
          proc.command.includes('node') &&
          !proc.command.includes('pm2') &&
          proc.pid !== process.pid
        )
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          command: proc.command,
          cpu: proc.cpu || 0,
          memory: Math.round((proc.mem || 0) / 1024 / 1024), // MB
          started: proc.started || ''
        }));

      return nodeProcs;
    } catch (error) {
      console.error('Error getting Node processes:', error);
      return [];
    }
  }

  async getApplicationStats() {
    try {
      const [docker, pm2, node] = await Promise.all([
        this.getDockerContainers(),
        this.getPM2Processes(),
        this.getNodeProcesses()
      ]);

      // Calculate totals
      const dockerTotalCPU = docker.reduce((sum, c) => sum + c.cpu, 0);
      const dockerTotalMem = docker.reduce((sum, c) => sum + c.memory.usage, 0);

      const pm2TotalCPU = pm2.reduce((sum, p) => sum + p.cpu, 0);
      const pm2TotalMem = pm2.reduce((sum, p) => sum + p.memory, 0);

      const nodeTotalCPU = node.reduce((sum, p) => sum + p.cpu, 0);
      const nodeTotalMem = node.reduce((sum, p) => sum + p.memory, 0);

      return {
        docker: {
          containers: docker,
          total: docker.length,
          totalCPU: Math.round(dockerTotalCPU * 100) / 100,
          totalMemory: Math.round(dockerTotalMem * 100) / 100
        },
        pm2: {
          processes: pm2,
          total: pm2.length,
          totalCPU: Math.round(pm2TotalCPU * 100) / 100,
          totalMemory: pm2TotalMem
        },
        node: {
          processes: node,
          total: node.length,
          totalCPU: Math.round(nodeTotalCPU * 100) / 100,
          totalMemory: nodeTotalMem
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting application stats:', error);
      throw error;
    }
  }

  startMonitoring(callback) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const healthData = await this.getSystemHealth();

        // Only trigger callback if values increased significantly
        if (this.lastData) {
          const cpuIncreased = healthData.cpu.usage > this.lastData.cpu.usage;
          const memIncreased = healthData.memory.usage > this.lastData.memory.usage;
          const diskIncreased = healthData.disk.usage > this.lastData.disk.usage;

          if (cpuIncreased || memIncreased || diskIncreased) {
            callback(healthData);
          }
        }

        this.lastData = healthData;
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }, this.intervalMs);

    // Initial data fetch
    this.getSystemHealth().then(data => {
      this.lastData = data;
    });
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

module.exports = new SystemMonitor();


