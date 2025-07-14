# Network Status Monitor Tool

A comprehensive network connection monitoring tool that provides real-time feedback about your internet connectivity status with visual indicators, connection quality metrics, and historical data tracking.

## Features

### 🌐 Real-time Monitoring
- Continuously monitors your connection status using browser APIs
- Instant feedback when network state changes
- Visual indicators with color-coded status (online/offline/checking)

### 📊 Connection Metrics
- Connection type detection (WiFi, cellular, ethernet, etc.)
- Effective connection type (4g, 3g, 2g, slow-2g)
- Downlink speed estimation
- Round-trip time (RTT) measurement
- Last updated timestamp

### 🔔 Smart Notifications
- Customizable visual notifications via top banner
- Audio alerts with different tones for online/offline events
- Auto-hide online notifications after 3 seconds
- Persistent offline notifications

### 🧪 Connection Testing
- Manual connection testing with progress indicator
- Ping test for latency measurement
- Speed test using resource download
- DNS resolution testing
- Automatic testing every 30 seconds (configurable)

### 📈 Historical Data & Statistics
- Connection event history with timestamps
- Filterable history (all events, online only, offline only, errors)
- Statistics dashboard showing:
  - Uptime percentage
  - Total disconnections
  - Average connection time
  - Longest offline period
- Data export functionality (JSON format)

### ⚙️ Customizable Settings
- Toggle notifications on/off
- Enable/disable sound alerts
- Auto-test connection interval control
- Settings persistence using localStorage
- Reset functionality

## Implementation Guide

### Basic Network Status Detection

The foundation of network monitoring uses the browser's built-in `navigator.onLine` property and network events:

```javascript
// Check current online status
if (navigator.onLine) {
  console.log('Online');
} else {
  console.log('Offline');
}

// Listen for network status changes
window.addEventListener('online', () => {
  console.log('Connection restored');
  // Handle online state
});

window.addEventListener('offline', () => {
  console.log('Connection lost');
  // Handle offline state
});
```

### Advanced Connection Information

For more detailed connection information, use the Network Information API (limited browser support):

```javascript
// Get connection information (if supported)
if ('connection' in navigator) {
  const connection = navigator.connection;
  
  console.log('Connection type:', connection.type);
  console.log('Effective type:', connection.effectiveType);
  console.log('Downlink:', connection.downlink, 'Mbps');
  console.log('RTT:', connection.rtt, 'ms');
  
  // Listen for connection changes
  connection.addEventListener('change', () => {
    console.log('Connection changed');
    updateConnectionInfo();
  });
}
```

### Connection Testing

Implement active connection testing by making network requests:

```javascript
// Test connection with a ping
async function testConnection() {
  try {
    const start = Date.now();
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    const latency = Date.now() - start;
    
    if (response.ok) {
      console.log('Connection OK, latency:', latency, 'ms');
      return { status: 'online', latency };
    }
  } catch (error) {
    console.log('Connection failed:', error);
    return { status: 'offline', error };
  }
}

// Speed test using resource download
async function performSpeedTest() {
  try {
    const start = Date.now();
    const response = await fetch('/test-image.png', {
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
```

### Visual Notifications

Create a notification system with visual feedback:

```javascript
function showNotification(message, type) {
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
```

### Audio Alerts

Generate audio feedback using Web Audio API:

```javascript
function playSound(type) {
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
```

### Data Persistence

Store settings and history using localStorage:

```javascript
// Save data
function saveSettings() {
  localStorage.setItem('networkMonitorSettings', JSON.stringify(settings));
  localStorage.setItem('networkHistory', JSON.stringify(connectionHistory));
  localStorage.setItem('networkStats', JSON.stringify(statistics));
}

// Load data
function loadSettings() {
  const saved = localStorage.getItem('networkMonitorSettings');
  if (saved) {
    settings = { ...settings, ...JSON.parse(saved) };
  }
  
  const history = localStorage.getItem('networkHistory');
  if (history) {
    connectionHistory = JSON.parse(history);
  }
}
```

### Complete Implementation Class

Here's a simplified version of the main monitoring class:

```javascript
class NetworkStatusMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionHistory = [];
    this.settings = {
      notifications: true,
      sound: true,
      autoTest: true
    };
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.startAutoTest();
  }

  setupEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateConnectionInfo();
      });
    }
  }

  handleOnline() {
    this.isOnline = true;
    this.addToHistory('online', 'Connection restored');
    this.updateNetworkStatus();
    this.showNotification('✅ You are back online', 'online');
    this.playSound('online');
  }

  handleOffline() {
    this.isOnline = false;
    this.addToHistory('offline', 'Connection lost');
    this.updateNetworkStatus();
    this.showNotification('⚠️ You are currently offline', 'offline');
    this.playSound('offline');
  }

  updateNetworkStatus() {
    // Update UI elements based on current status
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (this.isOnline) {
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Online';
    } else {
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Offline';
    }
    
    this.updateConnectionInfo();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.networkMonitor = new NetworkStatusMonitor();
});
```

## Use Cases

### Web Applications
- **Sync Operations**: Pause data synchronization when offline, resume when online
- **Form Handling**: Prevent form submissions when offline to avoid data loss
- **Cache Management**: Switch to cached content when offline

### Progressive Web Apps (PWAs)
- **Offline Indicators**: Show clear offline status to users
- **Service Worker Integration**: Coordinate with service workers for offline functionality
- **Background Sync**: Queue operations for when connection is restored

### Real-time Applications
- **Chat Applications**: Handle connection drops gracefully, show reconnection status
- **Collaboration Tools**: Pause real-time updates when offline
- **Live Data Feeds**: Switch to cached data or show connection status

### Media Streaming
- **Quality Adjustment**: Reduce quality when connection is poor
- **Buffer Management**: Increase buffering when connection is unstable
- **Fallback Content**: Switch to lower quality or cached content

### E-commerce
- **Transaction Safety**: Prevent checkout when offline
- **Inventory Updates**: Pause real-time inventory updates
- **User Notifications**: Inform users about connection issues during purchase

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `navigator.onLine` | ✅ | ✅ | ✅ | ✅ |
| `online`/`offline` events | ✅ | ✅ | ✅ | ✅ |
| Network Information API | ✅ | ❌ | ❌ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |

### Notes on Browser Support

- **Basic functionality** (`navigator.onLine` and events) works in all modern browsers
- **Network Information API** has limited support, mainly in Chromium-based browsers
- **Connection quality metrics** may not be available in all browsers
- **Fallback handling** is implemented for unsupported features

## Installation & Setup

1. **Copy the files** to your project:
   ```
   tools/network-status/
   ├── index.html
   ├── network-status.css
   ├── network-status.js
   └── README.md
   ```

2. **Include the CSS and JS** in your HTML:
   ```html
   <link rel="stylesheet" href="./network-status.css">
   <script src="./network-status.js"></script>
   ```

3. **Add the HTML structure** for the status display and controls

4. **Initialize the monitor**:
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     window.networkMonitor = new NetworkStatusMonitor();
   });
   ```

## Customization

### Styling
- Modify CSS variables for colors and spacing
- Customize notification banner appearance
- Adjust responsive breakpoints

### Functionality
- Change auto-test intervals
- Modify notification duration
- Add custom connection tests
- Extend statistics tracking

### Integration
- Connect to analytics services
- Integrate with service workers
- Add custom event handlers
- Extend data export formats

## Security Considerations

- **CORS**: Some connection tests may be blocked by CORS policies
- **Privacy**: Network information may be considered sensitive
- **Permissions**: Audio alerts may require user interaction first
- **Storage**: localStorage data persists across sessions

## Performance

- **Minimal overhead**: Uses passive event listeners
- **Efficient testing**: Lightweight connection tests
- **Data management**: Automatic cleanup of old history entries
- **Memory usage**: Bounded data structures prevent memory leaks

## Contributing

Feel free to contribute improvements:
- Enhanced connection testing methods
- Additional browser compatibility
- New notification types
- Extended statistics
- Performance optimizations

## License

This tool is part of the DevTools Hub project and is free to use and modify.
