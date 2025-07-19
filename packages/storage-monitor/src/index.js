/**
 * Console Log Pipe Storage Monitor
 *
 * Real-time browser storage and cookies monitoring for development and debugging.
 *
 * Features:
 * - 🍪 Cookie monitoring with real-time change detection
 * - 💾 localStorage monitoring with automatic change tracking
 * - 🔄 sessionStorage monitoring with live updates
 * - 🗃️ IndexedDB monitoring (basic support)
 * - 📡 WebSocket-based real-time communication
 * - 🎯 AI-friendly structured data format
 * - 🔧 Configurable polling intervals and feature toggles
 */

// Import main classes
const StorageMonitor = require('./StorageMonitor');

// Version information
const version = '0.1.0';

/**
 * Main API for Console Log Pipe Storage Monitor
 */
class ConsoleLogPipeStorage {
  constructor(options = {}) {
    this.version = version;
    this.monitor = null;
    this.config = {
      serverHost: 'localhost',
      serverPort: 3002,
      enableCookies: true,
      enableLocalStorage: true,
      enableSessionStorage: true,
      enableIndexedDB: true,
      pollInterval: 1000,
      autoConnect: true,
      ...options,
    };
  }

  /**
   * Initialize storage monitoring
   */
  async init(options = {}) {
    // Merge options with existing config
    this.config = { ...this.config, ...options };

    // Create monitor instance
    this.monitor = new StorageMonitor(this.config);

    if (this.config.autoConnect) {
      await this.monitor.init();
    }

    return this;
  }

  /**
   * Start monitoring (if not auto-started)
   */
  async start() {
    if (!this.monitor) {
      throw new Error('Storage monitor not initialized. Call init() first.');
    }

    if (!this.monitor.isConnected) {
      await this.monitor.init();
    }

    return this;
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitor) {
      this.monitor.stop();
    }
    return this;
  }

  /**
   * Get current storage state
   */
  getCurrentState() {
    return this.monitor ? this.monitor.getCurrentState() : null;
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring() {
    return this.monitor ? this.monitor.isMonitoring : false;
  }

  /**
   * Check if connected to server
   */
  isConnected() {
    return this.monitor ? this.monitor.isConnected : false;
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (this.monitor) {
      // Update monitor config
      Object.assign(this.monitor.config, newConfig);
    }

    return this;
  }

  /**
   * Get session information
   */
  getSession() {
    return {
      sessionId: this.config.sessionId,
      serverPort: this.config.serverPort,
      isConnected: this.isConnected(),
      isMonitoring: this.isMonitoring(),
      enabledFeatures: {
        cookies: this.config.enableCookies,
        localStorage: this.config.enableLocalStorage,
        sessionStorage: this.config.enableSessionStorage,
        indexedDB: this.config.enableIndexedDB,
      },
    };
  }

  /**
   * Force a storage state check
   */
  checkNow() {
    if (this.monitor && this.monitor.isMonitoring) {
      const currentState = this.monitor.getCurrentState();
      this.monitor._sendStorageUpdate('manual_check', currentState);
    }
    return this;
  }
}

/**
 * Static factory methods for easy initialization
 */
ConsoleLogPipeStorage.create = function (options = {}) {
  return new ConsoleLogPipeStorage(options);
};

ConsoleLogPipeStorage.init = async function (options = {}) {
  const instance = new ConsoleLogPipeStorage(options);
  await instance.init();
  return instance;
};

// Version information
ConsoleLogPipeStorage.version = version;

// Export the main class and utilities
module.exports = ConsoleLogPipeStorage;
module.exports.StorageMonitor = StorageMonitor;
module.exports.version = version;

// Default export for ES modules
module.exports.default = ConsoleLogPipeStorage;
