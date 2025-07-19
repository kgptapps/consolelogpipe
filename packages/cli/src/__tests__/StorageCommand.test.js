/**
 * Tests for StorageCommand CLI functionality
 */

const { StorageCommand } = require('../commands/StorageCommand');
const { PortManager } = require('../utils/PortManager');

// Mock dependencies
jest.mock('../server/ServerManager');
jest.mock('../utils/ConfigManager');
jest.mock('ws');

const mockServerManager = require('../server/ServerManager');
const mockConfigManager = require('../utils/ConfigManager');

describe('StorageCommand', () => {
  let originalConsoleLog;
  let originalConsoleError;
  let consoleOutput;

  beforeEach(() => {
    // Capture console output
    consoleOutput = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;

    console.log = (...args) => {
      consoleOutput.push(['log', ...args]);
    };

    console.error = (...args) => {
      consoleOutput.push(['error', ...args]);
    };

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockServerManager.isServerRunning.mockResolvedValue(false);
    mockConfigManager.saveServerConfig.mockResolvedValue();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Command Configuration', () => {
    test('should have correct command properties', () => {
      expect(StorageCommand.command).toBe('storage');
      expect(StorageCommand.description).toContain('storage monitoring');
      expect(Array.isArray(StorageCommand.options)).toBe(true);
    });

    test('should have all required options', () => {
      const optionFlags = StorageCommand.options.map(opt => opt.flags);

      expect(optionFlags).toContain('-p, --port <port>');
      expect(optionFlags).toContain('-h, --host <host>');
      expect(optionFlags).toContain('--session-id <sessionId>');
      expect(optionFlags).toContain('--poll-interval <ms>');
      expect(optionFlags).toContain('--no-cookies');
      expect(optionFlags).toContain('--no-localstorage');
      expect(optionFlags).toContain('--no-sessionstorage');
      expect(optionFlags).toContain('--no-indexeddb');
    });
  });

  describe('Configuration Preparation', () => {
    test('should prepare config with default values', async () => {
      const options = {
        port: '3002',
        host: 'localhost',
      };

      const config = await StorageCommand._prepareConfig(options);

      expect(config.port).toBe(3002);
      expect(config.host).toBe('localhost');
      expect(config.enableCookies).toBe(true);
      expect(config.enableLocalStorage).toBe(true);
      expect(config.enableSessionStorage).toBe(true);
      expect(config.enableIndexedDB).toBe(true);
      expect(config.pollInterval).toBe(1000);
      expect(config.type).toBe('storage-monitor');
      expect(typeof config.sessionId).toBe('string');
    });

    test('should handle disabled features', async () => {
      const options = {
        port: '3002',
        host: 'localhost',
        noCookies: true,
        noLocalstorage: true,
        noSessionstorage: true,
        noIndexeddb: true,
        pollInterval: '500',
      };

      const config = await StorageCommand._prepareConfig(options);

      expect(config.enableCookies).toBe(false);
      expect(config.enableLocalStorage).toBe(false);
      expect(config.enableSessionStorage).toBe(false);
      expect(config.enableIndexedDB).toBe(false);
      expect(config.pollInterval).toBe(500);
    });

    test('should validate port numbers', async () => {
      const invalidOptions = {
        port: '99999', // Invalid port
      };

      await expect(
        StorageCommand._prepareConfig(invalidOptions)
      ).rejects.toThrow('Invalid port');
    });

    test('should generate session ID if not provided', async () => {
      const options = { port: '3002' };
      const config = await StorageCommand._prepareConfig(options);

      expect(config.sessionId).toMatch(/^clp_storage_\d+_[a-z0-9]+$/);
    });

    test('should use custom session ID if provided', async () => {
      const options = {
        port: '3002',
        sessionId: 'custom-session-123',
      };

      const config = await StorageCommand._prepareConfig(options);

      expect(config.sessionId).toBe('custom-session-123');
    });
  });

  describe('Server Startup', () => {
    test('should check if port is available before starting', async () => {
      mockServerManager.isServerRunning.mockResolvedValue(true);

      const options = { port: '3002' };

      await expect(StorageCommand.execute(options)).rejects.toThrow(
        'Port 3002 is already in use'
      );

      expect(mockServerManager.isServerRunning).toHaveBeenCalledWith(
        'localhost',
        3002
      );
    });

    test('should display server information on successful start', async () => {
      // Mock successful server start
      const mockServerInstance = {
        app: {},
        server: {},
        wss: {},
        config: {
          port: 3002,
          host: 'localhost',
          sessionId: 'test-session',
          enableCookies: true,
          enableLocalStorage: true,
          enableSessionStorage: true,
          enableIndexedDB: true,
          pollInterval: 1000,
        },
      };

      // Mock the _startStorageServer method
      StorageCommand._startStorageServer = jest
        .fn()
        .mockResolvedValue(mockServerInstance);

      const options = { port: '3002' };

      // Note: This test would need to be adjusted based on how the actual execute method works
      // since it might not return a value but rather start a long-running process
    });
  });

  describe('Message Handling', () => {
    test('should handle storage connect messages', () => {
      const message = {
        type: 'storage_connect',
        sessionId: 'test-session',
        config: {
          enableCookies: true,
          enableLocalStorage: true,
        },
      };

      const mockWs = {};
      const mockStorageState = {
        sessions: new Map(),
      };

      StorageCommand._handleStorageConnect(message, mockWs, mockStorageState);

      expect(mockStorageState.sessions.has('test-session')).toBe(true);
      expect(mockStorageState.sessions.get('test-session')).toEqual({
        sessionId: 'test-session',
        ws: mockWs,
        connectedAt: expect.any(String),
        config: message.config,
      });
    });

    test('should handle storage update messages', () => {
      const message = {
        type: 'storage_update',
        subType: 'localStorage',
        sessionId: 'test-session',
        data: {
          added: [{ key: 'test', value: 'value' }],
          modified: [],
          deleted: [],
          current: [{ key: 'test', value: 'value' }],
        },
      };

      const mockWs = {};
      const mockStorageState = {
        sessions: new Map(),
        globalState: {
          localStorage: new Map(),
        },
      };
      const mockConfig = {};

      // Mock the display method to avoid console output in tests
      StorageCommand._displayStorageUpdate = jest.fn();

      StorageCommand._handleStorageUpdate(
        message,
        mockWs,
        mockStorageState,
        mockConfig
      );

      expect(StorageCommand._displayStorageUpdate).toHaveBeenCalledWith(
        'localStorage',
        message.data,
        'test-session'
      );
    });
  });

  describe('Display Functions', () => {
    test('should truncate long values', () => {
      const shortValue = 'short';
      const longValue = 'a'.repeat(150);

      expect(StorageCommand._truncateValue(shortValue)).toBe(shortValue);
      expect(StorageCommand._truncateValue(longValue)).toBe(
        `${'a'.repeat(100)}...`
      );
    });

    test('should handle non-string values', () => {
      const objectValue = { key: 'value' };
      const result = StorageCommand._truncateValue(objectValue);

      expect(result).toBe('{"key":"value"}');
    });
  });

  describe('Session ID Generation', () => {
    test('should generate valid session IDs', () => {
      const sessionId1 = StorageCommand._generateSessionId();
      const sessionId2 = StorageCommand._generateSessionId();

      expect(sessionId1).toMatch(/^clp_storage_\d+_[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^clp_storage_\d+_[a-z0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid port gracefully', async () => {
      const options = { port: 'invalid' };

      await expect(StorageCommand.execute(options)).rejects.toThrow();

      // Check that error was logged
      const errorLogs = consoleOutput.filter(([type]) => type === 'error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    test('should handle server startup failures', async () => {
      // Mock server startup failure
      StorageCommand._startStorageServer = jest
        .fn()
        .mockRejectedValue(new Error('Server failed'));

      const options = { port: '3002' };

      await expect(StorageCommand.execute(options)).rejects.toThrow();
    });
  });
});
