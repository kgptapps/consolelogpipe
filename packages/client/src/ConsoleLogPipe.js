/* eslint-env node */
/**
 * ConsoleLogPipe - Main API class for Console Log Pipe Client Library
 *
 * Provides a unified interface for capturing console logs, errors, and network requests
 * with configuration management, session management, and transport integration.
 */

const { LogCapture } = require('./core/log');
const { NetworkCapture } = require('./core/network');
const ErrorCapture = require('./core/ErrorCapture');
const { HttpTransport } = require('./transport');

class ConsoleLogPipe {
  constructor(options = {}) {
    // Validate required options
    if (!options.applicationName) {
      throw new Error(
        'applicationName is required for Console Log Pipe initialization'
      );
    }

    // Default configuration
    this.config = {
      // Application context (required)
      applicationName: options.applicationName,
      sessionId: options.sessionId || this._generateSessionId(),
      environment: options.environment || this._detectEnvironment(),
      developer: options.developer || this._detectDeveloper(),
      branch: options.branch || this._detectBranch(),

      // Server configuration
      serverHost: options.serverHost || 'localhost',
      serverPort:
        options.serverPort || this._getApplicationPort(options.applicationName),
      serverPath: options.serverPath || '/api/logs',
      enableRemoteLogging: options.enableRemoteLogging !== false,

      // Feature toggles
      enableLogCapture: options.enableLogCapture !== false,
      enableErrorCapture: options.enableErrorCapture !== false,
      enableNetworkCapture: options.enableNetworkCapture !== false,
      preserveOriginal: options.preserveOriginal !== false,

      // AI-friendly features
      enableMetadata: options.enableMetadata !== false,
      enableErrorCategorization: options.enableErrorCategorization !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      enableNetworkAnalysis: options.enableNetworkAnalysis !== false,

      // Filtering options
      logLevels: options.logLevels || ['log', 'error', 'warn', 'info', 'debug'],
      excludePatterns: options.excludePatterns || [],
      includePatterns: options.includePatterns || [],
      excludeUrls: options.excludeUrls || ['/health', '/ping', '/favicon.ico'],
      includeUrls: options.includeUrls || [],

      // Performance options
      maxLogSize: options.maxLogSize || 10000,
      maxQueueSize: options.maxQueueSize || 1000,
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 1000,

      // Transport options
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      enableCompression: options.enableCompression !== false,
      enableAutoDiscovery: options.enableAutoDiscovery !== false,

      ...options,
    };

    // State management
    this.isInitialized = false;
    this.isCapturing = false;
    this.components = {};
    this.listeners = new Set();
    this.stats = {
      totalLogs: 0,
      totalErrors: 0,
      totalNetworkRequests: 0,
      startTime: null,
      lastActivity: null,
    };

    // Bind methods
    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.destroy = this.destroy.bind(this);
    this._handleLogData = this._handleLogData.bind(this);
    this._handleErrorData = this._handleErrorData.bind(this);
    this._handleNetworkData = this._handleNetworkData.bind(this);
  }

  /**
   * Initialize the Console Log Pipe with all components
   */
  async init() {
    if (this.isInitialized) {
      return this;
    }

    try {
      // Initialize transport layer
      if (this.config.enableRemoteLogging) {
        this.components.transport = new HttpTransport({
          serverHost: this.config.serverHost,
          serverPort: this.config.serverPort,
          serverPath: this.config.serverPath,
          applicationName: this.config.applicationName,
          sessionId: this.config.sessionId,
          batchSize: this.config.batchSize,
          batchTimeout: this.config.batchTimeout,
          maxRetries: this.config.maxRetries,
          retryDelay: this.config.retryDelay,
          enableCompression: this.config.enableCompression,
          enableAutoDiscovery: this.config.enableAutoDiscovery,
        });

        await this.components.transport.initialize();
      }

      // Initialize log capture
      if (this.config.enableLogCapture) {
        this.components.logCapture = new LogCapture({
          ...this.config,
          onLogData: this._handleLogData,
        });
      }

      // Initialize error capture
      if (this.config.enableErrorCapture) {
        this.components.errorCapture = new ErrorCapture({
          ...this.config,
          onErrorData: this._handleErrorData,
        });
      }

      // Initialize network capture
      if (this.config.enableNetworkCapture) {
        this.components.networkCapture = new NetworkCapture({
          ...this.config,
          onNetworkData: this._handleNetworkData,
        });
      }

      this.isInitialized = true;
      this.stats.startTime = Date.now();

      // Log session information
      this._logSessionInfo();

      return this;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize Console Log Pipe:', error);
      throw error;
    }
  }

  /**
   * Start capturing logs, errors, and network requests
   */
  start() {
    if (!this.isInitialized) {
      throw new Error('Console Log Pipe must be initialized before starting');
    }

    if (this.isCapturing) {
      return this;
    }

    // Start all enabled components
    if (this.components.logCapture) {
      this.components.logCapture.start();
    }

    if (this.components.errorCapture) {
      this.components.errorCapture.start();
    }

    if (this.components.networkCapture) {
      this.components.networkCapture.start();
    }

    this.isCapturing = true;
    this.stats.lastActivity = Date.now();

    return this;
  }

  /**
   * Stop capturing (but keep components initialized)
   */
  stop() {
    if (!this.isCapturing) {
      return this;
    }

    // Stop all components
    if (this.components.logCapture) {
      this.components.logCapture.stop();
    }

    if (this.components.errorCapture) {
      this.components.errorCapture.stop();
    }

    if (this.components.networkCapture) {
      this.components.networkCapture.stop();
    }

    this.isCapturing = false;

    return this;
  }

  /**
   * Destroy all components and clean up resources
   */
  async destroy() {
    this.stop();

    // Flush any pending data
    if (this.components.transport) {
      await this.components.transport.flush();
      this.components.transport.destroy();
    }

    // Clean up components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });

    this.components = {};
    this.listeners.clear();
    this.isInitialized = false;
    this.isCapturing = false;

    return this;
  }

  /**
   * Add a listener for captured data
   */
  addListener(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.listeners.add(callback);
    return this;
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
    return this;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration (requires restart to take effect)
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }

  /**
   * Get current statistics
   */
  getStats() {
    const stats = { ...this.stats };

    if (this.components.transport) {
      stats.transport = this.components.transport.getStats();
    }

    return stats;
  }

  /**
   * Get session information
   */
  getSession() {
    return {
      sessionId: this.config.sessionId,
      applicationName: this.config.applicationName,
      environment: this.config.environment,
      developer: this.config.developer,
      branch: this.config.branch,
      startTime: this.stats.startTime,
      isCapturing: this.isCapturing,
    };
  }

  /**
   * Flush any pending data immediately
   */
  async flush() {
    if (this.components.transport) {
      await this.components.transport.flush();
    }
    return this;
  }

  /**
   * Handle log data from LogCapture
   */
  _handleLogData(logData) {
    this.stats.totalLogs++;
    this.stats.lastActivity = Date.now();

    // Send to transport
    if (this.components.transport) {
      this.components.transport.send(logData);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener({ type: 'log', data: logData });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in log listener:', error);
      }
    });
  }

  /**
   * Handle error data from ErrorCapture
   */
  _handleErrorData(errorData) {
    this.stats.totalErrors++;
    this.stats.lastActivity = Date.now();

    // Send to transport
    if (this.components.transport) {
      this.components.transport.send(errorData);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener({ type: 'error', data: errorData });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in error listener:', error);
      }
    });
  }

  /**
   * Handle network data from NetworkCapture
   */
  _handleNetworkData(networkData) {
    this.stats.totalNetworkRequests++;
    this.stats.lastActivity = Date.now();

    // Send to transport
    if (this.components.transport) {
      this.components.transport.send(networkData);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener({ type: 'network', data: networkData });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Generate a unique session ID
   */
  _generateSessionId() {
    return `clp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect environment from various sources
   */
  _detectEnvironment() {
    if (typeof window !== 'undefined') {
      // Browser environment detection
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        return 'development';
      }
      if (
        window.location.hostname.includes('staging') ||
        window.location.hostname.includes('dev')
      ) {
        return 'staging';
      }
      return 'production';
    }
    return 'development';
  }

  /**
   * Detect developer from git config or environment
   */
  _detectDeveloper() {
    // In browser, we can't access git config, so return a placeholder
    return 'unknown-developer';
  }

  /**
   * Detect git branch (placeholder for browser environment)
   */
  _detectBranch() {
    return 'unknown-branch';
  }

  /**
   * Get application-specific port
   */
  _getApplicationPort(applicationName) {
    if (!applicationName) return 3001;

    // Simple hash to port mapping (3001-3100)
    let hash = 0;
    for (let i = 0; i < applicationName.length; i++) {
      hash = ((hash << 5) - hash + applicationName.charCodeAt(i)) & 0xffffffff;
    }
    return 3001 + (Math.abs(hash) % 100);
  }

  /**
   * Log session information to console
   */
  _logSessionInfo() {
    if (typeof console !== 'undefined' && console.log) {
      // eslint-disable-next-line no-console
      console.log(
        `🚀 Console Log Pipe initialized for "${this.config.applicationName}"`
      );
      // eslint-disable-next-line no-console
      console.log(`📋 Session ID: ${this.config.sessionId}`);
      // eslint-disable-next-line no-console
      console.log(`🌍 Environment: ${this.config.environment}`);
      // eslint-disable-next-line no-console
      console.log(
        `🔗 Server: ${this.config.serverHost}:${this.config.serverPort}`
      );
    }
  }
}

module.exports = ConsoleLogPipe;
