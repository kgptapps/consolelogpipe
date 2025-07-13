# @kansnpms/console-log-pipe-client

[![npm version](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client.svg)](https://badge.fury.io/js/@kansnpms%2Fconsole-log-pipe-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://img.shields.io/badge/coverage-96.77%25-brightgreen.svg)](https://github.com/kgptapps/consolelogpipe)

Browser client library for Console Log Pipe with **multi-application support**. Captures console
logs, errors, and network requests in real-time and streams them to your development environment
with AI-friendly features.

## ✨ Key Features

- **🔄 Multi-Application Support** - Monitor multiple applications simultaneously with isolated
  sessions
- **🎯 AI-Friendly Development** - Structured error categorization and metadata for AI tools
- **🌍 Environment Detection** - Automatic detection of development, staging, and production
  environments
- **📊 Session Management** - Unique session IDs with beautiful console logging
- **🔍 Smart Filtering** - Filter logs by level, patterns, and application-specific criteria
- **⚡ Real-time Streaming** - Instant log delivery with WebSocket connections

## 📦 Installation

### NPM Package (Recommended)

```bash
npm install @kansnpms/console-log-pipe-client
```

### CDN

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
```

## 🚀 Quick Start

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  applicationName: 'my-web-app', // Required: Must match CLI --app parameter
  // sessionId is auto-generated, or use custom one from CLI output
});
```

## Features

- ✅ Console log interception (log, error, warn, info, debug)
- ✅ Unhandled error capture
- ✅ Network request/response monitoring
- ✅ Automatic metadata collection
- ✅ Circular reference handling
- ✅ Configurable filtering
- ✅ Minimal performance impact

## Configuration

```javascript
ConsoleLogPipe.init({
  sessionId: 'required-session-id',
  serverUrl: 'http://localhost:3000',
  enableNetworkCapture: true,
  enableErrorCapture: true,
  batchSize: 10,
  batchInterval: 1000,
  filters: {
    excludeUrls: ['/health', '/metrics'],
    excludeHeaders: ['authorization', 'cookie'],
  },
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
