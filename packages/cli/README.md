# @kansnpms/console-log-pipe-cli

[![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-cli.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Global CLI tool for Console Log Pipe - Real-time log streaming from browsers to developers.

## 🚀 Quick Start

### 1. Install globally

```bash
npm install -g @kansnpms/console-log-pipe-cli
```

### 2. Start monitoring

```bash
# Start server (port is required)
# Monitoring happens automatically - logs appear in real-time
clp start --port 3001

# Stop with Ctrl+C when done
```

### 3. Add to your web application

```bash
npm install @kansnpms/console-log-pipe-client
```

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  port: 3001, // Required: Must match CLI server port
});
```

> **⚠️ Critical Dependency**: CLI and Client are **mutually dependent**:
>
> - **CLI depends on Client**: This CLI server is useless without the client library in your web app
> - **Client depends on CLI**: The client library requires this CLI server to be running
> - CLI server requires `--port` parameter (mandatory)
> - Client library requires `port` parameter (mandatory)
> - Port must match exactly: `clp start --port 3001`
> - **Neither package works without the other**

## 📋 Commands

### `clp start --port <port>`

Start Console Log Pipe server. **Port number is required.** **Monitoring happens automatically** -
logs appear in real-time in your terminal.

```bash
# Basic usage
clp start --port 3001
clp start --port 3016
clp start --port 3002

# With additional options
clp start --port 3001 --log-level warn --developer "John"
clp start --port 3001 --env production --branch "feature/auth"
clp start --port 3001 --max-logs 500 --host localhost

# Stop with Ctrl+C when done
```

**Options:**

- `--port, -p <port>` - Server port (required, must be between 1024-65535)
- `--host <host>` - Server host (default: localhost)
- `--env <environment>` - Environment (development, staging, production) (default: development)
- `--log-level <level>` - Minimum log level (debug, info, warn, error) (default: debug)
- `--max-logs <number>` - Maximum logs to store (default: 1000)
- `--developer <name>` - Developer name for identification
- `--branch <name>` - Git branch name for context
- `--session-id <id>` - Custom session ID (auto-generated if not provided)
- `--no-browser` - Do not open browser automatically
- `--enable-compression` - Enable gzip compression (default: true)
- `--enable-cors` - Enable CORS (default: true)

## 🎯 Real-World Examples

### Basic Usage

```bash
# 1. Start monitoring (port is required)
clp start --port 3001

# 2. Add client to your React app
npm install @kansnpms/console-log-pipe-client

# 3. Initialize in your app
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';
ConsoleLogPipe.init({ port: 3001 });

# 4. Logs appear automatically in real-time
# Stop with Ctrl+C when done
```

### Multi-Application Development

```bash
# Start multiple servers (each in separate terminal)
clp start --port 3001
clp start --port 3002
clp start --port 3003

# Each terminal shows logs automatically
# Stop each with Ctrl+C when done
```

## 🔧 Configuration

The CLI automatically manages configuration and stores data in:

- **Config**: `~/.console-log-pipe/config.json`
- **Logs**: `~/.console-log-pipe/logs/`
- **Sessions**: `~/.console-log-pipe/sessions/`

## 🌐 Integration

### React

```bash
# Start CLI server first
clp start --port 3001
```

```javascript
import { useEffect } from 'react';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

function App() {
  useEffect(() => {
    ConsoleLogPipe.init({ port: 3001 });
  }, []);

  return <div>My App</div>;
}
```

### Vue.js

```bash
# Start CLI server first
clp start --port 3016
```

```javascript
import { createApp } from 'vue';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

const app = createApp({});
ConsoleLogPipe.init({ port: 3016 });
```

### Vanilla JavaScript

```bash
# Start CLI server first
clp start --port 3002
```

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
<script>
  ConsoleLogPipe.init({ port: 3002 });
</script>
```

## 📚 More Information

- **Main Repository**: [Console Log Pipe](https://github.com/kgptapps/consolelogpipe)
- **Client Library**:
  [@kansnpms/console-log-pipe-client](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
- **Documentation**: [Full Documentation](https://github.com/kgptapps/consolelogpipe#readme)

## 📄 License

MIT
