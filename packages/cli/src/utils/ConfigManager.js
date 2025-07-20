/**
 * ConfigManager - Manages Console Log Pipe runtime configuration
 *
 * Simplified stateless configuration manager that only handles
 * runtime configuration without persistent file storage.
 */

class ConfigManager {
  // In-memory storage for runtime server configurations
  static runtimeConfigs = new Map();

  /**
   * Save server configuration in memory (no file persistence)
   * @param {string|number} identifier - Server identifier (port or app name)
   * @param {Object} config - Server configuration
   */
  static async saveServerConfig(identifier, config) {
    const configData = {
      ...config,
      lastUpdated: new Date().toISOString(),
    };

    this.runtimeConfigs.set(String(identifier), configData);
  }

  /**
   * Get server configuration from memory
   * @param {string|number} identifier - Server identifier (port or app name)
   * @returns {Object|null} Server configuration or null if not found
   */
  static async getServerConfig(identifier) {
    return this.runtimeConfigs.get(String(identifier)) || null;
  }

  /**
   * Get all server configurations from memory
   * @returns {Array} Array of server configurations
   */
  static async getAllServerConfigs() {
    return Array.from(this.runtimeConfigs.values());
  }

  /**
   * Delete server configuration from memory
   * @param {string|number} identifier - Server identifier (port or app name)
   */
  static async deleteServerConfig(identifier) {
    this.runtimeConfigs.delete(String(identifier));
  }

  /**
   * Update server status in memory
   * @param {string|number} identifier - Server identifier (port or app name)
   * @param {string} status - New status
   */
  static async updateServerStatus(identifier, status) {
    const config = this.runtimeConfigs.get(String(identifier));
    if (config) {
      config.status = status;
      config.lastUpdated = new Date().toISOString();
      this.runtimeConfigs.set(String(identifier), config);
    }
  }

  /**
   * Get global configuration (returns defaults, no file persistence)
   * @returns {Object} Default global configuration
   */
  static async getGlobalConfig() {
    return {
      defaultHost: 'localhost',
      defaultEnvironment: 'development',
      maxLogRetention: 7, // days
      enableAnalytics: false,
      theme: 'auto',
    };
  }

  /**
   * Save global configuration (no-op, no file persistence)
   * @param {Object} _config - Global configuration (unused)
   */
  static async saveGlobalConfig(_config) {
    // No-op: we don't persist global config
  }

  /**
   * Cleanup corrupted configs (no-op, no files to clean)
   * @returns {number} Always returns 0 (no files cleaned)
   */
  static async cleanupCorruptedConfigs() {
    return 0;
  }

  /**
   * Cleanup old configs (no-op, no files to clean)
   * @param {number} _maxAge - Maximum age in days (unused)
   */
  static async cleanupOldConfigs(_maxAge = 30) {
    // No-op: we don't persist configs
  }

  /**
   * Export configurations (returns runtime configs only)
   * @returns {Object} Export data with runtime configs
   */
  static async exportConfigs() {
    const configs = await this.getAllServerConfigs();
    const globalConfig = await this.getGlobalConfig();

    return {
      global: globalConfig,
      servers: configs,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import configurations (saves to runtime memory only)
   * @param {Object} data - Import data
   */
  static async importConfigs(data) {
    if (data.servers && Array.isArray(data.servers)) {
      for (const serverConfig of data.servers) {
        if (serverConfig.appName) {
          await this.saveServerConfig(serverConfig.appName, serverConfig);
        }
      }
    }
  }

  /**
   * Clear all runtime configurations
   */
  static clearAll() {
    this.runtimeConfigs.clear();
  }
}

module.exports = ConfigManager;
