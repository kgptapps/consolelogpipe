/**
 * StorageCommand - CLI command for starting storage monitoring service
 *
 * Provides real-time monitoring of browser storage:
 * - Cookies
 * - localStorage
 * - sessionStorage
 * - IndexedDB
 */

const chalk = require('chalk');
const WebSocket = require('ws');
const ServerManager = require('../server/ServerManager');
const ConfigManager = require('../utils/ConfigManager');
const PortManager = require('../utils/PortManager');

class StorageCommand {
  static command = 'storage';
  static description =
    'Start storage monitoring service for cookies, localStorage, sessionStorage, and IndexedDB';

  static options = [
    {
      flags: '-p, --port <port>',
      description: 'Port for storage monitoring service (default: 3002)',
      defaultValue: 3002,
    },
    {
      flags: '-h, --host <host>',
      description: 'Host for storage monitoring service',
      defaultValue: 'localhost',
    },
    {
      flags: '--session-id <sessionId>',
      description: 'Custom session ID for storage monitoring',
    },
    {
      flags: '--poll-interval <ms>',
      description: 'Polling interval for storage changes in milliseconds',
      defaultValue: 1000,
    },
    {
      flags: '--no-cookies',
      description: 'Disable cookie monitoring',
    },
    {
      flags: '--no-localstorage',
      description: 'Disable localStorage monitoring',
    },
    {
      flags: '--no-sessionstorage',
      description: 'Disable sessionStorage monitoring',
    },
    {
      flags: '--no-indexeddb',
      description: 'Disable IndexedDB monitoring',
    },
  ];

  /**
   * Execute storage monitoring command
   */
  static async execute(options) {
    try {
      console.log(chalk.cyan('🍪 Console Log Pipe - Storage Monitor'));
      console.log(chalk.gray('━'.repeat(50)));

      // Validate and prepare configuration
      const config = await StorageCommand._prepareConfig(options);

      // Check if port is available
      if (await ServerManager.isServerRunning(config.host, config.port)) {
        throw new Error(`Port ${config.port} is already in use`);
      }

      // Start storage monitoring server
      console.log(chalk.blue('🚀 Starting Storage Monitor Server...'));
      const serverInstance = await StorageCommand._startStorageServer(config);

      // Display server information
      StorageCommand._displayServerInfo(config);

      // Start monitoring for client connections
      StorageCommand._startConnectionMonitoring(config.port, serverInstance);

      // Handle graceful shutdown
      StorageCommand._setupGracefulShutdown(config.port);
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to start storage monitor:'),
        error.message
      );
      process.exit(1);
    }
  }

  /**
   * Prepare configuration for storage monitoring
   */
  static async _prepareConfig(options) {
    const port = parseInt(options.port, 10);

    // Validate port
    if (!PortManager.isValidPort(port)) {
      throw new Error(
        `Invalid port: ${port}. Port must be between 1024 and 65535.`
      );
    }

    // Generate session ID if not provided
    const sessionId = options.sessionId || StorageCommand._generateSessionId();

    const config = {
      port,
      host: options.host,
      sessionId,
      pollInterval: parseInt(options.pollInterval, 10),
      enableCookies: !options.noCookies,
      enableLocalStorage: !options.noLocalstorage,
      enableSessionStorage: !options.noSessionstorage,
      enableIndexedDB: !options.noIndexeddb,
      type: 'storage-monitor',
      startTime: new Date().toISOString(),
    };

    // Save configuration
    await ConfigManager.saveServerConfig(port, config);

    return config;
  }

  /**
   * Start storage monitoring server
   */
  static async _startStorageServer(config) {
    // Create custom server for storage monitoring
    const express = require('express');
    const http = require('http');
    const cors = require('cors');

    const app = express();

    // Enable CORS for browser connections
    app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );

    // Storage state tracking
    const storageState = {
      sessions: new Map(),
      globalState: {
        cookies: new Map(),
        localStorage: new Map(),
        sessionStorage: new Map(),
        indexedDB: new Map(),
      },
    };

    // API endpoints
    app.get('/api/storage/state', (req, res) => {
      res.json({
        sessions: Array.from(storageState.sessions.keys()),
        globalState: {
          cookies: Array.from(storageState.globalState.cookies.values()),
          localStorage: Array.from(
            storageState.globalState.localStorage.values()
          ),
          sessionStorage: Array.from(
            storageState.globalState.sessionStorage.values()
          ),
          indexedDB: Array.from(storageState.globalState.indexedDB.values()),
        },
        config: {
          port: config.port,
          sessionId: config.sessionId,
          enabledFeatures: {
            cookies: config.enableCookies,
            localStorage: config.enableLocalStorage,
            sessionStorage: config.enableSessionStorage,
            indexedDB: config.enableIndexedDB,
          },
        },
      });
    });

    // Dashboard endpoint
    app.get('/', (req, res) => {
      res.send(
        StorageCommand._generateStorageDashboardHTML(config, storageState)
      );
    });

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server for storage updates
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      console.log(
        chalk.green(
          `📱 Storage client connected from ${req.socket.remoteAddress}`
        )
      );

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'storage_info',
          data: {
            message: `Connected to Storage Monitor on port ${config.port}`,
            port: config.port,
            sessionId: config.sessionId,
            config: {
              enableCookies: config.enableCookies,
              enableLocalStorage: config.enableLocalStorage,
              enableSessionStorage: config.enableSessionStorage,
              enableIndexedDB: config.enableIndexedDB,
              pollInterval: config.pollInterval,
            },
          },
        })
      );

      // Handle messages from clients
      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString());
          StorageCommand._handleStorageMessage(
            message,
            ws,
            storageState,
            config
          );
        } catch (error) {
          console.error(
            chalk.red('Error parsing storage message:'),
            error.message
          );
        }
      });

      ws.on('close', () => {
        console.log(chalk.yellow('📱 Storage client disconnected'));
      });
    });

    // Start server
    return new Promise((resolve, reject) => {
      server.listen(config.port, config.host, error => {
        if (error) {
          reject(error);
          return;
        }

        const serverInstance = {
          app,
          server,
          wss,
          config,
          storageState,
          status: 'running',
          startTime: config.startTime,
        };

        resolve(serverInstance);
      });
    });
  }

  /**
   * Handle storage messages from clients
   */
  static _handleStorageMessage(message, ws, storageState, config) {
    switch (message.type) {
      case 'storage_connect':
        StorageCommand._handleStorageConnect(message, ws, storageState);
        break;
      case 'storage_update':
        StorageCommand._handleStorageUpdate(message, ws, storageState, config);
        break;
      default:
        console.log(
          chalk.gray(`📨 Unknown storage message type: ${message.type}`)
        );
    }
  }

  /**
   * Handle storage client connection
   */
  static _handleStorageConnect(message, ws, storageState) {
    const sessionId = message.sessionId;

    // Register session
    storageState.sessions.set(sessionId, {
      sessionId,
      ws,
      connectedAt: new Date().toISOString(),
      config: message.config || {},
    });

    console.log(chalk.blue(`🔗 Storage session registered: ${sessionId}`));
  }

  /**
   * Handle storage updates from clients
   */
  static _handleStorageUpdate(message, ws, storageState, _config) {
    const { subType, data, sessionId } = message;

    // Display storage update
    StorageCommand._displayStorageUpdate(subType, data, sessionId);

    // Update global state if needed
    if (data.current) {
      switch (subType) {
        case 'cookies':
          data.current.forEach(cookie => {
            storageState.globalState.cookies.set(cookie.name, cookie);
          });
          break;
        case 'localStorage':
        case 'sessionStorage':
          data.current.forEach(item => {
            storageState.globalState[subType].set(item.key, item);
          });
          break;
      }
    }

    // Broadcast to other monitoring tools if needed
    // (This could be extended to broadcast to other CLI instances)
  }

  /**
   * Display storage update in CLI
   */
  static _displayStorageUpdate(subType, data, sessionId) {
    const timestamp = new Date().toLocaleTimeString();
    const sessionShort = sessionId.split('_').pop().substring(0, 8);

    console.log(chalk.gray(`[${timestamp}] ${sessionShort}`));

    // Display changes based on type
    if (data.added && data.added.length > 0) {
      data.added.forEach(item => {
        const key = item.name || item.key;
        const value = item.value;
        console.log(
          chalk.green(
            `  + ${subType}: ${key} = ${StorageCommand._truncateValue(value)}`
          )
        );
      });
    }

    if (data.modified && data.modified.length > 0) {
      data.modified.forEach(item => {
        const key = item.name || item.key;
        const oldValue = item.oldValue;
        const newValue = item.value;
        console.log(chalk.yellow(`  ~ ${subType}: ${key}`));
        console.log(
          chalk.gray(`    - ${StorageCommand._truncateValue(oldValue)}`)
        );
        console.log(
          chalk.gray(`    + ${StorageCommand._truncateValue(newValue)}`)
        );
      });
    }

    if (data.deleted && data.deleted.length > 0) {
      data.deleted.forEach(item => {
        const key = item.name || item.key;
        console.log(chalk.red(`  - ${subType}: ${key}`));
      });
    }
  }

  /**
   * Truncate long values for display
   */
  static _truncateValue(value, maxLength = 100) {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    return value.length > maxLength
      ? `${value.substring(0, maxLength)}...`
      : value;
  }

  /**
   * Generate session ID
   */
  static _generateSessionId() {
    return `clp_storage_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Display server information
   */
  static _displayServerInfo(config) {
    console.log(chalk.green('✅ Storage Monitor Server Started'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.blue('🌐 Port:'), chalk.white(config.port));
    console.log(chalk.blue('🆔 Session ID:'), chalk.white(config.sessionId));
    console.log(
      chalk.blue('📊 Dashboard:'),
      chalk.white(`http://${config.host}:${config.port}`)
    );
    console.log(chalk.gray('━'.repeat(50)));

    // Display enabled features
    const features = [];
    if (config.enableCookies) features.push('🍪 Cookies');
    if (config.enableLocalStorage) features.push('💾 localStorage');
    if (config.enableSessionStorage) features.push('🔄 sessionStorage');
    if (config.enableIndexedDB) features.push('🗃️ IndexedDB');

    console.log(chalk.blue('📋 Monitoring:'), features.join(', '));
    console.log(
      chalk.blue('⏱️ Poll Interval:'),
      chalk.white(`${config.pollInterval}ms`)
    );
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.green('🔗 Ready to receive storage updates...'));
    console.log(chalk.gray('Press Ctrl+C to stop'));
    console.log('');
  }

  /**
   * Start monitoring for client connections
   */
  static _startConnectionMonitoring(_port, _serverInstance) {
    // This could be extended to show connection statistics
    // For now, connections are logged in the WebSocket handler
  }

  /**
   * Setup graceful shutdown
   */
  static _setupGracefulShutdown(port) {
    const shutdown = async () => {
      console.log(chalk.yellow('\n🛑 Shutting down Storage Monitor...'));

      try {
        // Stop server if it exists
        await ServerManager.stopServer(port);
        console.log(chalk.green('✅ Storage Monitor stopped gracefully'));
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ Error during shutdown:'), error.message);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Generate storage dashboard HTML
   */
  static _generateStorageDashboardHTML(config, storageState) {
    const sessionCount = storageState.sessions.size;
    const cookieCount = storageState.globalState.cookies.size;
    const localStorageCount = storageState.globalState.localStorage.size;
    const sessionStorageCount = storageState.globalState.sessionStorage.size;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storage Monitor - Console Log Pipe</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #007acc; }
        .stat-label { color: #666; margin-top: 5px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status.running { background: #d4edda; color: #155724; }
        .feature-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .feature { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .info-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-card h3 { margin-top: 0; color: #333; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍪 Storage Monitor Dashboard</h1>
            <p>Real-time monitoring of browser storage and cookies</p>
            <div class="status running">Running</div>
            <p><strong>Port:</strong> ${
              config.port
            } | <strong>Session ID:</strong> ${config.sessionId}</p>
            <div class="feature-list">
                ${
                  config.enableCookies
                    ? '<span class="feature">🍪 Cookies</span>'
                    : ''
                }
                ${
                  config.enableLocalStorage
                    ? '<span class="feature">💾 localStorage</span>'
                    : ''
                }
                ${
                  config.enableSessionStorage
                    ? '<span class="feature">🔄 sessionStorage</span>'
                    : ''
                }
                ${
                  config.enableIndexedDB
                    ? '<span class="feature">🗃️ IndexedDB</span>'
                    : ''
                }
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${sessionCount}</div>
                <div class="stat-label">Active Sessions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${cookieCount}</div>
                <div class="stat-label">Cookies Tracked</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${localStorageCount}</div>
                <div class="stat-label">localStorage Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sessionStorageCount}</div>
                <div class="stat-label">sessionStorage Items</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>📱 Client Integration</h3>
                <p>Add storage monitoring to your web application:</p>
                <div class="code">
npm install @kansnpms/console-log-pipe-storage-beta

import StorageMonitor from '@kansnpms/console-log-pipe-storage-beta';

const monitor = new StorageMonitor({
  serverPort: ${config.port}
});

await monitor.init();
                </div>
            </div>

            <div class="info-card">
                <h3>⚙️ Configuration</h3>
                <p><strong>Poll Interval:</strong> ${config.pollInterval}ms</p>
                <p><strong>Started:</strong> ${new Date(
                  config.startTime
                ).toLocaleString()}</p>
                <p><strong>Host:</strong> ${config.host}</p>
                <div class="code">
# Start with custom settings
clp storage --port ${config.port} --poll-interval ${config.pollInterval}
                </div>
            </div>

            <div class="info-card">
                <h3>📊 API Endpoints</h3>
                <p>Access storage data programmatically:</p>
                <div class="code">
GET /api/storage/state
# Returns current storage state

WebSocket: ws://localhost:${config.port}
# Real-time storage updates
                </div>
            </div>

            <div class="info-card">
                <h3>🔧 CLI Commands</h3>
                <div class="code">
# Start storage monitor
clp storage --port ${config.port}

# With custom options
clp storage --port ${config.port} \\
  --poll-interval 500 \\
  --no-indexeddb
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  }
}

module.exports = { StorageCommand };
