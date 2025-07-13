# @kansnpms/console-log-pipe-client

[![npm version](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client.svg)](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe)

**Bring browser console logs to your IDE with Console Log Pipe.** Stream console logs, errors, and
network requests from any browser application directly to your development environment.

🚀 **AI-Friendly Web Console Integration for Faster Development** - Monitor multiple applications
simultaneously with intelligent error categorization and structured metadata that AI tools can
easily parse and understand.

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
npm install -g console-log-pipe

# Start server for your application
clp start --app my-web-app

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
  applicationName: 'my-web-app', // Required: Must match CLI --app parameter
  // sessionId is auto-generated, or use custom one from CLI output
});
```

### Step 3: Monitor Logs in Your IDE

All browser console logs, errors, and network requests will now stream directly to your CLI terminal
and development environment!

## 🤖 AI-Friendly Development Workflow

Console Log Pipe transforms your development experience by bringing browser console logs directly to
your IDE with AI-optimized features:

### **🎯 Faster Debugging with AI Tools**

- **Structured Error Categories** - Logs are automatically categorized (Network, Validation,
  Runtime, etc.) for AI parsing
- **Rich Metadata** - Environment context, stack traces, and performance data included
- **Session Isolation** - Each application gets its own log stream for focused debugging

### **⚡ Reduced Context Switching**

- **IDE Integration** - No more switching between browser DevTools and your editor
- **Multi-App Monitoring** - Track logs from multiple applications simultaneously
- **Real-time Streaming** - See logs instantly as they happen in the browser

## 🤖 AI Coding Assistant Integration

Console Log Pipe is designed to work seamlessly with AI coding tools. Here's a sample prompt to get
the most out of your AI assistant:

### **Sample AI Prompt:**

```
I'm using Console Log Pipe to stream browser console logs directly to my IDE.
I have the following error logs from my React application:

[ERROR] TypeError: Cannot read property 'map' of undefined
  at UserList.jsx:15:23
  Application: ecommerce-frontend
  Environment: development
  Session: clp_abc123_xyz789
  Category: Runtime Error
  Stack: UserList.jsx -> App.jsx -> index.js

[NETWORK] Failed to fetch /api/users - 404 Not Found
  Application: ecommerce-frontend
  Environment: development
  Response: {"error": "Users endpoint not found"}

Please help me:
1. Identify the root cause of both issues
2. Suggest fixes for the undefined array issue
3. Explain why the API endpoint is returning 404
4. Provide code examples for the fixes
5. Recommend best practices to prevent similar issues

Context: This is a React e-commerce app with a Node.js backend.
```

### **Why This Works:**

- **Structured Error Data** - AI can easily parse categorized errors
- **Rich Context** - Application name, environment, and session info
- **Stack Traces** - Clear error location and call chain
- **Network Details** - Complete request/response information
- **Specific Questions** - Focused requests for actionable solutions

### **Quick Start Prompt for AI Coding Assistants:**

```
Use https://www.npmjs.com/package/@kansnpms/console-log-pipe-client package to integrate browser console logs to the CLI console. Replace 'my-web-app' with my project name as mentioned in the documentation.
```

Copy this prompt to quickly get AI assistance with Console Log Pipe integration!

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
