# @kansnpms/console-log-pipe-client

[![npm version](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client.svg)](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe)

**Bring browser console logs to your IDE with Console Log Pipe.** Stream console logs, errors, and
network requests from any browser application directly to your development environment.

🚀 **AI-Friendly Web Console Integration for Faster Development** - Monitor multiple applications
simultaneously with intelligent error categorization and structured metadata that AI tools can
easily parse and understand.

## 🤖 Quick Start Prompt for AI Coding Assistants

```
Use https://www.npmjs.com/package/@kansnpms/console-log-pipe-client package to integrate browser console logs to the CLI console. Replace 'my-web-app' with my project name as mentioned in the documentation.
```

Copy this prompt to quickly get AI assistance with Console Log Pipe integration!

## ✨ Key Features

- **🤖 AI-Friendly Development** - Structured error categorization and metadata optimized for AI
  tools and faster debugging
- **🔄 Multi-Application Support** - Monitor multiple applications simultaneously with isolated
  sessions
- **🚀 IDE Integration** - Stream browser console logs directly to your development environment
- **🌍 Environment Detection** - Automatic detection of development, staging, and production
  environments
- **📊 Session Management** - Unique session IDs with beautiful console logging and tracking
- **🔍 Smart Filtering** - Filter logs by level, patterns, and application-specific criteria
- **⚡ Real-time Streaming** - Instant log delivery with WebSocket connections
- **🎯 Developer Productivity** - Reduce context switching between browser and IDE

## 📦 Installation

### NPM Package (Recommended)

**📦 [View on NPM](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)**

```bash
npm install @kansnpms/console-log-pipe-client
```

### CDN

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
```

## 🚀 Quick Start

### Step 1: Start the CLI Server

First, install and start the Console Log Pipe CLI server:

```bash
# Install CLI globally
npm install -g @kansnpms/console-log-pipe-cli

# Start server for your application (port is required)
clp start my-web-app --port 3001

# The CLI will display:
# 🔍 Console Log Pipe Server Started
# 📱 Application: my-web-app
# 🆔 Session ID: clp_abc123_xyz789
# 🌐 Server Port: 3001
# 🔗 Ready to receive logs...
```

### Step 2: Add to Your Web Application

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  applicationName: 'my-web-app', // Required: Must match CLI app name from "clp start my-web-app --port 3001"
  // sessionId is auto-generated, or use custom one from CLI output
});
```

> **⚠️ Important**: The CLI server requires a `--port` parameter. Make sure to start the CLI with:
> `clp start my-web-app --port 3001`

### Step 3: Monitor Logs in Your IDE

All browser console logs, errors, and network requests will now stream directly to your CLI terminal
and development environment!

## Features

- ✅ Console log interception (log, error, warn, info, debug)
- ✅ Unhandled error capture
- ✅ Network request/response monitoring
- ✅ Automatic metadata collection
- ✅ Circular reference handling
- ✅ Configurable filtering
- ✅ Minimal performance impact

## ⚙️ Configuration

```javascript
ConsoleLogPipe.init({
  applicationName: 'my-web-app', // Required: Application identifier
  sessionId: 'custom-session-id', // Optional: Auto-generated if not provided
  environment: 'development', // Optional: Auto-detected (development/staging/production)
  developer: 'john-doe', // Optional: Developer identifier for AI context
  branch: 'feature/new-feature', // Optional: Git branch for AI context

  // AI-Friendly Features
  enableMetadata: true, // Include rich metadata for AI parsing
  enableNetworkCapture: true, // Capture network requests/responses

  // Filtering Options
  logLevels: ['log', 'error', 'warn'], // Filter by log levels
  excludePatterns: ['/health', '/ping'], // Exclude URLs matching patterns
  includePatterns: ['important'], // Only include logs matching patterns

  // Performance Options
  maxLogSize: 10000, // Max size per log entry
  maxQueueSize: 1000, // Max logs in memory
});
```

## API Reference

### ConsoleLogPipe.init(options)

Initialize the log pipe with configuration options.

### ConsoleLogPipe.destroy()

Clean up and stop log capture.

### ConsoleLogPipe.setSessionId(sessionId)

Update the session ID for log streaming.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT
