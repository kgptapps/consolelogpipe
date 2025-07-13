# @kansnpms/console-log-pipe-client

Browser client library for Console Log Pipe. Captures console logs, errors, and network requests in
real-time and streams them to your development environment.

## Installation

```bash
npm install @kansnpms/console-log-pipe-client
```

Or via CDN:

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
```

## Quick Start

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

// Initialize with session ID from CLI
ConsoleLogPipe.init({
  sessionId: 'your-session-id',
  serverUrl: 'http://localhost:3000', // Optional, auto-discovered by default
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
