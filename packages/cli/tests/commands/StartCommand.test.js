/**
 * StartCommand Tests
 */

const StartCommand = require('../../src/commands/StartCommand');
const ServerManager = require('../../src/server/ServerManager');
const ConfigManager = require('../../src/utils/ConfigManager');
const PortManager = require('../../src/utils/PortManager');
const { openBrowser, detectGitInfo } = require('../../src/utils/SystemUtils');

// Mock dependencies
jest.mock('../../src/server/ServerManager');
jest.mock('../../src/utils/ConfigManager');
jest.mock('../../src/utils/PortManager');
jest.mock('../../src/utils/SystemUtils');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: '',
  }));
});

// Mock console methods
let mockConsoleLog;
let mockConsoleError;
let mockProcessExit;

describe('StartCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up console mocks
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`Process exit with code ${code}`);
    });

    // Mock the _startLogMonitoring method to prevent WebSocket connection
    jest.spyOn(StartCommand, '_startLogMonitoring').mockImplementation(() => {
      // Do nothing in tests
    });

    // Default mocks
    ServerManager.getServerInfo.mockResolvedValue(null);
    ServerManager.startServer.mockResolvedValue({ server: 'mock' });
    ConfigManager.saveServerConfig.mockResolvedValue();
    PortManager.getApplicationPort.mockReturnValue(3001);
    PortManager.isPortAvailable.mockResolvedValue(true);
    detectGitInfo.mockResolvedValue({
      developer: 'test-developer',
      branch: 'main',
    });
    openBrowser.mockResolvedValue();
  });

  afterEach(() => {
    if (mockConsoleLog) {
      mockConsoleLog.mockRestore();
    }
    if (mockConsoleError) {
      mockConsoleError.mockRestore();
    }
    if (mockProcessExit) {
      mockProcessExit.mockRestore();
    }
  });

  describe('execute', () => {
    it('should start server successfully', async () => {
      const options = { host: 'localhost', port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          port: 3001,
          environment: 'development',
          developer: 'test-developer',
          branch: 'main',
        })
      );
      expect(ConfigManager.saveServerConfig).toHaveBeenCalled();
    });

    it('should fail when no port provided', async () => {
      const options = {};
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail with invalid port number', async () => {
      const options = { port: 'invalid' };
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail with port number out of range', async () => {
      const options = { port: '500' }; // Below 1024
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should handle existing running server', async () => {
      ServerManager.getServerInfo.mockResolvedValue({
        status: 'running',
        host: 'localhost',
        port: 3001,
        sessionId: 'existing-session',
      });

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).not.toHaveBeenCalled();
      expect(openBrowser).toHaveBeenCalledWith('http://localhost:3001');
    });

    it('should check port availability for custom port', async () => {
      PortManager.isPortAvailable.mockResolvedValue(false);

      const options = { port: '4000' };
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(PortManager.isPortAvailable).toHaveBeenCalledWith(4000);
    });

    it('should use custom session ID when provided', async () => {
      const options = { sessionId: 'custom-session-123', port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'custom-session-123',
        })
      );
    });

    it('should generate session ID when not provided', async () => {
      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.stringMatching(/^clp_\d+_[a-z0-9]+$/),
        })
      );
    });

    it('should use git info when available', async () => {
      detectGitInfo.mockResolvedValue({
        developer: 'git-developer',
        branch: 'feature-branch',
      });

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          developer: 'git-developer',
          branch: 'feature-branch',
        })
      );
    });

    it('should override git info with command options', async () => {
      detectGitInfo.mockResolvedValue({
        developer: 'git-developer',
        branch: 'git-branch',
      });

      const options = {
        developer: 'custom-developer',
        branch: 'custom-branch',
        port: '3001',
      };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          developer: 'custom-developer',
          branch: 'custom-branch',
        })
      );
    });

    it('should not open browser when noBrowser option is set', async () => {
      const options = { noBrowser: true, port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(openBrowser).not.toHaveBeenCalled();
    });

    it('should handle server start errors', async () => {
      ServerManager.startServer.mockRejectedValue(
        new Error('Server start failed')
      );

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        'Server start failed'
      );
    });

    it('should show verbose error details when verbose flag is set', async () => {
      const error = new Error('Server start failed');
      error.stack = 'Error stack trace';
      ServerManager.startServer.mockRejectedValue(error);

      const options = { port: '3001' };
      const command = { opts: () => ({ verbose: true }) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace')
      );
    });

    it('should display server started message', async () => {
      // Temporarily restore process.exit for successful case
      mockProcessExit.mockRestore();
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Console Log Pipe Server Started')
      );
      expect(ServerManager.startServer).toHaveBeenCalled();
    });

    it('should save server configuration', async () => {
      // Temporarily restore process.exit for successful case
      mockProcessExit.mockRestore();
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ConfigManager.saveServerConfig).toHaveBeenCalledWith(
        3001,
        expect.objectContaining({
          port: 3001,
        })
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      ConfigManager.cleanupCorruptedConfigs.mockRejectedValue(
        new Error('Cleanup failed')
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Could not clean up config files:',
        'Cleanup failed'
      );

      consoleSpy.mockRestore();
    });

    it('should handle git info detection errors', async () => {
      detectGitInfo.mockRejectedValue(new Error('Git not found'));

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await expect(StartCommand.execute(options, command)).rejects.toThrow(
        'Process exit with code 1'
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        'Git not found'
      );
    });

    it('should use default values for optional config', async () => {
      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          environment: 'development',
          logLevel: 'debug',
          maxLogs: 1000,
          enableCompression: true,
          enableCors: true,
        })
      );
    });

    it('should use custom values when provided', async () => {
      const options = {
        port: '3001',
        host: 'custom-host',
        env: 'production',
        logLevel: 'info',
        maxLogs: '500',
        enableCompression: false,
        enableCors: false,
      };
      const command = { opts: () => ({}) };

      await StartCommand.execute(options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'custom-host',
          environment: 'production',
          logLevel: 'info',
          maxLogs: 500,
          enableCompression: false,
          enableCors: false,
        })
      );
    });
  });

  describe('_displayLog', () => {
    let mockConsoleLog;

    beforeEach(() => {
      mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      mockConsoleLog.mockRestore();
    });

    it('should display error logs with red color and error icon', () => {
      const logData = { level: 'error', message: 'Test error message' };

      StartCommand._displayLog(logData, 'error');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should display warning logs with yellow color and warning icon', () => {
      const logData = { level: 'warn', message: 'Test warning message' };

      StartCommand._displayLog(logData, 'warn');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should display info logs with blue color and info icon', () => {
      const logData = { level: 'info', message: 'Test info message' };

      StartCommand._displayLog(logData, 'info');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should display debug logs with gray color and debug icon', () => {
      const logData = { level: 'debug', message: 'Test debug message' };

      StartCommand._displayLog(logData, 'debug');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🔍')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });

    it('should display network logs with cyan color and network icon', () => {
      const logData = { level: 'network', url: 'https://api.example.com' };

      StartCommand._displayLog(logData, 'network');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🌐')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('https://api.example.com')
      );
    });

    it('should handle logs without level using type', () => {
      const logData = { message: 'Test message without level' };

      StartCommand._displayLog(logData, 'error');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
    });

    it('should handle logs without message using JSON stringify', () => {
      const logData = { data: 'some data', value: 123 };

      StartCommand._displayLog(logData, 'log');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('{"data":"some data","value":123}')
      );
    });

    it('should handle warning level with different case', () => {
      const logData = { level: 'WARNING', message: 'Test warning' };

      StartCommand._displayLog(logData, 'warning');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );
    });

    it('should use default icon and color for unknown levels', () => {
      const logData = { level: 'unknown', message: 'Test unknown level' };

      StartCommand._displayLog(logData, 'unknown');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📝')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test unknown level')
      );
    });
  });
});
