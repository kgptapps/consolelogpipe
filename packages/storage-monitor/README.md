# @kansnpms/storage-pipe

[![npm version](https://img.shields.io/npm/v/@kansnpms/storage-pipe.svg)](https://www.npmjs.com/package/@kansnpms/storage-pipe)
[![npm downloads](https://img.shields.io/npm/dt/@kansnpms/storage-pipe.svg)](https://www.npmjs.com/package/@kansnpms/storage-pipe)
[![CI](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/ci.yml)
[![Code Quality](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml/badge.svg)](https://github.com/kgptapps/consolelogpipe/actions/workflows/code-quality.yml)
[![license: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![Storage Pipe](https://raw.githubusercontent.com/kgptapps/consolelogpipe/main/images/KansBrowserMirrorAgents.png)

> **AI‑Friendly storage monitoring client** – track real‑time changes to cookies, `localStorage`,
> `sessionStorage`, and IndexedDB from your web applications directly to your **Console Log Pipe
> CLI**. Perfect for **AI coding assistants** debugging storage‑related issues.

---

## ✨ Highlights

| Feature                          | Description                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------ |
| **Real‑time storage monitoring** | Track cookies, localStorage, sessionStorage, IndexedDB changes as they happen. |
| **WebSocket streaming**          | <10 ms latency from browser storage changes to CLI terminal.                   |
| **AI‑optimised JSON format**     | Storage changes formatted as structured JSON for effortless AI parsing.        |
| **Multi‑storage support**        | Monitor all browser storage APIs in one unified interface.                     |
| **Session isolation**            | Each browser tab/app gets unique sessionId for organized storage debugging.    |
| **Configurable monitoring**      | Enable/disable specific storage types and adjust polling intervals.            |

---

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
npm install @kansnpms/storage-pipe
```

```javascript
import StorageMonitor from '@kansnpms/storage-pipe';

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
- **🗃️ IndexedDB Monitoring**: Basic IndexedDB operation tracking
- **📡 Real-time Updates**: WebSocket-based instant change notifications
- **🎯 AI-Friendly**: Structured data format perfect for AI development tools
- **🔧 Configurable**: Customizable polling intervals and feature toggles

## 🛠️ Usage Examples

### Basic Usage

```javascript
import StorageMonitor from '@kansnpms/storage-pipe';

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
import { ConsoleLogPipeStorage } from '@kansnpms/storage-pipe';

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
<script src="https://unpkg.com/@kansnpms/storage-pipe/dist/storage-monitor.umd.js"></script>
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
import StorageMonitor from '@kansnpms/storage-pipe';

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

### v2.3.7

- Production release
- Cookie monitoring with real-time change detection
- localStorage and sessionStorage monitoring
- Basic IndexedDB support
- WebSocket-based real-time communication
- CLI integration with Console Log Pipe
- Web dashboard for monitoring

## 🤝 Contributing

This is a production feature of Console Log Pipe. Feedback and contributions welcome!

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Related Packages

- [`@kansnpms/console-log-pipe-cli`](../cli) - Main CLI tool
- [`@kansnpms/console-log-pipe-client`](../client) - Console logging client
