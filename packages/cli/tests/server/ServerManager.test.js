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
});
