/**
 * ServerManager - Manages Console Log Pipe server instances
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const ConfigManager = require('../utils/ConfigManager');

class ServerManager {
  static servers = new Map();
  static configDir = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.console-log-pipe'
  );

  static async startServer(config) {
    const { port } = config;

    // Check if server is already running
    if (this.servers.has(port)) {
      const existingServer = this.servers.get(port);
      if (existingServer.status === 'running') {
        throw new Error(`Server already running on port ${port}`);
      }
    }

    // Create Express app
    const app = express();

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: false, // Allow WebSocket connections
      })
    );

    // Enable compression if configured
    if (config.enableCompression) {
      app.use(compression());
    }

    // Enable CORS if configured
    if (config.enableCors) {
      app.use(
        cors({
          origin: true,
          credentials: true,
        })
      );
    }

    // Parse JSON bodies
    app.use(express.json({ limit: '10mb' }));

    // Store logs in memory (with size limit)
    const logs = [];
    const maxLogs = config.maxLogs || 1000;

    // Statistics
    const stats = {
      totalLogs: 0,
      totalErrors: 0,
      totalNetworkRequests: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
    };

    // API Routes
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        port: config.port,
        sessionId: config.sessionId,
        uptime: Date.now() - stats.startTime,
        stats,
      });
    });

    app.post('/api/logs', (req, res) => {
      try {
        const { logs: incomingLogs } = req.body;

        if (!incomingLogs || !Array.isArray(incomingLogs)) {
          return res.status(400).json({ error: 'Invalid logs format' });
        }

        // Process each log entry
        incomingLogs.forEach(logEntry => {
          const processedLog = {
            ...logEntry,
            receivedAt: new Date().toISOString(),
            port: config.port,
            sessionId: config.sessionId,
          };

          // Add to logs array (with size limit)
          logs.push(processedLog);
          if (logs.length > maxLogs) {
            logs.shift(); // Remove oldest log
          }

          // Update statistics
          if (logEntry.type === 'log') {
            stats.totalLogs++;
          } else if (logEntry.type === 'error') {
            stats.totalErrors++;
          } else if (logEntry.type === 'network') {
            stats.totalNetworkRequests++;
          }

          stats.lastActivity = Date.now();

          // Broadcast to WebSocket clients
          this.broadcastToClients(config.port, {
            type: logEntry.type || 'log',
            data: processedLog,
          });
        });

        res.json({
          success: true,
          received: incomingLogs.length,
          totalLogs: logs.length,
        });
      } catch (error) {
        console.error('Error processing logs:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/logs', (req, res) => {
      const { since, tail, level, pattern } = req.query;
      let filteredLogs = [...logs];

      // Filter by time
      if (since) {
        const sinceTime = new Date(since).getTime();
        filteredLogs = filteredLogs.filter(
          log =>
            new Date(log.timestamp || log.receivedAt).getTime() >= sinceTime
        );
      }

      // Filter by level
      if (level) {
        filteredLogs = filteredLogs.filter(
          log => log.level && log.level.toLowerCase() === level.toLowerCase()
        );
      }

      // Filter by pattern
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        filteredLogs = filteredLogs.filter(log =>
          regex.test(JSON.stringify(log))
        );
      }

      // Limit results
      if (tail) {
        const tailCount = parseInt(tail, 10);
        filteredLogs = filteredLogs.slice(-tailCount);
      }

      res.json({
        logs: filteredLogs,
        total: filteredLogs.length,
        port: config.port,
        sessionId: config.sessionId,
      });
    });

    // Serve static dashboard (if available)
    app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML(config, stats, logs.length));
    });

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, _req) => {
      console.log(`WebSocket client connected to port ${config.port}`);

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'server_info',
          data: {
            message: `Connected to port ${config.port}`,
            port: config.port,
            sessionId: config.sessionId,
            stats,
          },
        })
      );

      // Handle client messages
      ws.on('message', message => {
        try {
          const data = JSON.parse(message.toString('utf8'));

          if (data.type === 'request_logs') {
            // Send historical logs based on filter
            const filteredLogs = this.filterLogs(logs, data.filter);
            ws.send(
              JSON.stringify({
                type: 'historical_logs',
                logs: filteredLogs,
              })
            );
          } else if (
            data.type === 'log' ||
            data.type === 'error' ||
            data.type === 'network'
          ) {
            // Handle incoming logs from browser clients
            const processedLog = {
              ...data.data,
              receivedAt: new Date().toISOString(),
              port: config.port,
              sessionId: data.data.sessionId || config.sessionId,
            };

            // Add to logs array (with size limit)
            logs.push(processedLog);
            if (logs.length > maxLogs) {
              logs.shift(); // Remove oldest log
            }

            // Update statistics
            if (data.type === 'log') {
              stats.totalLogs++;
            } else if (data.type === 'error') {
              stats.totalErrors++;
            } else if (data.type === 'network') {
              stats.totalNetworkRequests++;
            }

            stats.lastActivity = Date.now();

            // Broadcast to CLI monitoring clients
            this.broadcastToClients(config.port, {
              type: data.type,
              data: processedLog,
            });
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket client disconnected from port ${config.port}`);
      });
    });

    // Start server
    return new Promise((resolve, reject) => {
      server.listen(config.port, config.host, error => {
        if (error) {
          reject(error);
          return;
        }

        // Store server instance
        const serverInstance = {
          app,
          server,
          wss,
          config,
          stats,
          logs,
          status: 'running',
          startTime: new Date().toISOString(),
        };

        this.servers.set(config.port, serverInstance);

        // Save server configuration for persistence
        ConfigManager.saveServerConfig(config.port, {
          ...config,
          status: 'running',
          startTime: serverInstance.startTime,
          pid: process.pid,
        }).catch(console.error);

        console.log(
          `Console Log Pipe server started on http://${config.host}:${config.port}`
        );
        resolve(serverInstance);
      });
    });
  }

  static async stopServer(port) {
    const serverInstance = this.servers.get(port);

    if (!serverInstance) {
      throw new Error(`No server found on port ${port}`);
    }

    return new Promise((resolve, reject) => {
      // Close WebSocket connections
      serverInstance.wss.clients.forEach(ws => {
        ws.close();
      });

      // Close HTTP server
      serverInstance.server.close(error => {
        if (error) {
          reject(error);
          return;
        }

        // Update server status
        serverInstance.status = 'stopped';
        serverInstance.stopTime = new Date().toISOString();

        // Remove from active servers
        this.servers.delete(port);

        // Save final configuration
        ConfigManager.saveServerConfig(port, {
          ...serverInstance.config,
          status: 'stopped',
          stopTime: serverInstance.stopTime,
          finalStats: serverInstance.stats,
        }).catch(console.error);

        console.log(`Console Log Pipe server stopped on port ${port}`);
        resolve();
      });
    });
  }

  static async getServerInfo(port) {
    // Check if server is currently running
    const runningServer = this.servers.get(port);
    if (runningServer) {
      return {
        ...runningServer.config,
        status: runningServer.status,
        stats: runningServer.stats,
        startTime: runningServer.startTime,
        logCount: runningServer.logs.length,
      };
    }

    // Check saved configuration
    const savedConfig = await ConfigManager.getServerConfig(port);
    if (savedConfig) {
      return {
        ...savedConfig,
        status: 'stopped',
      };
    }

    return null;
  }

  static async getAllServers(includeInactive = false) {
    const servers = [];
    const processedPorts = new Set();

    // Add running servers from memory
    for (const [port, serverInstance] of this.servers.entries()) {
      servers.push({
        port,
        ...serverInstance.config,
        status: serverInstance.status,
        stats: serverInstance.stats,
        startTime: serverInstance.startTime,
        logCount: serverInstance.logs.length,
      });
      processedPorts.add(port);
    }

    // Check saved configurations for running servers
    const savedConfigs = await ConfigManager.getAllServerConfigs();
    for (const config of savedConfigs || []) {
      if (!processedPorts.has(config.port)) {
        // Check if server is actually running by testing the port
        const isRunning = await this.isServerRunning(
          config.host || 'localhost',
          config.port
        );

        if (isRunning) {
          servers.push({
            ...config,
            status: 'running',
          });
        } else if (includeInactive) {
          servers.push({
            ...config,
            status: 'stopped',
          });
        }
        processedPorts.add(config.port);
      }
    }

    return servers;
  }

  static async isServerRunning(host, port) {
    return new Promise(resolve => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(1000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port || 3000, host || 'localhost');
    });
  }

  static broadcastToClients(port, message) {
    const serverInstance = this.servers.get(port);
    if (!serverInstance) return;

    serverInstance.wss.clients.forEach(ws => {
      if (ws.readyState === 1) {
        // WebSocket.OPEN
        ws.send(JSON.stringify(message));
      }
    });
  }

  static filterLogs(logs, filter) {
    if (!filter) return logs.slice(-50); // Default to last 50 logs

    let filtered = [...logs];

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filtered = filtered.filter(
        log => new Date(log.timestamp || log.receivedAt).getTime() >= sinceTime
      );
    }

    if (filter.level) {
      filtered = filtered.filter(
        log =>
          log.level && log.level.toLowerCase() === filter.level.toLowerCase()
      );
    }

    if (filter.pattern) {
      const regex = new RegExp(filter.pattern, 'i');
      filtered = filtered.filter(log => regex.test(JSON.stringify(log)));
    }

    if (filter.tail) {
      filtered = filtered.slice(-filter.tail);
    }

    return filtered;
  }

  static generateDashboardHTML(config, stats, logCount) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe - Port ${config.port}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 30px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #4CAF50; color: white; font-size: 14px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .info-card { padding: 20px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #007bff; }
        .info-card h3 { margin: 0 0 10px 0; color: #333; font-size: 16px; }
        .info-card p { margin: 0; color: #666; font-size: 24px; font-weight: bold; }
        .commands { background: #f8f9fa; padding: 20px; border-radius: 6px; margin-top: 30px; }
        .commands h3 { margin-top: 0; }
        .command { background: #333; color: #fff; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Console Log Pipe</h1>
        <p><strong>Port:</strong> ${config.port} <span class="status">Running</span></p>
        <p><strong>Session ID:</strong> ${config.sessionId}</p>
        <p><strong>Environment:</strong> ${config.environment}</p>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Total Logs</h3>
                <p>${stats.totalLogs}</p>
            </div>
            <div class="info-card">
                <h3>Errors</h3>
                <p>${stats.totalErrors}</p>
            </div>
            <div class="info-card">
                <h3>Network Requests</h3>
                <p>${stats.totalNetworkRequests}</p>
            </div>
            <div class="info-card">
                <h3>Stored Logs</h3>
                <p>${logCount}</p>
            </div>
        </div>

        <div class="commands">
            <h3>CLI Commands</h3>
            <div class="command">clp start --port ${config.port}</div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = ServerManager;
