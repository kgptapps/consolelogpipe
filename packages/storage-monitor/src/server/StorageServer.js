/**
 * StorageServer - Server-side storage monitoring service
 *
 * Handles WebSocket connections from browser clients and manages
 * real-time storage state tracking and broadcasting.
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const chalk = require('chalk');

class StorageServer {
  constructor(config = {}) {
    this.config = {
      port: 3002,
      host: 'localhost',
      enableCors: true,
      maxConnections: 100,
      heartbeatInterval: 30000, // 30 seconds
      ...config,
    };

    this.app = null;
    this.server = null;
    this.wss = null;
    this.isRunning = false;

    // Storage state management
    this.sessions = new Map();
    this.globalState = {
      cookies: new Map(),
      localStorage: new Map(),
      sessionStorage: new Map(),
      indexedDB: new Map(),
    };

    // Statistics
    this.stats = {
      startTime: null,
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      storageUpdates: 0,
    };
  }

  /**
   * Start the storage monitoring server
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Storage server is already running');
    }

    try {
      await this._createServer();
      await this._startServer();
      this._setupHeartbeat();

      this.isRunning = true;
      this.stats.startTime = new Date().toISOString();

      console.log(
        chalk.green(
          `🍪 Storage Monitor Server started on http://${this.config.host}:${this.config.port}`
        )
      );

      return this;
    } catch (error) {
      console.error(chalk.red('❌ Failed to start storage server:'), error);
      throw error;
    }
  }

  /**
   * Stop the storage monitoring server
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log(chalk.yellow('🛑 Stopping Storage Monitor Server...'));

    // Close all WebSocket connections
    if (this.wss) {
      this.wss.clients.forEach(ws => {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.close(1000, 'Server shutting down');
        }
      });
    }

    // Close HTTP server
    if (this.server) {
      await new Promise(resolve => {
        this.server.close(resolve);
      });
    }

    this.isRunning = false;
    this.sessions.clear();

    console.log(chalk.green('✅ Storage Monitor Server stopped'));
  }

  /**
   * Get current server statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: this.stats.startTime
        ? Date.now() - new Date(this.stats.startTime).getTime()
        : 0,
      sessionsCount: this.sessions.size,
      globalStateSize: {
        cookies: this.globalState.cookies.size,
        localStorage: this.globalState.localStorage.size,
        sessionStorage: this.globalState.sessionStorage.size,
        indexedDB: this.globalState.indexedDB.size,
      },
    };
  }

  /**
   * Get current storage state
   */
  getStorageState() {
    return {
      sessions: Array.from(this.sessions.keys()),
      globalState: {
        cookies: Array.from(this.globalState.cookies.values()),
        localStorage: Array.from(this.globalState.localStorage.values()),
        sessionStorage: Array.from(this.globalState.sessionStorage.values()),
        indexedDB: Array.from(this.globalState.indexedDB.values()),
      },
      stats: this.getStats(),
    };
  }

  /**
   * Create Express app and HTTP server
   */
  _createServer() {
    this.app = express();

    // Enable CORS if configured
    if (this.config.enableCors) {
      this.app.use(
        cors({
          origin: true,
          credentials: true,
        })
      );
    }

    // Parse JSON bodies
    this.app.use(express.json());

    // API Routes
    this._setupRoutes();

    // Create HTTP server
    this.server = http.createServer(this.app);

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.server,
      maxPayload: 1024 * 1024, // 1MB max payload
    });

    // Setup WebSocket handling
    this._setupWebSocket();
  }

  /**
   * Setup API routes
   */
  _setupRoutes() {
    // Storage state API
    this.app.get('/api/storage/state', (req, res) => {
      res.json(this.getStorageState());
    });

    // Server statistics API
    this.app.get('/api/storage/stats', (req, res) => {
      res.json(this.getStats());
    });

    // Session information API
    this.app.get('/api/storage/sessions', (req, res) => {
      const sessions = Array.from(this.sessions.entries()).map(
        ([id, session]) => ({
          sessionId: id,
          connectedAt: session.connectedAt,
          config: session.config,
          isActive: session.ws.readyState === WebSocket.OPEN,
        })
      );
      res.json({ sessions, count: sessions.length });
    });

    // Clear storage API (for testing)
    this.app.post('/api/storage/clear', (req, res) => {
      const { storageType } = req.body;
      this._clearGlobalStorage(storageType);
      res.json({ success: true, cleared: storageType || 'all' });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: this.getStats().uptime,
        version: '0.1.0',
      });
    });

    // Dashboard (HTML)
    this.app.get('/', (req, res) => {
      res.send(this._generateDashboardHTML());
    });
  }

  /**
   * Setup WebSocket connection handling
   */
  _setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      this.stats.totalConnections++;
      this.stats.activeConnections++;

      const clientIP = req.socket.remoteAddress;
      console.log(chalk.blue(`📱 Storage client connected from ${clientIP}`));

      // Send welcome message
      this._sendToClient(ws, {
        type: 'storage_info',
        data: {
          message: `Connected to Storage Monitor on port ${this.config.port}`,
          port: this.config.port,
          serverTime: new Date().toISOString(),
          config: this.config,
        },
      });

      // Handle messages from client
      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString());
          this.stats.messagesReceived++;
          this._handleClientMessage(message, ws);
        } catch (error) {
          console.error(
            chalk.red('Error parsing client message:'),
            error.message
          );
          this._sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' },
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.stats.activeConnections--;
        this._handleClientDisconnect(ws);
        console.log(chalk.yellow('📱 Storage client disconnected'));
      });

      // Handle WebSocket errors
      ws.on('error', error => {
        console.error(chalk.red('WebSocket error:'), error.message);
      });

      // Setup ping/pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
  }

  /**
   * Handle messages from storage clients
   */
  _handleClientMessage(message, ws) {
    switch (message.type) {
      case 'storage_connect':
        this._handleStorageConnect(message, ws);
        break;
      case 'storage_update':
        this._handleStorageUpdate(message, ws);
        break;
      case 'ping':
        this._sendToClient(ws, {
          type: 'pong',
          timestamp: new Date().toISOString(),
        });
        break;
      default:
        console.log(chalk.gray(`📨 Unknown message type: ${message.type}`));
    }
  }

  /**
   * Handle storage client connection registration
   */
  _handleStorageConnect(message, ws) {
    const sessionId = message.sessionId;

    // Register session
    this.sessions.set(sessionId, {
      sessionId,
      ws,
      connectedAt: new Date().toISOString(),
      config: message.config || {},
      lastActivity: new Date().toISOString(),
    });

    console.log(chalk.blue(`🔗 Storage session registered: ${sessionId}`));

    // Send current state to new client
    this._sendToClient(ws, {
      type: 'storage_state',
      data: this.getStorageState(),
    });
  }

  /**
   * Handle storage updates from clients
   */
  _handleStorageUpdate(message, ws) {
    const { subType, data, sessionId } = message;

    this.stats.storageUpdates++;

    // Update session activity
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }

    // Update global state
    this._updateGlobalState(subType, data);

    // Display update in console
    this._displayStorageUpdate(subType, data, sessionId);

    // Broadcast to other monitoring tools if needed
    this._broadcastStorageUpdate(message, ws);
  }

  /**
   * Handle client disconnect
   */
  _handleClientDisconnect(ws) {
    // Remove session from active sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.ws === ws) {
        this.sessions.delete(sessionId);
        console.log(chalk.yellow(`🔌 Session disconnected: ${sessionId}`));
        break;
      }
    }
  }

  /**
   * Update global storage state
   */
  _updateGlobalState(subType, data) {
    if (!data.current) return;

    switch (subType) {
      case 'cookies':
        data.current.forEach(cookie => {
          this.globalState.cookies.set(cookie.name, {
            ...cookie,
            lastUpdated: new Date().toISOString(),
          });
        });
        break;
      case 'localStorage':
      case 'sessionStorage':
        data.current.forEach(item => {
          this.globalState[subType].set(item.key, {
            ...item,
            lastUpdated: new Date().toISOString(),
          });
        });
        break;
      case 'indexedDB':
        // IndexedDB handling would be more complex
        this.globalState.indexedDB.set('info', {
          ...data,
          lastUpdated: new Date().toISOString(),
        });
        break;
    }
  }

  /**
   * Display storage update in console
   */
  _displayStorageUpdate(subType, data, sessionId) {
    const timestamp = new Date().toLocaleTimeString();
    const sessionShort = sessionId.split('_').pop().substring(0, 8);

    console.log(chalk.gray(`[${timestamp}] ${sessionShort}`));

    // Display changes based on type
    if (data.added && data.added.length > 0) {
      data.added.forEach(item => {
        const key = item.name || item.key;
        const value = this._truncateValue(item.value);
        console.log(chalk.green(`  + ${subType}: ${key} = ${value}`));
      });
    }

    if (data.modified && data.modified.length > 0) {
      data.modified.forEach(item => {
        const key = item.name || item.key;
        const oldValue = this._truncateValue(item.oldValue);
        const newValue = this._truncateValue(item.value);
        console.log(chalk.yellow(`  ~ ${subType}: ${key}`));
        console.log(chalk.gray(`    - ${oldValue}`));
        console.log(chalk.gray(`    + ${newValue}`));
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
   * Broadcast storage update to other clients
   */
  _broadcastStorageUpdate(_message, _senderWs) {
    // For now, we don't broadcast to other clients
    // This could be extended to support multiple monitoring instances
  }

  /**
   * Send message to specific client
   */
  _sendToClient(ws, message) {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  _broadcastToAll(message) {
    this.wss.clients.forEach(ws => {
      this._sendToClient(ws, message);
    });
  }

  /**
   * Clear global storage state
   */
  _clearGlobalStorage(storageType) {
    if (storageType) {
      if (this.globalState[storageType]) {
        this.globalState[storageType].clear();
      }
    } else {
      // Clear all storage types
      Object.keys(this.globalState).forEach(type => {
        this.globalState[type].clear();
      });
    }
  }

  /**
   * Truncate long values for display
   */
  _truncateValue(value, maxLength = 100) {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    return value.length > maxLength
      ? `${value.substring(0, maxLength)}...`
      : value;
  }

  /**
   * Start the HTTP server
   */
  _startServer() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Setup heartbeat to detect dead connections
   */
  _setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.heartbeatInterval);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Generate dashboard HTML
   */
  _generateDashboardHTML() {
    const stats = this.getStats();
    // const storageState = this.getStorageState();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storage Monitor Dashboard - Console Log Pipe</title>
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
              this.config.port
            } | <strong>Uptime:</strong> ${Math.round(stats.uptime / 1000)}s</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.activeConnections}</div>
                <div class="stat-label">Active Sessions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.globalStateSize.cookies}</div>
                <div class="stat-label">Cookies Tracked</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${
                  stats.globalStateSize.localStorage
                }</div>
                <div class="stat-label">localStorage Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.storageUpdates}</div>
                <div class="stat-label">Storage Updates</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>📱 Client Integration</h3>
                <div class="code">
npm install @kansnpms/console-log-pipe-storage-beta

import StorageMonitor from '@kansnpms/console-log-pipe-storage-beta';
await StorageMonitor.init({ serverPort: ${this.config.port} });
                </div>
            </div>

            <div class="info-card">
                <h3>📊 API Endpoints</h3>
                <div class="code">
GET /api/storage/state
GET /api/storage/stats
GET /api/storage/sessions
POST /api/storage/clear

WebSocket: ws://localhost:${this.config.port}
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

module.exports = StorageServer;
