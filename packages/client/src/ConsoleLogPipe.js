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

class ConsoleLogPipe {
  constructor(options = {}) {
    // Store original console methods BEFORE any interception
    this._originalConsole = {};
    if (typeof console !== 'undefined') {
      this._originalConsole.log = console.log.bind(console);
      this._originalConsole.error = console.error.bind(console);
      this._originalConsole.warn = console.warn.bind(console);
      this._originalConsole.info = console.info.bind(console);
      this._originalConsole.debug = console.debug.bind(console);
    }

    // Default configuration
    this.config = {
      // Application context (optional, for backwards compatibility only)
      sessionId: options.sessionId || this._generateSessionId(),
      environment: options.environment || this._detectEnvironment(),
      developer: options.developer || this._detectDeveloper(),
      branch: options.branch || this._detectBranch(),

      // Server configuration
      serverHost: options.serverHost || options.host || 'localhost',
      serverPort: options.serverPort || options.port || 3001,
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
      // Initialize WebSocket transport layer
      if (this.config.enableRemoteLogging) {
        this.components.transport = this._createWebSocketTransport();
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
   * Create WebSocket transport
   */
  _createWebSocketTransport() {
    const wsUrl = `ws://${this.config.serverHost}:${this.config.serverPort}`;

    return {
      ws: null,
      isConnected: false,
      messagesSent: 0,

      async initialize() {
        return new Promise((resolve, reject) => {
          try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
              this.isConnected = true;
              // Silent connection - no logging to prevent recursion
              resolve();
            };

            this.ws.onerror = error => {
              this.isConnected = false;
              // Silent error handling - no logging to prevent recursion
              reject(error);
            };

            this.ws.onclose = () => {
              this.isConnected = false;
              // Silent close - no logging to prevent recursion
            };

            this.ws.onmessage = event => {
              // Handle server messages if needed
              try {
                JSON.parse(event.data);
                // Process server messages silently
              } catch (error) {
                // Ignore parsing errors
              }
            };
          } catch (error) {
            reject(error);
          }
        });
      },

      send(logData) {
        if (
          this.ws &&
          this.isConnected &&
          this.ws.readyState === WebSocket.OPEN
        ) {
          try {
            // Transform log data to format expected by CLI server
            const messageData = {
              type: logData.level === 'error' ? 'error' : 'log',
              data: {
                level: logData.level,
                message: logData.message || this._formatArgs(logData.args),
                timestamp: logData.timestamp,
                source: 'browser',
                sessionId: logData.sessionId,
                args: logData.args,
              },
            };

            this.ws.send(JSON.stringify(messageData));
            this.messagesSent++;
          } catch (error) {
            // Silent error handling to prevent recursion
          }
        }
      },

      _formatArgs(args) {
        if (!args || !Array.isArray(args)) return '';
        return args
          .map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            try {
              return JSON.stringify(arg);
            } catch (error) {
              return String(arg);
            }
          })
          .join(' ');
      },

      disconnect() {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
          this.isConnected = false;
        }
      },

      async flush() {
        // For WebSocket, there's no buffering to flush
        // This is a no-op but required for the interface
        return Promise.resolve();
      },

      destroy() {
        this.disconnect();
      },

      getStats() {
        return {
          connected: this.isConnected,
          messagesSent: this.messagesSent,
          lastActivity: Date.now(),
        };
      },
    };
  }

  /**
   * Handle log data from LogCapture
   */
  _handleLogData(logData) {
    this.stats.totalLogs++;
    this.stats.lastActivity = Date.now();

    // Enhance log data with session information
    const enhancedLogData = {
      ...logData,
      sessionId: this.config.sessionId,
      environment: this.config.environment,
    };

    // Send to transport
    if (this.components.transport) {
      this.components.transport.send(enhancedLogData);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener({ type: 'log', data: enhancedLogData });
      } catch (error) {
        // Use original console to avoid recursion
        if (this._originalConsole.error) {
          this._originalConsole.error('Error in log listener:', error);
        }
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
   * Log session information to console
   */
  _logSessionInfo() {
    // Completely disable session logging to prevent recursion
    // Session info will be available through getSession() method instead
  }
}

module.exports = ConsoleLogPipe;
