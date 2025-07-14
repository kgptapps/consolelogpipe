/**
 * ConfigManager - Manages Console Log Pipe configuration files
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigManager {
  static configDir = path.join(os.homedir(), '.console-log-pipe');
  static serversDir = path.join(this.configDir, 'servers');
  static globalConfigFile = path.join(this.configDir, 'config.json');

  static async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      await fs.mkdir(this.serversDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  static async saveServerConfig(appName, config) {
    await this.ensureConfigDir();

    const configFile = path.join(this.serversDir, `${appName}.json`);
    const configData = {
      ...config,
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(configFile, JSON.stringify(configData, null, 2));
  }

  static async getServerConfig(appName) {
    try {
      const configFile = path.join(this.serversDir, `${appName}.json`);
      const data = await fs.readFile(configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  static async getAllServerConfigs() {
    try {
      await this.ensureConfigDir();
      const files = await fs.readdir(this.serversDir);
      const configs = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const configFile = path.join(this.serversDir, file);
            const data = await fs.readFile(configFile, 'utf8');
            const config = JSON.parse(data);
            configs.push(config);
          } catch (error) {
            console.error(`Error reading config file ${file}:`, error.message);
          }
        }
      }

      return configs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  static async deleteServerConfig(appName) {
    try {
      const configFile = path.join(this.serversDir, `${appName}.json`);
      await fs.unlink(configFile);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  static async saveGlobalConfig(config) {
    await this.ensureConfigDir();

    const globalConfig = {
      ...config,
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(
      this.globalConfigFile,
      JSON.stringify(globalConfig, null, 2)
    );
  }

  static async getGlobalConfig() {
    try {
      const data = await fs.readFile(this.globalConfigFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Return default configuration
        return {
          defaultHost: 'localhost',
          defaultEnvironment: 'development',
          maxLogRetention: 7, // days
          enableAnalytics: false,
          theme: 'auto',
        };
      }
      throw error;
    }
  }

  static async updateServerStatus(appName, status, additionalData = {}) {
    const config = await this.getServerConfig(appName);
    if (config) {
      config.status = status;
      config.lastStatusUpdate = new Date().toISOString();
      Object.assign(config, additionalData);
      await this.saveServerConfig(appName, config);
    }
  }

  static async cleanupOldConfigs(maxAge = 30) {
    try {
      const configs = await this.getAllServerConfigs();
      const cutoffTime = Date.now() - maxAge * 24 * 60 * 60 * 1000; // maxAge in days

      for (const config of configs) {
        const lastUpdated = new Date(
          config.lastUpdated || config.startTime
        ).getTime();

        if (lastUpdated < cutoffTime && config.status === 'stopped') {
          await this.deleteServerConfig(config.appName);
          console.log(`Cleaned up old config for ${config.appName}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old configs:', error.message);
    }
  }

  static getConfigPath(appName) {
    return path.join(this.serversDir, `${appName}.json`);
  }

  static getGlobalConfigPath() {
    return this.globalConfigFile;
  }

  static async exportConfigs() {
    const configs = await this.getAllServerConfigs();
    const globalConfig = await this.getGlobalConfig();

    return {
      global: globalConfig,
      servers: configs,
      exportedAt: new Date().toISOString(),
    };
  }

  static async importConfigs(data) {
    if (data.global) {
      await this.saveGlobalConfig(data.global);
    }

    if (data.servers && Array.isArray(data.servers)) {
      for (const serverConfig of data.servers) {
        if (serverConfig.appName) {
          await this.saveServerConfig(serverConfig.appName, serverConfig);
        }
      }
    }
  }
}

module.exports = ConfigManager;
