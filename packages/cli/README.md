# @kansnpms/console-log-pipe-cli

[![npm version](https://img.shields.io/npm/v/@kansnpms/console-log-pipe-cli.svg)](https://www.npmjs.com/package/@kansnpms/console-log-pipe-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Global CLI tool for Console Log Pipe - Real-time log streaming from browsers to developers.

## 🚀 Quick Start

### 1. Install globally

```bash
npm install -g @kansnpms/console-log-pipe-cli
```

### 2. Start monitoring your app

```bash
# Start server for your application (port is required)
clp start my-web-app --port 3001

# Monitor real-time logs
clp monitor my-web-app
```

### 3. Add to your web application

```bash
npm install @kansnpms/console-log-pipe-client
```

```javascript
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

ConsoleLogPipe.init({
  applicationName: 'my-web-app', // Must match CLI app name
});
```

## 📋 Commands

### `clp start [app-name] --port <port>`

Start Console Log Pipe server for an application. **Port number is required.**

```bash
clp start my-react-app --port 3001
clp start my-vue-app --port 3016
clp start "My Project" --port 3002
```

**Options:**

- `--port, -p <port>` - Server port (required, must be between 1024-65535)
- `--host <host>` - Server host (default: localhost)
- `--app-name <name>` - Application name (alternative to argument)
- `--env <environment>` - Environment (development, staging, production)
- `--log-level <level>` - Minimum log level (debug, info, warn, error)
- `--max-logs <number>` - Maximum logs to store (default: 1000)

### `clp monitor <app-name>`

Monitor logs from a running application in real-time.

```bash
clp monitor my-react-app
clp monitor my-vue-app --filter "error"
clp monitor my-app --since "1h" --tail 100
```

**Options:**

- `--follow, -f` - Follow log output in real-time (default: true)
- `--filter <pattern>` - Filter logs by pattern
- `--level <level>` - Filter by log level (debug, info, warn, error)
- `--since <time>` - Show logs since time (e.g., "1h", "30m", "2023-01-01")
- `--tail <number>` - Number of recent logs to show (default: 50)
- `--format <format>` - Output format (json, text, table) (default: text)

### `clp list`

List all running Console Log Pipe servers.

```bash
clp list
clp list --format json
clp list --show-inactive
```

**Options:**

- `--format <format>` - Output format (json, text, table) (default: table)
- `--show-inactive` - Show inactive servers

### `clp stop [app-name]`

Stop Console Log Pipe server for an application.

```bash
clp stop my-react-app
clp stop --all
clp stop --force
```

**Options:**

- `--force` - Force stop without confirmation
- `--all` - Stop all running servers

### `clp status [app-name]`

Show status of Console Log Pipe servers.

```bash
clp status
clp status my-react-app
clp status --detailed
```

**Options:**

- `--detailed` - Show detailed status information
- `--format <format>` - Output format (json, text, table) (default: text)

## 🎯 Real-World Examples

### Basic Usage

```bash
# 1. Start monitoring your React app
clp start my-react-app --port 3001

# 2. Add client to your React app
npm install @kansnpms/console-log-pipe-client

# 3. Initialize in your app
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';
ConsoleLogPipe.init({ applicationName: 'my-react-app' });

# 4. Monitor logs in real-time
clp monitor my-react-app
```

### Multi-Application Development

```bash
# Start multiple apps
clp start frontend --port 3001
clp start backend --port 3002
clp start mobile-app --port 3003

# Monitor specific app
clp monitor frontend --filter "error"
clp monitor backend --level warn

# List all running servers
clp list

# Stop specific app
clp stop frontend
```

### Advanced Monitoring

```bash
# Monitor with filtering
clp monitor my-app --filter "API" --since "30m"

# Monitor errors only from last hour
clp monitor my-app --level error --since "1h" --tail 200

# Export logs as JSON
clp monitor my-app --format json > logs.json
```

## 🔧 Configuration

The CLI automatically manages configuration and stores data in:

- **Config**: `~/.console-log-pipe/config.json`
- **Logs**: `~/.console-log-pipe/logs/`
- **Sessions**: `~/.console-log-pipe/sessions/`

## 🌐 Integration

### React

```javascript
import { useEffect } from 'react';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

function App() {
  useEffect(() => {
    ConsoleLogPipe.init({ applicationName: 'my-react-app' });
  }, []);

  return <div>My App</div>;
}
```

### Vue.js

```javascript
import { createApp } from 'vue';
import ConsoleLogPipe from '@kansnpms/console-log-pipe-client';

const app = createApp({});
ConsoleLogPipe.init({ applicationName: 'my-vue-app' });
```

### Vanilla JavaScript

```html
<script src="https://unpkg.com/@kansnpms/console-log-pipe-client"></script>
<script>
  ConsoleLogPipe.init({ applicationName: 'my-web-app' });
</script>
```

## 🤖 AI-Friendly Output

Console Log Pipe formats logs specifically for AI coding assistants:

```
[ERROR] TypeError: Cannot read property 'map' of undefined
  at UserList.jsx:15:23
  Application: ecommerce-frontend
  Environment: development
  Session: clp_abc123_xyz789
  Category: Runtime Error
  Stack: UserList.jsx -> App.jsx -> index.js

[NETWORK] Failed to fetch /api/users - 404 Not Found
  Application: ecommerce-frontend
  Response: {"error": "Users endpoint not found"}
```

## 📚 More Information

- **Main Repository**: [Console Log Pipe](https://github.com/kgptapps/consolelogpipe)
- **Client Library**:
  [@kansnpms/console-log-pipe-client](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
- **Documentation**: [Full Documentation](https://github.com/kgptapps/consolelogpipe#readme)

## 📄 License

MIT
