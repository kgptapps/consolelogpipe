/**
 * ConfigManager Tests
 *
 * Tests for the simplified stateless ConfigManager that only handles
 * runtime configuration without persistent file storage.
 */

const ConfigManager = require('../../src/utils/ConfigManager');

describe('ConfigManager', () => {
  beforeEach(() => {
    // Clear runtime configs before each test
    ConfigManager.clearAll();
  });

  describe('Runtime Configuration Management', () => {
    it('should save and retrieve server configurations', async () => {
      const config = {
        port: 3001,
        host: 'localhost',
        status: 'running',
        sessionId: 'test-session',
      };

      await ConfigManager.saveServerConfig('test-app', config);
      const retrieved = await ConfigManager.getServerConfig('test-app');

      expect(retrieved).not.toBeNull();
      expect(retrieved.port).toBe(3001);
      expect(retrieved.host).toBe('localhost');
      expect(retrieved.status).toBe('running');
      expect(retrieved.sessionId).toBe('test-session');
      expect(retrieved.lastUpdated).toBeDefined();
    });

    it('should return null for non-existent configurations', async () => {
      const config = await ConfigManager.getServerConfig('non-existent');
      expect(config).toBeNull();
    });

    it('should handle numeric identifiers', async () => {
      const config = { port: 3002, status: 'running' };

      await ConfigManager.saveServerConfig(3002, config);
      const retrieved = await ConfigManager.getServerConfig(3002);

      expect(retrieved).not.toBeNull();
      expect(retrieved.port).toBe(3002);
    });

    it('should get all server configurations', async () => {
      await ConfigManager.saveServerConfig('app1', { port: 3001 });
      await ConfigManager.saveServerConfig('app2', { port: 3002 });
      await ConfigManager.saveServerConfig('app3', { port: 3003 });

      const configs = await ConfigManager.getAllServerConfigs();
      expect(configs).toHaveLength(3);
      expect(configs.some(c => c.port === 3001)).toBe(true);
      expect(configs.some(c => c.port === 3002)).toBe(true);
      expect(configs.some(c => c.port === 3003)).toBe(true);
    });

    it('should delete server configurations', async () => {
      await ConfigManager.saveServerConfig('test-app', { port: 3001 });

      let config = await ConfigManager.getServerConfig('test-app');
      expect(config).not.toBeNull();

      await ConfigManager.deleteServerConfig('test-app');
      config = await ConfigManager.getServerConfig('test-app');
      expect(config).toBeNull();
    });

    it('should update server status', async () => {
      const initialConfig = { port: 3001, status: 'starting' };
      await ConfigManager.saveServerConfig('test-app', initialConfig);

      await ConfigManager.updateServerStatus('test-app', 'running');

      const updated = await ConfigManager.getServerConfig('test-app');
      expect(updated.status).toBe('running');
      expect(updated.lastUpdated).toBeDefined();
    });

    it('should not update status for non-existent config', async () => {
      await ConfigManager.updateServerStatus('non-existent', 'running');
      const config = await ConfigManager.getServerConfig('non-existent');
      expect(config).toBeNull();
    });
  });

  describe('Global Configuration', () => {
    it('should return default global config', async () => {
      // This will likely hit the ENOENT path and return defaults
      const config = await ConfigManager.getGlobalConfig();

      expect(config).toHaveProperty('defaultHost', 'localhost');
      expect(config).toHaveProperty('defaultEnvironment', 'development');
      expect(config).toHaveProperty('maxLogRetention', 7);
      expect(config).toHaveProperty('enableAnalytics', false);
      expect(config).toHaveProperty('theme', 'auto');
    });

    it('should handle save global config as no-op', async () => {
      const config = { theme: 'dark', customSetting: true };

      // Should not throw
      await expect(
        ConfigManager.saveGlobalConfig(config)
      ).resolves.not.toThrow();

      // Global config should still return defaults (no persistence)
      const retrieved = await ConfigManager.getGlobalConfig();
      expect(retrieved.theme).toBe('auto'); // Still default
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export runtime configurations', async () => {
      // Add some runtime configs
      await ConfigManager.saveServerConfig('app1', {
        port: 3001,
        status: 'running',
      });
      await ConfigManager.saveServerConfig('app2', {
        port: 3002,
        status: 'stopped',
      });

      const exported = await ConfigManager.exportConfigs();

      expect(exported).toHaveProperty('global');
      expect(exported).toHaveProperty('servers');
      expect(exported).toHaveProperty('exportedAt');
      expect(Array.isArray(exported.servers)).toBe(true);
      expect(exported.servers).toHaveLength(2);
      expect(exported.servers.some(s => s.port === 3001)).toBe(true);
      expect(exported.servers.some(s => s.port === 3002)).toBe(true);
    });

    it('should import server configurations', async () => {
      const testData = {
        global: { theme: 'dark' },
        servers: [
          { appName: 'imported-app1', port: 3001, status: 'running' },
          { appName: 'imported-app2', port: 3002, status: 'stopped' },
        ],
      };

      await ConfigManager.importConfigs(testData);

      const app1 = await ConfigManager.getServerConfig('imported-app1');
      const app2 = await ConfigManager.getServerConfig('imported-app2');

      expect(app1).not.toBeNull();
      expect(app1.port).toBe(3001);
      expect(app1.status).toBe('running');

      expect(app2).not.toBeNull();
      expect(app2.port).toBe(3002);
      expect(app2.status).toBe('stopped');
    });

    it('should handle import with empty data', async () => {
      const testData = {};

      await expect(
        ConfigManager.importConfigs(testData)
      ).resolves.not.toThrow();
    });

    it('should handle import with invalid server entries', async () => {
      const testData = {
        servers: [
          { appName: 'valid-app', port: 3001 },
          { port: 3002 }, // Missing appName
          { appName: '', port: 3003 }, // Empty appName
          { appName: 'another-valid', port: 3004 },
        ],
      };

      await ConfigManager.importConfigs(testData);

      const validApp = await ConfigManager.getServerConfig('valid-app');
      const anotherValid = await ConfigManager.getServerConfig('another-valid');
      const invalidApp = await ConfigManager.getServerConfig('');

      expect(validApp).not.toBeNull();
      expect(anotherValid).not.toBeNull();
      expect(invalidApp).toBeNull();
    });

    it('should handle import with non-array servers', async () => {
      const testData = { servers: 'not-an-array' };

      await expect(
        ConfigManager.importConfigs(testData)
      ).resolves.not.toThrow();
    });

    describe('Cleanup Operations', () => {
      it('should handle cleanup of corrupted configs as no-op', async () => {
        // Cleanup methods are no-ops in stateless ConfigManager
        const result = await ConfigManager.cleanupCorruptedConfigs();

        expect(typeof result).toBe('number');
        expect(result).toBe(0); // Always returns 0 (no files to clean)
      });

      it('should handle cleanup of old configs as no-op', async () => {
        // Cleanup methods are no-ops in stateless ConfigManager
        await expect(
          ConfigManager.cleanupOldConfigs(30)
        ).resolves.not.toThrow();
      });
    });

    describe('Utility Methods', () => {
      it('should clear all runtime configurations', async () => {
        // Add some configs
        ConfigManager.saveServerConfig('test1', { port: 3001 });
        ConfigManager.saveServerConfig('test2', { port: 3002 });

        // Clear all
        ConfigManager.clearAll();

        // Verify they're gone
        await expect(ConfigManager.getAllServerConfigs()).resolves.toEqual([]);
      });
    });
  });
});
