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
      // Storage Monitor already initialized
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

    this.instance = new StorageMonitor(config);

    if (config.autoStart) {
      try {
        await this.instance.init();
      } catch (error) {
        // Connection failed, but we still return the instance
        // This allows the API to work even when the server is not running
        console.warn(
          'Storage Monitor server connection failed:',
          error.message
        );
        console.warn(
          "Storage monitoring will work locally but won't stream to CLI"
        );
      }
    }

    return this.instance;
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

/**
 * Create a unified StorageMonitor API that matches documentation
 * This provides the static methods that documentation expects
 */

// Create the unified API by directly copying methods (avoid .bind() issues)
const UnifiedStorageMonitor = {};

// Copy init method with proper context
UnifiedStorageMonitor.init = function (options) {
  return BrowserStorageMonitor.init.call(BrowserStorageMonitor, options);
};

// Copy other methods
UnifiedStorageMonitor.stop = function () {
  return BrowserStorageMonitor.stop.call(BrowserStorageMonitor);
};

UnifiedStorageMonitor.getCurrentState = function () {
  return BrowserStorageMonitor.getCurrentState.call(BrowserStorageMonitor);
};

UnifiedStorageMonitor.isMonitoring = function () {
  return BrowserStorageMonitor.isMonitoring.call(BrowserStorageMonitor);
};

UnifiedStorageMonitor.isConnected = function () {
  return BrowserStorageMonitor.isConnected.call(BrowserStorageMonitor);
};

UnifiedStorageMonitor.checkStorageChanges = function () {
  return BrowserStorageMonitor.checkStorageChanges.call(BrowserStorageMonitor);
};

UnifiedStorageMonitor.onStorageChange = function (callback) {
  return BrowserStorageMonitor.onStorageChange.call(
    BrowserStorageMonitor,
    callback
  );
};

UnifiedStorageMonitor.offStorageChange = function () {
  return BrowserStorageMonitor.offStorageChange.call(BrowserStorageMonitor);
};

// Provide access to the underlying BrowserStorageMonitor for advanced usage
UnifiedStorageMonitor._internal = BrowserStorageMonitor;

// Auto-initialize if window.ConsoleLogPipeStorage is configured
if (typeof window !== 'undefined' && window.ConsoleLogPipeStorage) {
  const config = window.ConsoleLogPipeStorage;
  BrowserStorageMonitor.init(config).catch(() => {
    // Auto-initialization failed - silently ignore
  });
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedStorageMonitor; // Export the unified API
} else if (typeof window !== 'undefined') {
  window.BrowserStorageMonitor = BrowserStorageMonitor;

  // Export the unified StorageMonitor API (matches documentation)
  window.StorageMonitor = UnifiedStorageMonitor;
}

export default UnifiedStorageMonitor; // Export the unified API
