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

  describe('checkDependencies', () => {
    it('should check for required dependencies', async () => {
      exec
        .mockImplementationOnce((command, callback) => {
          // node --version
          expect(command).toContain('node --version');
          callback(null, 'v18.17.0\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // npm --version
          expect(command).toContain('npm --version');
          callback(null, '9.6.7\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git --version
          expect(command).toContain('git --version');
          callback(null, 'git version 2.39.0\n', '');
        });

      const result = await SystemUtils.checkDependencies();

      expect(result).toEqual({
        node: { available: true, version: 'v18.17.0' },
        npm: { available: true, version: '9.6.7' },
        git: { available: true, version: 'git version 2.39.0' },
      });
    });

    it('should handle missing dependencies', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Command not found'), '', '');
      });

      const result = await SystemUtils.checkDependencies();

      expect(result).toEqual({
        node: { available: false, version: null },
        npm: { available: false, version: null },
        git: { available: false, version: null },
      });
    });

    it('should handle partial dependency availability', async () => {
      exec
        .mockImplementationOnce((command, callback) => {
          // node --version - success
          callback(null, 'v18.17.0\n', '');
        })
        .mockImplementationOnce((command, callback) => {
          // npm --version - fail
          callback(new Error('Command not found'), '', '');
        })
        .mockImplementationOnce((command, callback) => {
          // git --version - success
          callback(null, 'git version 2.39.0\n', '');
        });

      const result = await SystemUtils.checkDependencies();

      expect(result).toEqual({
        node: { available: true, version: 'v18.17.0' },
        npm: { available: false, version: null },
        git: { available: true, version: 'git version 2.39.0' },
      });
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = SystemUtils.generateSessionId();
      const id2 = SystemUtils.generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^clp_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^clp_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should include timestamp in session ID', () => {
      const beforeTime = Date.now();
      const sessionId = SystemUtils.generateSessionId();
      const afterTime = Date.now();

      // Extract timestamp from session ID
      const parts = sessionId.split('_');
      const timestamp = parseInt(parts[1], 36);

      expect(timestamp).toBeGreaterThanOrEqual(Math.floor(beforeTime / 1000));
      expect(timestamp).toBeLessThanOrEqual(Math.floor(afterTime / 1000));
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(SystemUtils.formatBytes(0)).toBe('0 B');
      expect(SystemUtils.formatBytes(1024)).toBe('1.0 KB');
      expect(SystemUtils.formatBytes(1048576)).toBe('1.0 MB');
      expect(SystemUtils.formatBytes(1073741824)).toBe('1.0 GB');
      expect(SystemUtils.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should handle negative values', () => {
      expect(SystemUtils.formatBytes(-1024)).toBe('-1.0 KB');
    });

    it('should handle very large values', () => {
      expect(SystemUtils.formatBytes(1099511627776)).toBe('1.0 TB');
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(SystemUtils.isValidUrl('http://localhost:3001')).toBe(true);
      expect(SystemUtils.isValidUrl('https://example.com')).toBe(true);
      expect(SystemUtils.isValidUrl('ftp://files.example.com')).toBe(true);
      expect(SystemUtils.isValidUrl('not-a-url')).toBe(false);
      expect(SystemUtils.isValidUrl('')).toBe(false);
      expect(SystemUtils.isValidUrl(null)).toBe(false);
    });
  });
});
