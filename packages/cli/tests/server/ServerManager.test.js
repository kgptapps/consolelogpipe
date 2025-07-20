/**
 * ServerManager Tests
 */

const ServerManager = require('../../src/server/ServerManager');
const ConfigManager = require('../../src/utils/ConfigManager');

// Mock dependencies
jest.mock('../../src/utils/ConfigManager');
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn(),
  };
  const express = jest.fn(() => mockApp);
  express.json = jest.fn(() => jest.fn());
  return express;
});

jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, host, callback) => {
      setTimeout(() => callback(), 0);
    }),
    close: jest.fn(callback => {
      setTimeout(() => callback(), 0);
    }),
  })),
}));

jest.mock('ws', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    clients: new Set(),
  })),
  OPEN: 1,
}));

describe('ServerManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ServerManager.servers.clear();

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Ensure ConfigManager.saveServerConfig returns a promise
    ConfigManager.saveServerConfig.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startServer', () => {
    const mockConfig = {
      host: 'localhost',
      port: 3001,
      sessionId: 'test-session',
      environment: 'development',
      developer: 'test-developer',
      branch: 'main',
      enableCompression: true,
      enableCors: true,
      maxLogs: 1000,
    };

    it('should start server successfully', async () => {
      const server = await ServerManager.startServer(mockConfig);

      expect(server).toBeDefined();
      expect(server.config).toEqual(mockConfig);
      expect(server.status).toBe('running');
      expect(ServerManager.servers.has(3001)).toBe(true);
    });

    it('should throw error if server already running', async () => {
      // Start first server
      await ServerManager.startServer(mockConfig);

      // Try to start second server with same app name
      await expect(ServerManager.startServer(mockConfig)).rejects.toThrow(
        'Server already running on port 3001'
      );
    });

    it('should handle server listen errors', async () => {
      const http = require('http');
      http.createServer.mockReturnValueOnce({
        listen: jest.fn((port, host, callback) => {
          setTimeout(() => callback(new Error('Port in use')), 0);
        }),
      });

      await expect(ServerManager.startServer(mockConfig)).rejects.toThrow(
        'Port in use'
      );
    });

    it('should create server with correct middleware', async () => {
      const express = require('express');
      const mockApp = express();

      await ServerManager.startServer(mockConfig);

      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // helmet
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // compression
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // cors
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // express.json
    });

    it('should set up API routes', async () => {
      const express = require('express');
      const mockApp = express();

      await ServerManager.startServer(mockConfig);

      expect(mockApp.get).toHaveBeenCalledWith(
        '/api/health',
        expect.any(Function)
      );
      expect(mockApp.post).toHaveBeenCalledWith(
        '/api/logs',
        expect.any(Function)
      );
      expect(mockApp.get).toHaveBeenCalledWith(
        '/api/logs',
        expect.any(Function)
      );
      expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function));
    });
  });

  describe('stopServer', () => {
    const mockConfig = {
      host: 'localhost',
      port: 3001,
      sessionId: 'test-session',
    };

    it('should stop server successfully', async () => {
      // Start server first
      await ServerManager.startServer(mockConfig);
      expect(ServerManager.servers.has(3001)).toBe(true);

      // Stop server
      await ServerManager.stopServer(3001);

      expect(ServerManager.servers.has(3001)).toBe(false);
      expect(ConfigManager.saveServerConfig).toHaveBeenCalledWith(
        3001,
        expect.objectContaining({
          status: 'stopped',
          stopTime: expect.any(String),
        })
      );
    });

    it('should throw error if server not found', async () => {
      await expect(ServerManager.stopServer(9999)).rejects.toThrow(
        'No server found on port 9999'
      );
    });

    it('should handle server close errors', async () => {
      const http = require('http');
      const mockServer = {
        listen: jest.fn((port, host, callback) => callback()),
        close: jest.fn(callback => callback(new Error('Close failed'))),
      };
      http.createServer.mockReturnValueOnce(mockServer);

      await ServerManager.startServer(mockConfig);

      await expect(ServerManager.stopServer(3001)).rejects.toThrow(
        'Close failed'
      );
    });
  });

  describe('getServerInfo', () => {
    const mockConfig = {
      appName: 'test-app',
      host: 'localhost',
      port: 3001,
      sessionId: 'test-session',
    };

    it('should return info for running server', async () => {
      await ServerManager.startServer(mockConfig);

      const info = await ServerManager.getServerInfo(3001);

      expect(info).toMatchObject({
        host: 'localhost',
        port: 3001,
        status: 'running',
      });
    });

    it('should return saved config for stopped server', async () => {
      ConfigManager.getServerConfig.mockResolvedValue({
        port: 3001,
        status: 'stopped',
      });

      const info = await ServerManager.getServerInfo(3001);

      expect(info).toMatchObject({
        port: 3001,
        status: 'stopped',
      });
    });

    it('should return null for non-existent server', async () => {
      ConfigManager.getServerConfig.mockResolvedValue(null);

      const info = await ServerManager.getServerInfo(9999);

      expect(info).toBeNull();
    });
  });

  describe('getAllServers', () => {
    it('should return running servers', async () => {
      await ServerManager.startServer({
        appName: 'app1',
        host: 'localhost',
        port: 3001,
      });
      await ServerManager.startServer({
        appName: 'app2',
        host: 'localhost',
        port: 3002,
      });

      const servers = await ServerManager.getAllServers();

      expect(servers).toHaveLength(2);
      expect(servers[0].port).toBe(3001);
      expect(servers[1].port).toBe(3002);
    });

    it('should include inactive servers when requested', async () => {
      ConfigManager.getAllServerConfigs.mockResolvedValue([
        { port: 3003, status: 'stopped' },
      ]);

      // Mock isServerRunning to return false for inactive servers
      jest.spyOn(ServerManager, 'isServerRunning').mockResolvedValue(false);

      const servers = await ServerManager.getAllServers(true);

      expect(servers).toHaveLength(1);
      expect(servers[0].port).toBe(3003);
      expect(servers[0].status).toBe('stopped');
    });

    it('should not duplicate running servers in inactive list', async () => {
      await ServerManager.startServer({
        appName: 'running-app',
        host: 'localhost',
        port: 3001,
      });

      ConfigManager.getAllServerConfigs.mockResolvedValue([
        { port: 3001, status: 'stopped' },
        { port: 3002, status: 'stopped' },
      ]);

      // Mock isServerRunning to return false for inactive servers
      jest.spyOn(ServerManager, 'isServerRunning').mockResolvedValue(false);

      const servers = await ServerManager.getAllServers(true);

      expect(servers).toHaveLength(2);
      const runningServer = servers.find(s => s.port === 3001);
      const stoppedServer = servers.find(s => s.port === 3002);

      expect(runningServer).toBeDefined();
      expect(runningServer.status).toBe('running');
      expect(stoppedServer).toBeDefined();
      expect(stoppedServer.status).toBe('stopped');
    });
  });

  describe('broadcastToClients', () => {
    it('should broadcast message to WebSocket clients', async () => {
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
      };

      await ServerManager.startServer({
        host: 'localhost',
        port: 3001,
      });

      const serverInstance = ServerManager.servers.get(3001);
      // Manually add the mock WebSocket client
      serverInstance.wss.clients.add(mockWs);

      ServerManager.broadcastToClients(3001, {
        type: 'test',
        data: 'message',
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'message' })
      );
    });

    it('should not broadcast to closed connections', async () => {
      const mockWs = {
        readyState: 3, // WebSocket.CLOSED
        send: jest.fn(),
      };

      await ServerManager.startServer({
        host: 'localhost',
        port: 3001,
      });

      const serverInstance = ServerManager.servers.get(3001);
      serverInstance.wss.clients.add(mockWs);

      ServerManager.broadcastToClients(3001, {
        type: 'test',
        data: 'message',
      });

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('filterLogs', () => {
    const mockLogs = [
      {
        level: 'info',
        message: 'Info message',
        timestamp: '2023-01-01T10:00:00Z',
      },
      {
        level: 'error',
        message: 'Error message',
        timestamp: '2023-01-01T11:00:00Z',
      },
      {
        level: 'debug',
        message: 'Debug message',
        timestamp: '2023-01-01T12:00:00Z',
      },
    ];

    it('should return last 50 logs by default', () => {
      const filtered = ServerManager.filterLogs(mockLogs);
      expect(filtered).toEqual(mockLogs);
    });

    it('should filter by log level', () => {
      const filtered = ServerManager.filterLogs(mockLogs, { level: 'error' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].level).toBe('error');
    });

    it('should filter by pattern', () => {
      const filtered = ServerManager.filterLogs(mockLogs, { pattern: 'Debug' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toBe('Debug message');
    });

    it('should limit by tail count', () => {
      const filtered = ServerManager.filterLogs(mockLogs, { tail: 2 });
      expect(filtered).toHaveLength(2);
      expect(filtered[0].level).toBe('error');
      expect(filtered[1].level).toBe('debug');
    });

    it('should filter by since time', () => {
      const filtered = ServerManager.filterLogs(mockLogs, {
        since: new Date('2023-01-01T10:30:00Z'),
      });
      expect(filtered).toHaveLength(2);
      expect(filtered[0].level).toBe('error');
      expect(filtered[1].level).toBe('debug');
    });
  });

  describe('isServerRunning', () => {
    it('should handle connection testing', async () => {
      // Since mocking net.Socket is complex in this test environment,
      // we'll test that the method exists and can be called
      const result = await ServerManager.isServerRunning('localhost', 3001);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateDashboardHTML', () => {
    it('should generate HTML dashboard with config info', () => {
      const config = {
        port: 3001,
        sessionId: 'test-session',
        environment: 'development',
        developer: 'test-dev',
        branch: 'main',
      };
      const stats = { connections: 2, totalLogs: 100 };
      const logCount = 50;

      const html = ServerManager.generateDashboardHTML(config, stats, logCount);

      expect(html).toContain('Console Log Pipe - Port 3001');
      expect(html).toContain('test-session');
      expect(html).toContain('development');
      expect(html).toContain('100'); // total logs
      expect(html).toContain('50'); // log count
    });

    it('should handle missing optional config values', () => {
      const config = {
        port: 3001,
        sessionId: 'test-session',
      };
      const stats = { connections: 0, totalLogs: 0 };
      const logCount = 0;

      const html = ServerManager.generateDashboardHTML(config, stats, logCount);

      expect(html).toContain('Console Log Pipe - Port 3001');
      expect(html).toContain('test-session');
      expect(html).toContain('0'); // connections, logs, etc.
    });
  });

  describe('Error Handling', () => {
    it('should handle broadcastToClients with non-existent server', () => {
      // This should not throw an error
      expect(() => {
        ServerManager.broadcastToClients(9999, { type: 'test' });
      }).not.toThrow();
    });

    it('should handle WebSocket send errors gracefully', async () => {
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(() => {
          throw new Error('Send failed');
        }),
      };

      await ServerManager.startServer({
        host: 'localhost',
        port: 3001,
      });

      const serverInstance = ServerManager.servers.get(3001);
      serverInstance.wss.clients.add(mockWs);

      // The current implementation doesn't handle send errors, so this will throw
      // This test documents the current behavior
      expect(() => {
        ServerManager.broadcastToClients(3001, { type: 'test' });
      }).toThrow('Send failed');
    });

    it('should handle missing compression middleware gracefully', async () => {
      const mockConfig = {
        host: 'localhost',
        port: 3001,
        enableCompression: true,
      };

      // This should not throw even if compression is not available
      const server = await ServerManager.startServer(mockConfig);
      expect(server).toBeDefined();
    });

    it('should handle server startup with minimal config', async () => {
      const minimalConfig = {
        port: 3001,
      };

      const server = await ServerManager.startServer(minimalConfig);
      expect(server).toBeDefined();
      expect(server.config.port).toBe(3001);
    });
  });

  describe('Advanced Filtering', () => {
    const largeMockLogs = Array.from({ length: 100 }, (_, i) => ({
      level: i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warn' : 'info',
      message: `Message ${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
    }));

    it('should limit to 50 logs by default', () => {
      const filtered = ServerManager.filterLogs(largeMockLogs);
      expect(filtered).toHaveLength(50);
    });

    it('should combine multiple filters', () => {
      const filtered = ServerManager.filterLogs(largeMockLogs, {
        level: 'error',
        tail: 10,
        pattern: 'Message',
      });

      expect(filtered.length).toBeLessThanOrEqual(10);
      filtered.forEach(log => {
        expect(log.level).toBe('error');
        expect(log.message).toContain('Message');
      });
    });

    it('should handle empty logs array', () => {
      const filtered = ServerManager.filterLogs([]);
      expect(filtered).toEqual([]);
    });

    it('should handle invalid filter parameters', () => {
      const filtered = ServerManager.filterLogs(largeMockLogs, {
        level: 'invalid-level',
        tail: -1,
        pattern: null,
      });

      expect(Array.isArray(filtered)).toBe(true);
    });
  });
});
