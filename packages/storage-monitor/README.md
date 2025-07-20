# @kansnpms/console-log-pipe-storage-beta

[![npm version](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-storage-beta.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta)
[![npm downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-storage-beta.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta)
[![npm downloads/month](https://img.shields.io/npm/dm/@kansnpms/console-log-pipe-storage-beta.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Current Version:** `2.3.0` | **Status:** ✅ Production Release

🍪 **Real-time browser storage and cookies monitoring for development and debugging**

## 📦 Package Information

- **Package Name:** `@kansnpms/console-log-pipe-storage-beta`
- **NPM Registry:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-storage-beta
- **Repository:** https://github.com/kgptapps/consolelogpipe
- **License:** MIT
- **Status:** Production - Stable and ready for use

## 🚀 Quick Start

### 1. Install the CLI

```bash
npm install -g @kansnpms/console-log-pipe-cli
```

### 2. Start the Storage Monitor Service

```bash
# Start storage monitoring on port 3002
clp storage --port 3002
```

### 3. Add to Your Web Application

```bash
npm install @kansnpms/console-log-pipe-storage-beta
```

```javascript
import StorageMonitor from '@kansnpms/console-log-pipe-storage-beta';

// Initialize storage monitoring
const monitor = await StorageMonitor.init({
  serverPort: 3002, // Must match CLI port
});

// Your storage changes will now appear in the CLI in real-time!
```

## 📋 Features

- **🍪 Cookie Monitoring**: Real-time tracking of cookie changes (add, modify, delete)
- **💾 localStorage Monitoring**: Automatic detection of localStorage changes
- **🔄 sessionStorage Monitoring**: Live updates for sessionStorage modifications
- **🗃️ IndexedDB Monitoring**: Basic IndexedDB operation tracking (beta)
- **📡 Real-time Updates**: WebSocket-based instant change notifications
- **🎯 AI-Friendly**: Structured data format perfect for AI development tools
- **🔧 Configurable**: Customizable polling intervals and feature toggles

## 🛠️ Usage Examples

### Basic Usage

```javascript
import StorageMonitor from '@kansnpms/console-log-pipe-storage-beta';

// Simple initialization
const monitor = await StorageMonitor.init();

// With custom configuration
const monitor = await StorageMonitor.init({
  serverPort: 3002,
  serverHost: 'localhost',
  enableCookies: true,
  enableLocalStorage: true,
  enableSessionStorage: true,
  enableIndexedDB: false, // Disable IndexedDB monitoring
  pollInterval: 500, // Check for changes every 500ms
});
```

### Advanced Configuration

```javascript
import { ConsoleLogPipeStorage } from '@kansnpms/console-log-pipe-storage-beta';

const storage = new ConsoleLogPipeStorage({
  serverPort: 3002,
  sessionId: 'my-custom-session',
  enableCookies: true,
  enableLocalStorage: true,
  enableSessionStorage: false,
  pollInterval: 1000,
  autoConnect: false, // Manual connection control
});

// Initialize when ready
await storage.init();

// Get current storage state
const currentState = storage.getCurrentState();
console.log('Current storage:', currentState);

// Stop monitoring
storage.stop();
```

### Browser Script Tag Usage

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-storage-beta/dist/storage-monitor.umd.js"></script>
<script>
  // Initialize storage monitoring
  StorageMonitor.init({
    serverPort: 3002,
  }).then(() => {
    console.log('🍪 Storage monitoring started!');
  });
</script>
```

## 🔧 CLI Commands

### Start Storage Monitor

```bash
# Basic usage
clp storage --port 3002

# With custom options
clp storage --port 3002 \
  --poll-interval 500 \
  --no-cookies \
  --no-indexeddb

# Custom session ID
clp storage --port 3002 --session-id "my-debug-session"
```

### CLI Options

| Option                | Description                       | Default        |
| --------------------- | --------------------------------- | -------------- |
| `--port`              | Storage monitor port              | `3002`         |
| `--host`              | Storage monitor host              | `localhost`    |
| `--session-id`        | Custom session ID                 | Auto-generated |
| `--poll-interval`     | Polling interval (ms)             | `1000`         |
| `--no-cookies`        | Disable cookie monitoring         | `false`        |
| `--no-localstorage`   | Disable localStorage monitoring   | `false`        |
| `--no-sessionstorage` | Disable sessionStorage monitoring | `false`        |
| `--no-indexeddb`      | Disable IndexedDB monitoring      | `false`        |

## 📊 Dashboard

Access the web dashboard at `http://localhost:3002` when the storage monitor is running:

- **Real-time Statistics**: Active sessions, tracked items
- **Configuration Info**: Enabled features, polling settings
- **API Documentation**: Available endpoints and WebSocket info
- **Integration Examples**: Copy-paste code snippets

## 🔌 API Reference

### StorageMonitor Class

```javascript
import StorageMonitor from '@kansnpms/console-log-pipe-storage-beta';

// Static methods
await StorageMonitor.init(options); // Initialize and start monitoring
StorageMonitor.create(options); // Create instance without starting

// Instance methods
await monitor.start(); // Start monitoring
monitor.stop(); // Stop monitoring
monitor.getCurrentState(); // Get current storage state
monitor.isMonitoring(); // Check if monitoring is active
monitor.isConnected(); // Check WebSocket connection
monitor.getSession(); // Get session information
monitor.checkNow(); // Force immediate storage check
```

### Configuration Options

```typescript
interface StorageMonitorConfig {
  serverHost?: string; // Default: 'localhost'
  serverPort?: number; // Default: 3002
  sessionId?: string; // Default: auto-generated
  enableCookies?: boolean; // Default: true
  enableLocalStorage?: boolean; // Default: true
  enableSessionStorage?: boolean; // Default: true
  enableIndexedDB?: boolean; // Default: true
  pollInterval?: number; // Default: 1000 (ms)
  autoConnect?: boolean; // Default: true
}
```

## 🎯 AI Development Integration

Perfect for AI-assisted development workflows:

```javascript
// Get structured storage data for AI analysis
const storageState = monitor.getCurrentState();

// Example output format (AI-friendly):
{
  cookies: [
    { name: 'user_id', value: '12345', domain: '.example.com', timestamp: '...' }
  ],
  localStorage: [
    { key: 'theme', value: 'dark', timestamp: '...' }
  ],
  sessionStorage: [
    { key: 'temp_data', value: '{"session": "active"}', timestamp: '...' }
  ]
}
```

## 🔄 Multi-Application Setup

Monitor multiple applications simultaneously:

```bash
# Terminal 1: Main app storage
clp storage --port 3002

# Terminal 2: Admin panel storage
clp storage --port 3003

# Terminal 3: Mobile app storage
clp storage --port 3004
```

```javascript
// App 1
await StorageMonitor.init({ serverPort: 3002 });

// App 2
await StorageMonitor.init({ serverPort: 3003 });

// App 3
await StorageMonitor.init({ serverPort: 3004 });
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check if storage monitor is running
curl http://localhost:3002/api/storage/state

# Verify WebSocket connection
# Browser DevTools → Network → WS tab
```

### Common Issues

1. **Port already in use**: Change port with `--port 3003`
2. **CORS errors**: Storage monitor enables CORS by default
3. **WebSocket connection failed**: Check firewall settings
4. **No storage changes detected**: Verify polling interval and enabled features

## 📝 Changelog

### v0.1.0 (Beta)

- Initial beta release
- Cookie monitoring with real-time change detection
- localStorage and sessionStorage monitoring
- Basic IndexedDB support
- WebSocket-based real-time communication
- CLI integration with Console Log Pipe
- Web dashboard for monitoring

## 🤝 Contributing

This is a beta feature of Console Log Pipe. Feedback and contributions welcome!

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- [`@kansnpms/console-log-pipe-cli`](../cli) - Main CLI tool
- [`@kansnpms/console-log-pipe-client`](../client) - Console logging client
