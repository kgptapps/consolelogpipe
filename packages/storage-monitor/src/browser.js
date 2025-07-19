/**
 * Browser Storage Monitor - Client-side storage monitoring for web applications
 *
 * This module provides a simple API for web applications to monitor storage changes
 * and send them to the Console Log Pipe Storage Monitor service.
 */

// Import the main StorageMonitor class
import StorageMonitor from './StorageMonitor.js';

/**
 * Browser-specific storage monitoring API
 * Provides a simple interface for web applications
 */
const BrowserStorageMonitor = {
  instance: null,

  /**
   * Initialize storage monitoring
   * @param {Object} options - Configuration options
   * @returns {Promise<StorageMonitor>} - Storage monitor instance
   */
  async init(options = {}) {
    if (this.instance) {
      console.warn('🍪 Storage Monitor already initialized');
      return this.instance;
    }

    // Default configuration for browser environment
    const config = {
      serverHost: 'localhost',
      serverPort: 3002,
      enableCookies: true,
      enableLocalStorage: true,
      enableSessionStorage: true,
      enableIndexedDB: true,
      pollInterval: 1000,
      autoStart: true,
      ...options,
    };

    try {
      this.instance = new StorageMonitor(config);

      if (config.autoStart) {
        await this.instance.init();
      }

      return this.instance;
    } catch (error) {
      console.error('❌ Failed to initialize Storage Monitor:', error);
      throw error;
    }
  },

  /**
   * Stop storage monitoring
   */
  stop() {
    if (this.instance) {
      this.instance.stop();
      this.instance = null;
    }
  },

  /**
   * Get current storage state
   */
  getCurrentState() {
    return this.instance ? this.instance.getCurrentState() : null;
  },

  /**
   * Check if monitoring is active
   */
  isMonitoring() {
    return this.instance ? this.instance.isMonitoring : false;
  },

  /**
   * Get connection status
   */
  isConnected() {
    return this.instance ? this.instance.isConnected : false;
  },

  /**
   * Manual trigger for storage state check
   */
  checkStorageChanges() {
    if (this.instance && this.instance.isMonitoring) {
      // Force a check of all storage types
      const currentState = this.instance.getCurrentState();
      this.instance._sendStorageUpdate('manual_check', currentState);
    }
  },

  /**
   * Add custom storage event listener
   */
  onStorageChange(callback) {
    if (this.instance) {
      this.instance.onStorageChange = callback;
    }
  },

  /**
   * Remove storage event listener
   */
  offStorageChange() {
    if (this.instance) {
      this.instance.onStorageChange = null;
    }
  },
};

// Auto-initialize if window.ConsoleLogPipeStorage is configured
if (typeof window !== 'undefined' && window.ConsoleLogPipeStorage) {
  const config = window.ConsoleLogPipeStorage;
  BrowserStorageMonitor.init(config).catch(error => {
    console.error('❌ Auto-initialization failed:', error);
  });
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserStorageMonitor;
} else if (typeof window !== 'undefined') {
  window.BrowserStorageMonitor = BrowserStorageMonitor;

  // Also provide a shorter alias
  window.StorageMonitor = BrowserStorageMonitor;
}

export default BrowserStorageMonitor;
