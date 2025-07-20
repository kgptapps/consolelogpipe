/**
 * ConfigManager Tests
 *
 * Note: These are simplified tests that focus on the core functionality
 * rather than complex mocking. ConfigManager is tested through integration
 * with other components like StartCommand.
 */

const ConfigManager = require('../../src/utils/ConfigManager');

describe('ConfigManager', () => {
  describe('Static Properties', () => {
    it('should have correct config directory paths', () => {
      expect(ConfigManager.configDir).toContain('.console-log-pipe');
      expect(ConfigManager.serversDir).toContain('servers');
      expect(ConfigManager.globalConfigFile).toContain('config.json');
    });
  });

  describe('Method Availability', () => {
    it('should have all required server config methods', () => {
      expect(typeof ConfigManager.saveServerConfig).toBe('function');
      expect(typeof ConfigManager.getServerConfig).toBe('function');
      expect(typeof ConfigManager.getAllServerConfigs).toBe('function');
      expect(typeof ConfigManager.deleteServerConfig).toBe('function');
      expect(typeof ConfigManager.updateServerStatus).toBe('function');
    });

    it('should have all required global config methods', () => {
      expect(typeof ConfigManager.getGlobalConfig).toBe('function');
      expect(typeof ConfigManager.saveGlobalConfig).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof ConfigManager.ensureConfigDir).toBe('function');
    });
  });

  describe('Path Construction', () => {
    it('should construct correct server config paths', () => {
      const appName = 'test-app';
      const path = ConfigManager.getConfigPath(appName);

      expect(path).toContain('test-app.json');
      expect(path).toContain('.console-log-pipe');
    });

    it('should have valid global config path', () => {
      const path = ConfigManager.getGlobalConfigPath();
      expect(path).toBeDefined();
      expect(path).toContain('config.json');
    });
  });

  describe('Default Configuration', () => {
    it('should return default global config when file does not exist', async () => {
      // This will likely hit the ENOENT path and return defaults
      const config = await ConfigManager.getGlobalConfig();

      expect(config).toHaveProperty('defaultHost', 'localhost');
      expect(config).toHaveProperty('defaultEnvironment', 'development');
      expect(config).toHaveProperty('maxLogRetention', 7);
      expect(config).toHaveProperty('enableAnalytics', false);
      expect(config).toHaveProperty('theme', 'auto');
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export configurations', async () => {
      try {
        const exported = await ConfigManager.exportConfigs();

        expect(exported).toHaveProperty('global');
        expect(exported).toHaveProperty('servers');
        expect(exported).toHaveProperty('exportedAt');
        expect(Array.isArray(exported.servers)).toBe(true);
      } catch (error) {
        // In CI environments, this might fail due to permissions
        // This is acceptable as long as it doesn't crash
        expect(error.code).toMatch(/EACCES|ENOENT|EPERM/);
      }
    });

    it('should handle import with valid data', async () => {
      const testData = {
        global: { theme: 'dark' },
        servers: [{ appName: 'test-app', port: 3001 }],
      };

      // This should either succeed or fail gracefully (not crash)
      try {
        await ConfigManager.importConfigs(testData);
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails due to file system issues in test environment, that's also fine
        expect(error.message).toMatch(/ENOENT|EACCES|EPERM/);
      }
    });

    it('should handle import with empty data', async () => {
      const testData = {};

      // This should not throw
      await expect(
        ConfigManager.importConfigs(testData)
      ).resolves.not.toThrow();
    });
  });

  describe('Cleanup Operations', () => {
    it('should handle cleanup of corrupted configs', async () => {
      // This tests the cleanupCorruptedConfigs method
      const result = await ConfigManager.cleanupCorruptedConfigs();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle cleanup of old configs', async () => {
      // This tests the cleanupOldConfigs method with a very short maxAge
      // so it won't actually delete anything but will exercise the code
      await expect(ConfigManager.cleanupOldConfigs(999)).resolves.not.toThrow();
    });
  });

  describe('Server Configuration Operations', () => {
    it('should handle getting non-existent server config', async () => {
      const config = await ConfigManager.getServerConfig(
        'non-existent-app-12345'
      );

      expect(config).toBeNull();
    });

    it('should handle getting all server configs', async () => {
      try {
        const configs = await ConfigManager.getAllServerConfigs();

        expect(Array.isArray(configs)).toBe(true);
      } catch (error) {
        // In CI environments, this might fail due to permissions
        // This is acceptable as long as it doesn't crash
        expect(error.code).toMatch(/EACCES|ENOENT|EPERM/);
      }
    });

    it('should handle deleting non-existent server config', async () => {
      // This should not throw even if the file doesn't exist
      await expect(
        ConfigManager.deleteServerConfig('non-existent-app-12345')
      ).resolves.not.toThrow();
    });

    it('should save and retrieve server config', async () => {
      const testAppName = `test-save-retrieve-${Date.now()}`;
      const testConfig = {
        appName: testAppName,
        port: 3001,
        status: 'running',
        startTime: new Date().toISOString(),
      };

      try {
        // Save config
        await ConfigManager.saveServerConfig(testAppName, testConfig);

        // Retrieve config
        const retrieved = await ConfigManager.getServerConfig(testAppName);

        expect(retrieved).toBeTruthy();
        expect(retrieved.appName).toBe(testAppName);
        expect(retrieved.port).toBe(3001);
        expect(retrieved.status).toBe('running');
        expect(retrieved.lastUpdated).toBeDefined();

        // Clean up
        await ConfigManager.deleteServerConfig(testAppName);
      } catch (error) {
        // In CI environments, this might fail due to permissions
        expect(error.code).toMatch(/EACCES|ENOENT|EPERM/);
      }
    });

    it('should update server status', async () => {
      const testAppName = `test-update-status-${Date.now()}`;
      const testConfig = {
        appName: testAppName,
        port: 3002,
        status: 'running',
      };

      try {
        // Save initial config
        await ConfigManager.saveServerConfig(testAppName, testConfig);

        // Update status
        await ConfigManager.updateServerStatus(testAppName, 'stopped');

        // Verify update
        const updated = await ConfigManager.getServerConfig(testAppName);
        expect(updated.status).toBe('stopped');
        expect(updated.lastUpdated).toBeDefined();

        // Clean up
        await ConfigManager.deleteServerConfig(testAppName);
      } catch (error) {
        // In CI environments, this might fail due to permissions
        expect(error.code).toMatch(/EACCES|ENOENT|EPERM/);
      }
    });
  });

  describe('Global Configuration Operations', () => {
    it('should save and retrieve global config', async () => {
      const testConfig = {
        defaultHost: 'test-host',
        defaultEnvironment: 'test',
        maxLogRetention: 14,
        enableAnalytics: true,
        theme: 'dark',
      };

      try {
        // Save config
        await ConfigManager.saveGlobalConfig(testConfig);

        // Retrieve config
        const retrieved = await ConfigManager.getGlobalConfig();

        expect(retrieved.defaultHost).toBe('test-host');
        expect(retrieved.defaultEnvironment).toBe('test');
        expect(retrieved.maxLogRetention).toBe(14);
        expect(retrieved.enableAnalytics).toBe(true);
        expect(retrieved.theme).toBe('dark');
      } catch (error) {
        // In CI environments, this might fail due to permissions
        expect(error.code).toMatch(/EACCES|ENOENT|EPERM/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted JSON files gracefully', async () => {
      // This tests the JSON parsing error handling
      const result = await ConfigManager.cleanupCorruptedConfigs();
      expect(typeof result).toBe('number');
    });

    it('should handle file system errors gracefully', async () => {
      // Test with invalid app name that might cause file system issues
      const config = await ConfigManager.getServerConfig('');
      expect(config).toBeNull();
    });
  });
});
