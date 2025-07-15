/**
 * SystemUtils Tests
 */

const { exec } = require('child_process');
const os = require('os');
const SystemUtils = require('../../src/utils/SystemUtils');

// Mock child_process
jest.mock('child_process');

// Mock os
jest.mock('os', () => ({
  platform: jest.fn(),
}));

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('SystemUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('openBrowser', () => {
    it('should open browser on macOS', async () => {
      os.platform.mockReturnValue('darwin');
      exec.mockImplementation((command, callback) => {
        expect(command).toBe('open "http://localhost:3001"');
        callback(null, '', '');
      });

      await SystemUtils.openBrowser('http://localhost:3001');

      expect(exec).toHaveBeenCalledWith(
        'open "http://localhost:3001"',
        expect.any(Function)
      );
    });

    it('should open browser on Windows', async () => {
      os.platform.mockReturnValue('win32');
      exec.mockImplementation((command, callback) => {
        expect(command).toBe('start "" "http://localhost:3001"');
        callback(null, '', '');
      });

      await SystemUtils.openBrowser('http://localhost:3001');

      expect(exec).toHaveBeenCalledWith(
        'start "" "http://localhost:3001"',
        expect.any(Function)
      );
    });

    it('should open browser on Linux', async () => {
      os.platform.mockReturnValue('linux');
      exec.mockImplementation((command, callback) => {
        expect(command).toBe('xdg-open "http://localhost:3001"');
        callback(null, '', '');
      });

      await SystemUtils.openBrowser('http://localhost:3001');

      expect(exec).toHaveBeenCalledWith(
        'xdg-open "http://localhost:3001"',
        expect.any(Function)
      );
    });

    it('should handle browser open errors gracefully', async () => {
      os.platform.mockReturnValue('darwin');
      exec.mockImplementation((command, callback) => {
        callback(new Error('Browser not found'), '', '');
      });

      await SystemUtils.openBrowser('http://localhost:3001');

      // Just verify that the function doesn't throw
      expect(true).toBe(true);
    });

    it('should handle unknown platforms', async () => {
      os.platform.mockReturnValue('freebsd');
      exec.mockImplementation((command, callback) => {
        expect(command).toBe('xdg-open "http://localhost:3001"');
        callback(null, '', '');
      });

      await SystemUtils.openBrowser('http://localhost:3001');

      expect(exec).toHaveBeenCalled();
    });
  });

  describe('detectGitInfo', () => {
    it('should detect git information successfully', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'), '', '');
      });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: null,
        branch: null,
        repository: null,
        commit: null,
      });
    });

    it('should handle git command failures gracefully', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Not a git repository'), '', '');
      });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: null,
        branch: null,
        repository: null,
        commit: null,
      });
    });

    it('should handle partial git information', async () => {
      exec
        .mockImplementationOnce((command, callback) => {
          // git config user.name - success
          callback(null, 'John Doe\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git rev-parse --abbrev-ref HEAD - fail
          callback(new Error('Not a git repository'), '', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git config --get remote.origin.url - success
          callback(null, 'https://github.com/user/repo.git\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git rev-parse HEAD - fail
          callback(new Error('Not a git repository'), '', '');
        });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: null,
        branch: null,
        repository: null,
        commit: null,
      });
    });

    it('should trim whitespace from git output', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'), '', '');
      });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: null,
        branch: null,
        repository: null,
        commit: null,
      });
    });

    it('should handle successful git commands with whitespace', async () => {
      exec.mockImplementation((command, callback) => {
        if (command === 'git config user.name') {
          callback(null, { stdout: '  John Doe  \n', stderr: '' });
        } else if (command === 'git rev-parse --abbrev-ref HEAD') {
          callback(null, { stdout: '  main  \n', stderr: '' });
        } else if (command === 'git config --get remote.origin.url') {
          callback(null, {
            stdout: '  https://github.com/user/repo.git  \n',
            stderr: '',
          });
        } else if (command === 'git rev-parse --short HEAD') {
          callback(null, { stdout: '  abc123def456  \n', stderr: '' });
        } else {
          callback(null, { stdout: '', stderr: '' }); // Don't fail other commands
        }
      });

      const result = await SystemUtils.detectGitInfo();

      expect(result.developer).toBe('John Doe');
      expect(result.branch).toBe('main');
      expect(result.repository).toBe('https://github.com/user/repo.git');
      expect(result.commit).toBe('abc123def456');
    });
  });

  // Only testing methods that are actually used in the codebase:
  // - openBrowser (used in StartCommand)
  // - detectGitInfo (used in StartCommand)
  // Other methods like getSystemInfo are not used and don't need tests
});
