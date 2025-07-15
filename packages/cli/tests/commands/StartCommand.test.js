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
    it('should start server successfully with valid app name', async () => {
      const options = { host: 'localhost', port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute('test-app', options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'test-app',
          host: 'localhost',
          port: 3001,
          environment: 'development',
          developer: 'test-developer',
          branch: 'main',
        })
      );
      expect(ConfigManager.saveServerConfig).toHaveBeenCalled();
    });

    it('should fail when no app name provided', async () => {
      const options = {};
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute(undefined, options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail when no port provided', async () => {
      const options = {};
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail with invalid app name format', async () => {
      const options = {};
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('invalid app name!', options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail with invalid port number', async () => {
      const options = { port: 'invalid' };
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(ServerManager.startServer).not.toHaveBeenCalled();
    });

    it('should fail with port number out of range', async () => {
      const options = { port: '500' }; // Below 1024
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

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

      await StartCommand.execute('test-app', options, command);

      expect(ServerManager.startServer).not.toHaveBeenCalled();
      expect(openBrowser).toHaveBeenCalledWith('http://localhost:3001');
    });

    it('should check port availability for custom port', async () => {
      PortManager.isPortAvailable.mockResolvedValue(false);

      const options = { port: '4000' };
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(PortManager.isPortAvailable).toHaveBeenCalledWith(4000);
    });

    it('should use custom session ID when provided', async () => {
      const options = { sessionId: 'custom-session-123', port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute('test-app', options, command);

      expect(ServerManager.startServer).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'custom-session-123',
        })
      );
    });

    it('should generate session ID when not provided', async () => {
      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute('test-app', options, command);

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

      await StartCommand.execute('test-app', options, command);

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

      await StartCommand.execute('test-app', options, command);

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

      await StartCommand.execute('test-app', options, command);

      expect(openBrowser).not.toHaveBeenCalled();
    });

    it('should handle server start errors', async () => {
      ServerManager.startServer.mockRejectedValue(
        new Error('Server start failed')
      );

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

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

      await expect(
        StartCommand.execute('test-app', options, command)
      ).rejects.toThrow('Process exit with code 1');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace')
      );
    });

    it('should display integration instructions', async () => {
      // Temporarily restore process.exit for successful case
      mockProcessExit.mockRestore();
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute('test-app', options, command);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 Integration Instructions:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('npm install @kansnpms/console-log-pipe-client')
      );
    });

    it('should display AI-friendly session info', async () => {
      // Temporarily restore process.exit for successful case
      mockProcessExit.mockRestore();
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

      const options = { port: '3001' };
      const command = { opts: () => ({}) };

      await StartCommand.execute('test-app', options, command);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('🤖 AI-Friendly Session Info:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('"applicationName": "test-app"')
      );
    });
  });
});
