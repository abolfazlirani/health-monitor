class HealthDashboard {
    constructor() {
        this.apiUrl = '/api/health';
        this.statsUrl = '/api/stats';
        this.appsUrl = '/api/applications';
        this.updateInterval = 5000;
        this.intervalId = null;
        this.init();
    }

    init() {
        this.injectSVGGradient();
        this.updateHealthData();
        this.updateApplications();
        this.updateDetailedStats();
        this.updateBackups();
        this.startAutoUpdate();
        this.setupEventListeners();
        this.setupTabs();
    }

    injectSVGGradient() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.position = 'absolute';
        svg.innerHTML = `
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00ced1" />
                    <stop offset="50%" style="stop-color:#00ffff" />
                    <stop offset="100%" style="stop-color:#7fffd4" />
                </linearGradient>
            </defs>
        `;
        document.body.insertBefore(svg, document.body.firstChild);
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`${tabName}-panel`).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateHealthData();
                this.updateApplications();
                this.updateDetailedStats();
            });
        }
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    updateCircularProgress(id, value) {
        const circle = document.querySelector(`#${id} .progress-ring`);
        if (circle) {
            const circumference = 283; // 2 * PI * 45
            const offset = circumference - (value / 100) * circumference;
            circle.style.strokeDashoffset = offset;

            // Update color based on value
            if (value >= 80) {
                circle.style.stroke = '#ff4757';
            } else if (value >= 60) {
                circle.style.stroke = '#ffaa00';
            } else {
                circle.style.stroke = 'url(#gradient)';
            }
        }
    }

    async updateHealthData() {
        const data = await this.fetchData(this.apiUrl);
        if (!data) return;

        // Update CPU
        document.getElementById('cpu-usage').textContent = data.cpu.usage;
        this.updateCircularProgress('cpu-circle', data.cpu.usage);
        document.getElementById('cpu-cores').textContent = data.cpu.cores;
        document.getElementById('cpu-model').textContent = (data.cpu.model || 'Unknown').substring(0, 20);

        // Update Memory
        document.getElementById('memory-usage').textContent = data.memory.usage;
        this.updateCircularProgress('memory-circle', data.memory.usage);
        document.getElementById('memory-used').textContent = `${data.memory.used} GB`;
        document.getElementById('memory-total').textContent = `${data.memory.total} GB`;

        // Update Disk
        document.getElementById('disk-usage').textContent = data.disk.usage;
        this.updateCircularProgress('disk-circle', data.disk.usage);
        document.getElementById('disk-used').textContent = `${data.disk.used} GB`;
        document.getElementById('disk-total').textContent = `${data.disk.total} GB`;

        // Update timestamp
        const now = new Date();
        document.getElementById('last-update').textContent =
            now.toLocaleTimeString('en-US', { hour12: false });
    }

    async updateApplications() {
        const data = await this.fetchData(this.appsUrl);
        if (!data) return;

        this.updateDockerContainers(data.docker);
        this.updatePM2Processes(data.pm2);
        this.updateNodeProcesses(data.node);

        this.updateCurrentSummary();
    }

    updateCurrentSummary() {
        const activeTab = document.querySelector('.tab.active');
        if (!activeTab) return;

        const type = activeTab.dataset.tab;
        const summaryEl = document.getElementById('current-cpu');
        const memEl = document.getElementById('current-mem');

        if (type === 'docker') {
            const cpu = document.getElementById('docker-count').parentElement.querySelector('[data-cpu]');
            // Summary will be updated when data is fetched
        }
    }

    updateDockerContainers(docker) {
        document.getElementById('docker-count').textContent = docker.total;

        const summaryValue = document.querySelector('#current-cpu .summary-value');
        const memSummary = document.querySelector('#current-mem .summary-value');

        if (document.querySelector('.tab.active').dataset.tab === 'docker') {
            summaryValue.textContent = `${docker.totalCPU}%`;
            memSummary.textContent = `${docker.totalMemory}%`;
        }

        const list = document.getElementById('docker-list');
        if (docker.containers.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🐳</span>
                    <p>No Docker containers running</p>
                </div>
            `;
            return;
        }

        list.innerHTML = docker.containers.map(container => `
            <div class="app-card">
                <div class="app-card-header">
                    <div class="app-name">
                        <span>🐳</span>
                        <span>${container.name}</span>
                    </div>
                    <span class="app-id">${container.id}</span>
                </div>
                <div class="app-stats">
                    <span class="app-stat">CPU: <strong>${container.cpu}%</strong></span>
                    <span class="app-stat">Memory: <strong>${container.memory.used}</strong></span>
                    <span class="app-stat">PIDs: <strong>${container.pids}</strong></span>
                </div>
                <div class="app-details">
                    <span>Network: ${container.network}</span>
                    <span>Block I/O: ${container.blockIO}</span>
                </div>
            </div>
        `).join('');
    }

    updatePM2Processes(pm2) {
        document.getElementById('pm2-count').textContent = pm2.total;

        if (document.querySelector('.tab.active').dataset.tab === 'pm2') {
            document.querySelector('#current-cpu .summary-value').textContent = `${pm2.totalCPU}%`;
            document.querySelector('#current-mem .summary-value').textContent = `${pm2.totalMemory} MB`;
        }

        const list = document.getElementById('pm2-list');
        if (pm2.processes.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">⚡</span>
                    <p>No PM2 processes running</p>
                </div>
            `;
            return;
        }

        list.innerHTML = pm2.processes.map(proc => {
            const uptimeHours = Math.floor(proc.uptime / 1000 / 60 / 60);
            const uptimeMinutes = Math.floor((proc.uptime / 1000 / 60) % 60);
            const statusClass = proc.status === 'online' ? 'status-online' : 'status-offline';

            return `
                <div class="app-card">
                    <div class="app-card-header">
                        <div class="app-name">
                            <span>⚡</span>
                            <span>${proc.name}</span>
                        </div>
                        <span class="app-status ${statusClass}">${proc.status}</span>
                    </div>
                    <div class="app-stats">
                        <span class="app-stat">CPU: <strong>${proc.cpu}%</strong></span>
                        <span class="app-stat">Memory: <strong>${proc.memory} MB</strong></span>
                        <span class="app-stat">PID: <strong>${proc.pid}</strong></span>
                    </div>
                    <div class="app-details">
                        <span>Uptime: ${uptimeHours}h ${uptimeMinutes}m</span>
                        <span>Restarts: ${proc.restarts}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateNodeProcesses(node) {
        document.getElementById('node-count').textContent = node.total;

        if (document.querySelector('.tab.active').dataset.tab === 'node') {
            document.querySelector('#current-cpu .summary-value').textContent = `${node.totalCPU}%`;
            document.querySelector('#current-mem .summary-value').textContent = `${node.totalMemory} MB`;
        }

        const list = document.getElementById('node-list');
        if (node.processes.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📦</span>
                    <p>No Node.js processes running</p>
                </div>
            `;
            return;
        }

        list.innerHTML = node.processes.map(proc => `
            <div class="app-card">
                <div class="app-card-header">
                    <div class="app-name">
                        <span>📦</span>
                        <span>${proc.name}</span>
                    </div>
                    <span class="app-id">PID: ${proc.pid}</span>
                </div>
                <div class="app-stats">
                    <span class="app-stat">CPU: <strong>${proc.cpu}%</strong></span>
                    <span class="app-stat">Memory: <strong>${proc.memory} MB</strong></span>
                </div>
                <div class="app-details">
                    <span class="command-text">${proc.command || '--'}</span>
                </div>
            </div>
        `).join('');
    }

    async updateDetailedStats() {
        const data = await this.fetchData(this.statsUrl);
        if (!data) return;

        const detailsGrid = document.getElementById('details-grid');
        if (!detailsGrid) return;

        const details = [
            { label: 'CPU Brand', value: data.cpu.brand || 'Unknown' },
            { label: 'CPU Cores', value: `${data.cpu.physicalCores || 0} / ${data.cpu.cores || 0}` },
            { label: 'CPU Speed', value: `${data.cpu.speed || 0} GHz` },
            { label: 'Memory Available', value: `${data.memory.available || 0} GB` },
            { label: 'Swap Total', value: `${data.memory.swapTotal || 0} GB` },
            { label: 'Swap Used', value: `${data.memory.swapUsed || 0} GB` },
        ];

        if (data.network) {
            details.push(
                { label: 'Network Interface', value: data.network.interface },
                { label: 'Network Received', value: `${data.network.received} MB` },
                { label: 'Network Sent', value: `${data.network.sent} MB` }
            );
        }

        if (data.processes) {
            details.push(
                { label: 'Total Processes', value: data.processes.total },
                { label: 'Running', value: data.processes.running },
                { label: 'Sleeping', value: data.processes.sleeping }
            );
        }

        detailsGrid.innerHTML = details.map(d => `
            <div class="detail-card">
                <span class="label">${d.label}</span>
                <span class="value">${d.value}</span>
            </div>
        `).join('');
    }

    startAutoUpdate() {
        this.intervalId = setInterval(() => {
            this.updateHealthData();
            this.updateApplications();
        }, this.updateInterval);

        setInterval(() => {
            this.updateDetailedStats();
            this.updateNetworkData();
            this.updateTopProcesses();
        }, this.updateInterval * 2);

        // Initial load
        this.updateNetworkData();
        this.updateTopProcesses();
    }

    stopAutoUpdate() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // ==================== BACKUP MANAGEMENT ====================

    async updateBackups() {
        try {
            const response = await fetch('/api/backups');
            const backups = await response.json();

            const container = document.getElementById('backup-list');
            if (!container) return;

            if (!backups || backups.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">💾</span>
                        <p>No backups yet</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = backups.map(b => {
                const date = new Date(b.timestamp);
                const formattedDate = date.toLocaleDateString('fa-IR') + ' ' +
                    date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
                const statusClass = b.status === 'success' ? 'status-success' : 'status-failed';
                const statusIcon = b.status === 'success' ? '✅' : '❌';
                const databases = b.databases ? b.databases.split(',').join(', ') : 'همه';

                return `
                    <div class="backup-card ${statusClass}">
                        <div class="backup-header">
                            <span class="backup-status">${statusIcon} ${b.status === 'success' ? 'موفق' : 'ناموفق'}</span>
                            <span class="backup-size">${b.size || '--'}</span>
                        </div>
                        <div class="backup-date">${formattedDate}</div>
                        <div class="backup-details">
                            <span class="backup-dbs">💿 ${databases}</span>
                        </div>
                        ${b.error ? `<div class="backup-error">⚠️ ${b.error}</div>` : ''}
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error updating backups:', error);
        }
    }

    // ==================== NETWORK MONITORING ====================

    async updateNetworkData() {
        try {
            const response = await fetch('/api/network');
            const data = await response.json();

            this.updateBackendList(data.backends || []);
            this.updatePingList(data.ping || []);
            this.updateBandwidth(data.stats || {});
            this.updatePortsList(data.ports?.ports || []);
        } catch (error) {
            console.error('Error updating network data:', error);
        }
    }

    updateBackendList(backends) {
        const container = document.getElementById('backend-list');
        if (!container) return;

        if (backends.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span><p>No backends configured</p></div>';
            return;
        }

        container.innerHTML = backends.map(b => `
            <div class="backend-item ${b.status}">
                <div class="backend-info">
                    <div class="backend-name">${b.name}</div>
                    <div class="backend-url">${b.url}</div>
                </div>
                <div class="backend-status">
                    <span class="backend-badge ${b.status}">
                        ${b.status === 'healthy' ? '✓ Healthy' :
                b.status === 'degraded' ? '⚠ Degraded' :
                    '✗ Down'}
                    </span>
                    ${b.responseTime ? `<div class="backend-time">${b.responseTime}ms</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    updatePingList(pingData) {
        const container = document.getElementById('ping-list');
        if (!container || pingData.length === 0) return;

        container.innerHTML = pingData.map(p => `
            <div class="ping-item">
                <span class="host">${p.host}</span>
                <span class="latency ${p.status}">
                    ${p.status === 'online' ? p.latency + ' ms' : 'Offline'}
                </span>
            </div>
        `).join('');
    }

    updateBandwidth(stats) {
        const rxSpeed = document.getElementById('rx-speed');
        const txSpeed = document.getElementById('tx-speed');
        const activeConn = document.getElementById('active-conn');

        if (rxSpeed) rxSpeed.textContent = (stats.rxSec || 0) + ' KB/s';
        if (txSpeed) txSpeed.textContent = (stats.txSec || 0) + ' KB/s';
        if (activeConn) activeConn.textContent = stats.activeConnections || 0;
    }

    updatePortsList(ports) {
        const container = document.getElementById('ports-list');
        if (!container) return;

        if (ports.length === 0) {
            container.innerHTML = '<div class="empty-state"><span class="empty-icon">🔌</span><p>No open ports</p></div>';
            return;
        }

        container.innerHTML = ports.slice(0, 20).map(p => `
            <span class="port-badge" title="${p.process || 'unknown'}">${p.port}</span>
        `).join('');
    }

    // ==================== PROCESS MANAGEMENT ====================

    async updateTopProcesses() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            const container = document.getElementById('top-processes');
            if (!container) return;

            const processes = data.cpu?.topProcesses || [];

            if (processes.length === 0) {
                container.innerHTML = '<div class="empty-state"><span class="empty-icon">✅</span><p>No high CPU processes</p></div>';
                return;
            }

            container.innerHTML = processes.map(p => `
                <div class="process-item">
                    <div class="process-info">
                        <div class="process-name">${p.name} (${p.user})</div>
                        <div class="process-stats">PID: ${p.pid} | CPU: ${p.cpu}% | MEM: ${p.mem}%</div>
                    </div>
                    <div class="process-actions">
                        <button class="kill-btn" onclick="dashboard.killProcess(${p.pid})">Kill</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error updating top processes:', error);
        }
    }

    async killProcess(pid) {
        if (!confirm(`Are you sure you want to kill process ${pid}?`)) return;

        try {
            const response = await fetch('/api/process/kill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid })
            });
            const result = await response.json();

            if (result.success) {
                alert('Process killed successfully');
                this.updateTopProcesses();
                this.updateApplications();
            } else {
                alert('Failed to kill process: ' + result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async runQuickCommand(command) {
        const output = document.getElementById('command-output');
        if (!output) return;

        output.innerHTML = '<pre>Running...</pre>';

        try {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            const result = await response.json();

            if (result.success) {
                output.innerHTML = `<pre>${result.output}</pre>`;
            } else {
                output.innerHTML = `<pre style="color: #ff5a5f;">Error: ${result.message}</pre>`;
            }
        } catch (error) {
            output.innerHTML = `<pre style="color: #ff5a5f;">Error: ${error.message}</pre>`;
        }
    }

    async restartPM2(name) {
        if (!confirm(`Restart PM2 process "${name}"?`)) return;

        try {
            const response = await fetch('/api/pm2/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await response.json();
            alert(result.success ? 'Restarted successfully' : 'Failed: ' + result.message);
            this.updateApplications();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async restartDocker(name) {
        if (!confirm(`Restart Docker container "${name}"?`)) return;

        try {
            const response = await fetch('/api/docker/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await response.json();
            alert(result.success ? 'Restarted successfully' : 'Failed: ' + result.message);
            this.updateApplications();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

const dashboard = new HealthDashboard();

