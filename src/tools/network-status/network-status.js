/**
 * Network Status Monitor Tool
 * Monitors network connection status and provides real-time feedback
 */

class NetworkStatusMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionHistory = [];
    this.statistics = {
      totalConnections: 0,
      totalDisconnections: 0,
      sessionStartTime: Date.now(),
      totalOnlineTime: 0,
      totalOfflineTime: 0,
      longestOfflineTime: 0,
      currentOfflineStart: null,
      currentOnlineStart: null
    };
    this.settings = {
      notifications: true,
      sound: true,
      autoTest: true
    };
    this.autoTestInterval = null;
    this.currentTab = 'history';

    this.init();
  }

  init() {
    this.loadSettings();
    // Set currentOnlineStart if online and not already set
    if (this.isOnline && !this.statistics.currentOnlineStart) {
      this.statistics.currentOnlineStart = Date.now();
    }
    this.setupEventListeners();
    this.setupNetworkListeners();
    this.updateUI();
    this.startAutoTest();
    this.checkInitialStatus();
  }

  loadSettings() {
    const saved = localStorage.getItem('networkMonitorSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }

    const history = localStorage.getItem('networkHistory');
    if (history) {
      this.connectionHistory = JSON.parse(history);
    }

    const stats = localStorage.getItem('networkStats');
    if (stats) {
      this.statistics = { ...this.statistics, ...JSON.parse(stats) };
    }
  }

  saveSettings() {
    localStorage.setItem('networkMonitorSettings', JSON.stringify(this.settings));
    localStorage.setItem('networkHistory', JSON.stringify(this.connectionHistory));
    localStorage.setItem('networkStats', JSON.stringify(this.statistics));
  }

  setupEventListeners() {
    // Network status listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // UI event listeners
    document.getElementById('test-connection').addEventListener('click', () => this.testConnection());
    document.getElementById('enable-notifications').addEventListener('change', (e) => {
      this.settings.notifications = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('enable-sound').addEventListener('change', (e) => {
      this.settings.sound = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('auto-test').addEventListener('change', (e) => {
      this.settings.autoTest = e.target.checked;
      this.saveSettings();
      if (e.target.checked) {
        this.startAutoTest();
      } else {
        this.stopAutoTest();
      }
    });

    // Action buttons
    document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
    document.getElementById('export-log').addEventListener('click', () => this.exportLog());
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // History filter
    document.getElementById('history-filter').addEventListener('change', () => this.updateHistoryDisplay());
    document.getElementById('refresh-history').addEventListener('click', () => this.updateHistoryDisplay());

    // Load initial settings
    document.getElementById('enable-notifications').checked = this.settings.notifications;
    document.getElementById('enable-sound').checked = this.settings.sound;
    document.getElementById('auto-test').checked = this.settings.autoTest;
  }

  setupNetworkListeners() {
    // Listen for connection changes if supported
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateConnectionInfo();
      });
    }
  }

  checkInitialStatus() {
    // Check initial status and update UI
    setTimeout(() => {
      this.updateNetworkStatus();
      this.updateConnectionInfo();
    }, 100);
  }

  handleOnline() {
    this.isOnline = true;
    this.statistics.totalConnections++;

    // Calculate offline time if we were offline
    if (this.statistics.currentOfflineStart) {
      const offlineTime = Date.now() - this.statistics.currentOfflineStart;
      this.statistics.totalOfflineTime += offlineTime;
      this.statistics.longestOfflineTime = Math.max(this.statistics.longestOfflineTime, offlineTime);
      this.statistics.currentOfflineStart = null;
    }

    // Set currentOnlineStart if not already set
    if (!this.statistics.currentOnlineStart) {
      this.statistics.currentOnlineStart = Date.now();
    }

    this.addToHistory('online', 'Connection restored');
    this.updateNetworkStatus();
    this.showNotification('✅ You are back online', 'online');
    this.playSound('online');
    this.saveSettings();
  }

  handleOffline() {
    this.isOnline = false;
    this.statistics.totalDisconnections++;
    this.statistics.currentOfflineStart = Date.now();

    // Calculate online time if we were online
    if (this.statistics.currentOnlineStart) {
      const onlineTime = Date.now() - this.statistics.currentOnlineStart;
      this.statistics.totalOnlineTime += onlineTime;
      this.statistics.currentOnlineStart = null;
    }

    this.addToHistory('offline', 'Connection lost');
    this.updateNetworkStatus();
    this.showNotification('⚠️ You are currently offline', 'offline');
    this.playSound('offline');
    this.saveSettings();
  }

  updateNetworkStatus() {
    const banner = document.getElementById('network-banner');
    const bannerIcon = document.getElementById('banner-icon');
    const bannerText = document.getElementById('banner-text');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (this.isOnline) {
      banner.className = 'network-banner online show';
      bannerIcon.textContent = '✅';
      bannerText.textContent = 'You are online';
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Online';

      // Hide banner after 3 seconds if online
      setTimeout(() => {
        if (this.isOnline) {
          banner.classList.remove('show');
        }
      }, 3000);
    } else {
      banner.className = 'network-banner offline show';
      bannerIcon.textContent = '⚠️';
      bannerText.textContent = 'You are offline';
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Offline';
    }

    this.updateConnectionInfo();
    this.updateLastUpdated();
  }

  updateConnectionInfo() {
    const connection = navigator.connection;

    if (connection) {
      document.getElementById('connection-type').textContent = connection.type || 'Unknown';
      document.getElementById('effective-type').textContent = connection.effectiveType || 'Unknown';
      document.getElementById('downlink').textContent = connection.downlink ? `${connection.downlink} Mbps` : 'Unknown';
      document.getElementById('rtt').textContent = connection.rtt ? `${connection.rtt} ms` : 'Unknown';
    } else {
      document.getElementById('connection-type').textContent = 'Not supported';
      document.getElementById('effective-type').textContent = 'Not supported';
      document.getElementById('downlink').textContent = 'Not supported';
      document.getElementById('rtt').textContent = 'Not supported';
    }
  }

  updateLastUpdated() {
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  }

  async testConnection() {
    const testBtn = document.getElementById('test-connection');
    const progress = document.getElementById('test-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const pingResult = document.getElementById('ping-result');
    const speedResult = document.getElementById('speed-result');
    const dnsResult = document.getElementById('dns-result');

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    progress.classList.add('active');

    // Reset results
    pingResult.textContent = 'Testing...';
    pingResult.className = 'test-result testing';
    speedResult.textContent = 'Testing...';
    speedResult.className = 'test-result testing';
    dnsResult.textContent = 'Testing...';
    dnsResult.className = 'test-result testing';

    try {
      // Test 1: Ping test
      progressText.textContent = 'Testing connection latency...';
      progressFill.style.width = '33%';

      const pingTest = await this.performPingTest();
      pingResult.textContent = pingTest.success ? `${pingTest.latency}ms` : 'Failed';
      pingResult.className = `test-result ${pingTest.success ? 'success' : 'error'}`;

      // Test 2: Speed test (simplified)
      progressText.textContent = 'Testing connection speed...';
      progressFill.style.width = '66%';

      const speedTest = await this.performSpeedTest();
      speedResult.textContent = speedTest.success ? `${speedTest.speed} Mbps` : 'Failed';
      speedResult.className = `test-result ${speedTest.success ? 'success' : 'error'}`;

      // Test 3: DNS resolution test
      progressText.textContent = 'Testing DNS resolution...';
      progressFill.style.width = '100%';

      const dnsTest = await this.performDNSTest();
      dnsResult.textContent = dnsTest.success ? `${dnsTest.time}ms` : 'Failed';
      dnsResult.className = `test-result ${dnsTest.success ? 'success' : 'error'}`;

      progressText.textContent = 'Test completed';

    } catch (error) {
      console.error('Connection test failed:', error);
      pingResult.textContent = 'Error';
      pingResult.className = 'test-result error';
      speedResult.textContent = 'Error';
      speedResult.className = 'test-result error';
      dnsResult.textContent = 'Error';
      dnsResult.className = 'test-result error';
    } finally {
      setTimeout(() => {
        progress.classList.remove('active');
        progressFill.style.width = '0%';
        testBtn.disabled = false;
        testBtn.textContent = 'Test Now';
      }, 1000);
    }
  }

  async performPingTest() {
    try {
      const start = Date.now();
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      const latency = Date.now() - start;
      return { success: true, latency };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async performSpeedTest() {
    try {
      // Simple speed test using a small image
      const start = Date.now();
      const response = await fetch('/icon.png', {
        cache: 'no-cache'
      });
      const blob = await response.blob();
      const duration = (Date.now() - start) / 1000;
      const sizeInBits = blob.size * 8;
      const speedMbps = (sizeInBits / duration / 1000000).toFixed(2);

      return { success: true, speed: speedMbps };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async performDNSTest() {
    try {
      const start = Date.now();
      await fetch('https://dns.google/resolve?name=google.com&type=A', {
        method: 'GET',
        cache: 'no-cache'
      });
      const time = Date.now() - start;
      return { success: true, time };
    } catch (error) {
      // Fallback test
      try {
        const start = Date.now();
        await fetch('https://www.google.com', {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        });
        const time = Date.now() - start;
        return { success: true, time };
      } catch (fallbackError) {
        return { success: false, error: error.message };
      }
    }
  }

  addToHistory(type, message) {
    const event = {
      type,
      message,
      timestamp: Date.now(),
      time: new Date().toLocaleString()
    };

    this.connectionHistory.unshift(event);

    // Keep only last 100 events
    if (this.connectionHistory.length > 100) {
      this.connectionHistory = this.connectionHistory.slice(0, 100);
    }

    this.updateHistoryDisplay();
    this.updateStatistics();
  }

  updateHistoryDisplay() {
    const historyContainer = document.getElementById('connection-history');
    const filter = document.getElementById('history-filter').value;

    let filteredHistory = this.connectionHistory;
    if (filter !== 'all') {
      filteredHistory = this.connectionHistory.filter(event => {
        if (filter === 'errors') {
          return event.type === 'error' || event.message.includes('failed');
        }
        return event.type === filter;
      });
    }

    if (filteredHistory.length === 0) {
      historyContainer.innerHTML = '<div class="history-empty"><p>No events match the current filter.</p></div>';
      return;
    }

    const historyHTML = filteredHistory.map(event => `
      <div class="history-item ${event.type}">
        <div class="history-event">${event.message}</div>
        <div class="history-time">${event.time}</div>
      </div>
    `).join('');

    historyContainer.innerHTML = historyHTML;
  }

  updateStatistics() {
    const now = Date.now();
    const sessionTime = now - this.statistics.sessionStartTime;

    // Calculate total online time including current session if online
    let totalOnlineTime = this.statistics.totalOnlineTime;
    if (this.isOnline && this.statistics.currentOnlineStart) {
      totalOnlineTime += now - this.statistics.currentOnlineStart;
    }

    // Calculate total time (online + offline)
    let totalTime = this.statistics.totalOnlineTime + this.statistics.totalOfflineTime;
    if (this.isOnline && this.statistics.currentOnlineStart) {
      totalTime += now - this.statistics.currentOnlineStart;
    } else if (this.statistics.currentOfflineStart) {
      totalTime += now - this.statistics.currentOfflineStart;
    }

    const uptimePercentage = totalTime > 0 ? ((totalOnlineTime / totalTime) * 100).toFixed(1) : 100;

    document.getElementById('uptime-percentage').textContent = `${uptimePercentage}%`;
    document.getElementById('total-disconnections').textContent = this.statistics.totalDisconnections;

    // Average connection time
    const avgConnectionTime = this.statistics.totalConnections > 0
      ? (totalOnlineTime / this.statistics.totalConnections / 1000).toFixed(0)
      : 0;
    document.getElementById('avg-connection-time').textContent = `${avgConnectionTime}s`;

    // Longest offline time
    const longestOffline = (this.statistics.longestOfflineTime / 1000).toFixed(0);
    document.getElementById('longest-offline').textContent = `${longestOffline}s`;
  }

  showNotification(message, type) {
    if (!this.settings.notifications) return;

    const banner = document.getElementById('network-banner');
    const bannerText = document.getElementById('banner-text');
    const bannerIcon = document.getElementById('banner-icon');

    bannerText.textContent = message;
    bannerIcon.textContent = type === 'online' ? '✅' : '⚠️';
    banner.className = `network-banner ${type} show`;

    // Auto-hide online notifications
    if (type === 'online') {
      setTimeout(() => {
        banner.classList.remove('show');
      }, 3000);
    }
  }

  playSound(type) {
    if (!this.settings.sound) return;

    // Create audio context for sound generation
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different events
      if (type === 'online') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  }

  startAutoTest() {
    if (!this.settings.autoTest) return;

    this.stopAutoTest();
    this.autoTestInterval = setInterval(() => {
      this.testConnection();
    }, 30000); // Test every 30 seconds
  }

  stopAutoTest() {
    if (this.autoTestInterval) {
      clearInterval(this.autoTestInterval);
      this.autoTestInterval = null;
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;

    if (tabName === 'statistics') {
      this.updateStatistics();
    }
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear all connection history?')) {
      this.connectionHistory = [];
      this.updateHistoryDisplay();
      this.saveSettings();
    }
  }

  exportLog() {
    const data = {
      history: this.connectionHistory,
      statistics: this.statistics,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings and clear all data?')) {
      localStorage.removeItem('networkMonitorSettings');
      localStorage.removeItem('networkHistory');
      localStorage.removeItem('networkStats');
      location.reload();
    }
  }

  updateUI() {
    this.updateNetworkStatus();
    this.updateHistoryDisplay();
    this.updateStatistics();
  }
}

// Initialize the network status monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.networkMonitor = new NetworkStatusMonitor();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkStatusMonitor;
}
