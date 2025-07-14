/**
 * ConfigManager Tests
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ConfigManager = require('../../src/utils/ConfigManager');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
  },
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

// Use real path module

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureConfigDir', () => {
    it('should create config directories successfully', async () => {
      fs.mkdir.mockResolvedValue();

      await ConfigManager.ensureConfigDir();

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'servers'),
        { recursive: true }
      );
    });

    it('should handle existing directories gracefully', async () => {
      const existsError = new Error('Directory exists');
      existsError.code = 'EEXIST';
      fs.mkdir.mockRejectedValue(existsError);

      await expect(ConfigManager.ensureConfigDir()).resolves.not.toThrow();
    });

    it('should throw non-EEXIST errors', async () => {
      const otherError = new Error('Permission denied');
      otherError.code = 'EACCES';
      fs.mkdir.mockRejectedValue(otherError);

      await expect(ConfigManager.ensureConfigDir()).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('saveServerConfig', () => {
    it('should save server configuration successfully', async () => {
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const config = {
        appName: 'test-app',
        port: 3001,
        host: 'localhost',
      };

      await ConfigManager.saveServerConfig('test-app', config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
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
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const config = { appName: 'test-app' };
      await ConfigManager.saveServerConfig('test-app', config);

      const writeCall = fs.writeFile.mock.calls[0];
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

      fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await ConfigManager.getServerConfig('test-app');

      expect(fs.readFile).toHaveBeenCalledWith(
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
      fs.readFile.mockRejectedValue(notFoundError);

      const result = await ConfigManager.getServerConfig('test-app');

      expect(result).toBeNull();
    });

    it('should throw non-ENOENT errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'EACCES';
      fs.readFile.mockRejectedValue(permissionError);

      await expect(ConfigManager.getServerConfig('test-app')).rejects.toThrow(
        'Permission denied'
      );
    });

    it('should handle invalid JSON gracefully', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      await expect(ConfigManager.getServerConfig('test-app')).rejects.toThrow();
    });
  });

  describe('getAllServerConfigs', () => {
    it('should return all server configurations', async () => {
      fs.readdir.mockResolvedValue(['app1.json', 'app2.json', 'not-json.txt']);
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app1' }))
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app2' }));

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toHaveLength(2);
      expect(result[0].appName).toBe('app1');
      expect(result[1].appName).toBe('app2');
    });

    it('should handle empty servers directory', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toEqual([]);
    });

    it('should handle directory read errors', async () => {
      const dirError = new Error('Directory not found');
      dirError.code = 'ENOENT';
      fs.readdir.mockRejectedValue(dirError);

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toEqual([]);
    });

    it('should skip files that fail to read', async () => {
      fs.readdir.mockResolvedValue(['app1.json', 'corrupted.json']);
      fs.readFile
        .mockResolvedValueOnce(JSON.stringify({ appName: 'app1' }))
        .mockRejectedValueOnce(new Error('Corrupted file'));

      const result = await ConfigManager.getAllServerConfigs();

      expect(result).toHaveLength(1);
      expect(result[0].appName).toBe('app1');
    });
  });

  describe('deleteServerConfig', () => {
    it('should delete server configuration successfully', async () => {
      fs.unlink.mockResolvedValue();

      await ConfigManager.deleteServerConfig('test-app');

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'servers', 'test-app.json')
      );
    });

    it('should handle file not found gracefully', async () => {
      const notFoundError = new Error('File not found');
      notFoundError.code = 'ENOENT';
      fs.unlink.mockRejectedValue(notFoundError);

      await expect(
        ConfigManager.deleteServerConfig('test-app')
      ).resolves.not.toThrow();
    });

    it('should throw non-ENOENT errors', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.code = 'EACCES';
      fs.unlink.mockRejectedValue(permissionError);

      await expect(
        ConfigManager.deleteServerConfig('test-app')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('getGlobalConfig', () => {
    it('should return global configuration when file exists', async () => {
      const mockConfig = { theme: 'dark', autoStart: true };
      fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await ConfigManager.getGlobalConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should return default config when file does not exist', async () => {
      const notFoundError = new Error('File not found');
      notFoundError.code = 'ENOENT';
      fs.readFile.mockRejectedValue(notFoundError);

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
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const config = { theme: 'dark', autoStart: true };
      await ConfigManager.saveGlobalConfig(config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/mock/home', '.console-log-pipe', 'config.json'),
        expect.stringContaining('"theme": "dark"')
      );
    });
  });

  describe('updateServerStatus', () => {
    it('should update server status', async () => {
      const mockConfig = { appName: 'test-app', port: 3001 };
      fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      await ConfigManager.updateServerStatus('test-app', 'running', {
        uptime: 1000,
      });

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
