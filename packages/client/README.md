# @kansnpms/console-log-pipe-client

[![npm version](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client.svg)](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client)
[![npm downloads](https://img.shields.io/npm/dt/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
[![npm downloads/month](https://img.shields.io/npm/dm/@kansnpms/console-log-pipe-client.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe)

**Current Version:** `2.3.0-beta.3` | **Status:** ✅ Ready for Production

**Bring browser console logs to your IDE with Console Log Pipe.** Stream console logs, errors, and
network requests from any browser application directly to your development environment.

## 📦 Package Information

- **Package Name:** `@kansnpms/console-log-pipe-client`
- **NPM Registry:** https://www.npmjs.com/package/@kansnpms/console-log-pipe-client
- **Repository:** https://github.com/kgptapps/consolelogpipe
- **License:** MIT

🚀 **AI-Friendly Web Console Integration for Faster Development** - Monitor multiple applications
simultaneously with intelligent error categorization and structured metadata that AI tools can
easily parse and understand.

## 🤖 Quick Start Prompt for AI Coding Assistants

```
Use https://www.npmjs.com/package/@kansnpms/console-log-pipe-client package to integrate browser console logs to the CLI console. Only the port parameter is required.
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

**Current Version: 2.3.0-beta.3**

```bash
# Install latest beta version (recommended)
npm install @kansnpms/console-log-pipe-client@beta

# Or install specific version
npm install @kansnpms/console-log-pipe-client@2.3.0-beta.3
```

**📦 [View on NPM](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)**

### CDN (Alternative)

```html
<!-- Latest beta version -->
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client@beta"></script>

<!-- Specific version -->
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client@2.3.0-beta.3"></script>
```

### Required CLI Server

This client library requires the CLI server to be running:

```bash
# Install CLI globally
npm install -g @kansnpms/console-log-pipe-cli@beta

# Start server
clp start --port 3001
```

**📦 [CLI Package](https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli)**

## 🚀 Quick Start

### Step 1: Start the CLI Server

First, install and start the Console Log Pipe CLI server:

```bash
# Install CLI globally
npm install -g @kansnpms/console-log-pipe-cli

# Start server (port is required)
clp start --port 3001

# The CLI will display:
# 🚀 Console Log Pipe Server Started
# 🌐 Port: 3001
# 🆔 Session ID: clp_abc123_xyz789
# 🔗 Ready to receive logs...
```

### Step 2: Add to Your Web Application

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  port: 3001, // Required: Must match CLI server port
  // sessionId is auto-generated, or use custom one from CLI output
});
```

> **⚠️ Critical Dependency**: Client and CLI are **mutually dependent**:
>
> - **Client depends on CLI**: This client library requires the CLI server to be running
> - **CLI depends on Client**: The CLI server is useless without this client library in your web app
> - You must install and run: `npm install -g @kansnpms/console-log-pipe-cli`
> - CLI server must be started first: `clp start --port 3001`
> - Client `port` must match CLI exactly
> - **Neither package works without the other**

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
  port: 3001, // Required: CLI server port
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

**Required Parameters:**

- `port` (number) - Must match CLI server port

**Optional Parameters:**

- `sessionId` (string) - Custom session ID (auto-generated if not provided)
- `environment` (string) - Environment context (auto-detected if not provided)
- `developer` (string) - Developer identifier for AI context
- `branch` (string) - Git branch for AI context
- `enableMetadata` (boolean) - Include rich metadata for AI parsing (default: true)
- `enableNetworkCapture` (boolean) - Capture network requests/responses (default: true)
- `logLevels` (array) - Filter by log levels (default: ['log', 'error', 'warn', 'info', 'debug'])
- `excludePatterns` (array) - Exclude URLs matching patterns
- `includePatterns` (array) - Only include logs matching patterns
- `maxLogSize` (number) - Max size per log entry (default: 10000)
- `maxQueueSize` (number) - Max logs in memory (default: 1000)

### ConsoleLogPipe.destroy()

Clean up and stop log capture. This method stops all logging, closes WebSocket connections, and
cleans up resources.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT
