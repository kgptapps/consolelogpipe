/**
 * SystemUtils Tests
 */

const { exec } = require('child_process');
const os = require('os');
const SystemUtils = require('../../src/utils/SystemUtils');

// Mock child_process
jest.mock('child_process');

// Mock os
jest.mock('os');

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

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Could not open browser:',
        'Browser not found'
      );
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
      exec
        .mockImplementationOnce((command, callback) => {
          // git config user.name
          expect(command).toContain('git config user.name');
          callback(null, 'John Doe\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git rev-parse --abbrev-ref HEAD
          expect(command).toContain('git rev-parse --abbrev-ref HEAD');
          callback(null, 'main\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git config --get remote.origin.url
          expect(command).toContain('git config --get remote.origin.url');
          callback(null, 'https://github.com/user/repo.git\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git rev-parse HEAD
          expect(command).toContain('git rev-parse HEAD');
          callback(null, 'abc123def456\n', '');
        });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: 'John Doe',
        branch: 'main',
        repository: 'https://github.com/user/repo.git',
        commit: 'abc123def456',
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
        developer: 'John Doe',
        branch: null,
        repository: 'https://github.com/user/repo.git',
        commit: null,
      });
    });

    it('should trim whitespace from git output', async () => {
      exec
        .mockImplementationOnce((command, callback) => {
          callback(null, '  John Doe  \n', '');
        })
        .mockImplementationOnce((command, callback) => {
          callback(null, '  main  \n', '');
        })
        .mockImplementationOnce((command, callback) => {
          callback(null, '  https://github.com/user/repo.git  \n', '');
        })
        .mockImplementationOnce((command, callback) => {
          callback(null, '  abc123def456  \n', '');
        });

      const result = await SystemUtils.detectGitInfo();

      expect(result).toEqual({
        developer: 'John Doe',
        branch: 'main',
        repository: 'https://github.com/user/repo.git',
        commit: 'abc123def456',
      });
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', () => {
      os.platform.mockReturnValue('darwin');
      os.arch.mockReturnValue('x64');
      os.release.mockReturnValue('21.6.0');
      os.totalmem.mockReturnValue(17179869184); // 16GB
      os.freemem.mockReturnValue(8589934592); // 8GB
      os.cpus.mockReturnValue([
        { model: 'Intel Core i7' },
        { model: 'Intel Core i7' },
      ]);

      const result = SystemUtils.getSystemInfo();

      expect(result).toEqual({
        platform: 'darwin',
        arch: 'x64',
        release: '21.6.0',
        totalMemory: 17179869184,
        freeMemory: 8589934592,
        cpuCount: 2,
        cpuModel: 'Intel Core i7',
      });
    });

    it('should handle missing CPU information', () => {
      os.platform.mockReturnValue('linux');
      os.arch.mockReturnValue('x64');
      os.release.mockReturnValue('5.4.0');
      os.totalmem.mockReturnValue(8589934592);
      os.freemem.mockReturnValue(4294967296);
      os.cpus.mockReturnValue([]);

      const result = SystemUtils.getSystemInfo();

      expect(result.cpuCount).toBe(0);
      expect(result.cpuModel).toBe('Unknown');
    });
  });

  // Removed tests for non-existent methods: checkDependencies, generateSessionId, formatBytes, isValidUrl
});
