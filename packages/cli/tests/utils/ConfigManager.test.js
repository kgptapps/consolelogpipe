/**
 * ConfigManager Tests
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ConfigManager = require('../../src/utils/ConfigManager');

// Mock fs module
const mockFs = {
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
};

jest.mock('fs', () => ({
  promises: mockFs,
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

// Use real path module

describe.skip('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    Object.values(mockFs).forEach(mock => {
      if (typeof mock.mockResolvedValue === 'function') {
        mock.mockResolvedValue();
      }
    });
  });

  describe('ensureConfigDir', () => {
    it('should create config directories successfully', async () => {
      mockFs.mkdir.mockResolvedValue();

      await ConfigManager.ensureConfigDir();

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'servers'),
        { recursive: true }
      );
    });

    it('should handle existing directories gracefully', async () => {
      const existsError = new Error('Directory exists');
      existsError.code = 'EEXIST';
      mockFs.mkdir.mockRejectedValue(existsError);

      await expect(ConfigManager.ensureConfigDir()).resolves.not.toThrow();
    });

    it('should throw non-EEXIST errors', async () => {
      const otherError = new Error('Permission denied');
      otherError.code = 'EACCES';
      mockFs.mkdir.mockRejectedValue(otherError);

      await expect(ConfigManager.ensureConfigDir()).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('saveServerConfig', () => {
    it('should save server configuration successfully', async () => {
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      const config = {
        appName: 'test-app',
        port: 3001,
        host: 'localhost',
      };

      await ConfigManager.saveServerConfig('test-app', config);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(
          '/mock/home',
          '.console-log-pipe',
          'servers',
          'test-app.json'
        ),
        expect.stringContaining('"appName": "test-app"')
      );
    });

    it('should add lastUpdated timestamp', async () => {
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      const config = { appName: 'test-app' };
      await ConfigManager.saveServerConfig('test-app', config);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);

      expect(savedData.lastUpdated).toBeDefined();
      expect(new Date(savedData.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe('getServerConfig', () => {
    it('should return server configuration when file exists', async () => {
      const mockConfig = {
        appName: 'test-app',
        port: 3001,
        lastUpdated: '2023-01-01T00:00:00.000Z',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await ConfigManager.getServerConfig('test-app');

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(
          '/mock/home',
          '.console-log-pipe',
          'servers',
          'test-app.json'
        ),
        'utf8'
      );
      expect(result).toEqual(mockConfig);
    });

    it('should return null when file does not exist', async () => {
      const notFoundError = new Error('File not found');
      notFoundError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(notFoundError);

      const result = await ConfigManager.getServerConfig('test-app');

      expect(result).toBeNull();
    });

    it('should throw non-ENOENT errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'EACCES';
      mockFs.readFile.mockRejectedValue(permissionError);

      await expect(ConfigManager.getServerConfig('test-app')).rejects.toThrow(
        'Permission denied'
      );
    });

    it('should handle invalid JSON gracefully', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');

      await expect(ConfigManager.getServerConfig('test-app')).rejects.toThrow();
    });
  });

  describe('getAllServerConfigs', () => {
    it('should return all server configurations', async () => {
      mockFs.readdir.mockResolvedValue([
        'app1.json',
        'app2.json',
        'not-json.txt',
      ]);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app1' }))
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app2' }));

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toHaveLength(2);
      expect(result[0].appName).toBe('app1');
      expect(result[1].appName).toBe('app2');
    });

    it('should handle empty servers directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toEqual([]);
    });

    it('should handle directory read errors', async () => {
      const dirError = new Error('Directory not found');
      dirError.code = 'ENOENT';
      mockFs.readdir.mockRejectedValue(dirError);

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toEqual([]);
    });

    it('should skip files that fail to read', async () => {
      mockFs.readdir.mockResolvedValue(['app1.json', 'corrupted.json']);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app1' }))
        .mockRejectedValueOnce(new Error('Corrupted file'));

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toHaveLength(1);
      expect(result[0].appName).toBe('app1');
    });
  });

  describe('deleteServerConfig', () => {
    it('should delete server configuration successfully', async () => {
      mockFs.unlink.mockResolvedValue();

      await ConfigManager.deleteServerConfig('test-app');

      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'servers', 'test-app.json')
      );
    });

    it('should handle file not found gracefully', async () => {
      const notFoundError = new Error('File not found');
      notFoundError.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(notFoundError);

      await expect(
        ConfigManager.deleteServerConfig('test-app')
      ).resolves.not.toThrow();
    });

    it('should throw non-ENOENT errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'EACCES';
      mockFs.unlink.mockRejectedValue(permissionError);

      await expect(
        ConfigManager.deleteServerConfig('test-app')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('getGlobalConfig', () => {
    it('should return global configuration when file exists', async () => {
      const mockConfig = { theme: 'dark', autoStart: true };
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await ConfigManager.getGlobalConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should return default config when file does not exist', async () => {
      const notFoundError = new Error('File not found');
      notFoundError.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(notFoundError);

      const result = await ConfigManager.getGlobalConfig();

      expect(result).toEqual({
        theme: 'auto',
        autoStart: false,
        defaultPort: 3001,
        logLevel: 'info',
      });
    });
  });

  describe('saveGlobalConfig', () => {
    it('should save global configuration successfully', async () => {
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      const config = { theme: 'dark', autoStart: true };
      await ConfigManager.saveGlobalConfig(config);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'config.json'),
        expect.stringContaining('"theme": "dark"')
      );
    });
  });

  describe('updateServerStatus', () => {
    it('should update server status', async () => {
      const mockConfig = { appName: 'test-app', port: 3001 };
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      await ConfigManager.updateServerStatus('test-app', 'running', {
        uptime: 1000,
      });

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });
});
