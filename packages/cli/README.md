# console-log-pipe

Global CLI tool for Console Log Pipe. Start a local server to receive real-time logs from browser
applications.

## Installation

```bash
npm install -g console-log-pipe
```

## Quick Start

```bash
# Start the local server
clp start

# Stream logs in real-time
clp stream

# Manage sessions
clp sessions list
clp sessions create --name "My App"
clp sessions delete <session-id>

# Configuration
clp config set port 3000
clp config get
```

## Commands

### `clp start [options]`

Start the local log server.

Options:

- `--port, -p <port>` - Server port (default: 3000)
- `--host <host>` - Server host (default: localhost)
- `--session-name <name>` - Create named session
- `--open` - Open browser to session URL

### `clp stream [options]`

Stream logs in real-time to the console.

Options:

- `--session <id>` - Stream specific session
- `--filter <pattern>` - Filter logs by pattern
- `--format <format>` - Output format (json, pretty, compact)

### `clp sessions <command>`

Manage logging sessions.

Commands:

- `list` - List all sessions
- `create` - Create new session
- `delete <id>` - Delete session
- `info <id>` - Show session details

### `clp config <command>`

Manage CLI configuration.

Commands:

- `get [key]` - Get configuration value
- `set <key> <value>` - Set configuration value
- `reset` - Reset to defaults

## Configuration

The CLI stores configuration in `~/.console-log-pipe/config.json`:

```json
{
  "port": 3000,
  "host": "localhost",
  "autoStart": true,
  "logLevel": "info",
  "maxSessions": 10,
  "sessionTimeout": 3600000
}
```

## Session Management

Sessions are automatically created when the server starts. Each session has:

- Unique ID for client connection
- Optional human-readable name
- Creation timestamp
- Activity tracking
- Automatic cleanup

## Examples

```bash
# Start server with custom port
clp start --port 8080

# Create named session and start server
clp start --session-name "React App Debug"

# Stream logs with filtering
clp stream --filter "error" --format pretty

# List active sessions
clp sessions list
```

## License

MIT
