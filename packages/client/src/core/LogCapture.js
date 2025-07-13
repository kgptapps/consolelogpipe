/**
 * LogCapture - Core console log interception and capture functionality
 *
 * This module intercepts browser console methods (log, error, warn, info, debug)
 * while preserving original functionality and adding metadata collection.
 */

class LogCapture {
  constructor(options = {}) {
    this.options = {
      levels: ['log', 'error', 'warn', 'info', 'debug'],
      captureMetadata: true,
      preserveOriginal: true,
      maxLogSize: 10 * 1024, // 10KB per log
      filters: {
        excludePatterns: [],
        includePatterns: [],
        levels: null, // null means all levels
      },
      ...options,
    };

    this.originalConsole = {};
    this.isCapturing = false;
    this.logQueue = [];
    this.listeners = new Set();

    // Bind methods to preserve context
    this.handleLog = this.handleLog.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
  }

  /**
   * Start capturing console logs
   */
  start() {
    if (this.isCapturing) {
      return;
    }

    this.isCapturing = true;
    this._interceptConsole();
  }

  /**
   * Stop capturing console logs and restore original console
   */
  stop() {
    if (!this.isCapturing) {
      return;
    }

    this.isCapturing = false;
    this._restoreConsole();
  }

  /**
   * Add a listener for captured logs
   * @param {Function} listener - Function to call with captured log data
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
    }
  }

  /**
   * Remove a listener
   * @param {Function} listener - Listener function to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Get current log queue
   * @returns {Array} Array of captured logs
   */
  getLogs() {
    return [...this.logQueue];
  }

  /**
   * Clear the log queue
   */
  clearLogs() {
    this.logQueue = [];
  }

  /**
   * Intercept console methods
   * @private
   */
  _interceptConsole() {
    if (typeof console === 'undefined') {
      return;
    }

    this.options.levels.forEach(level => {
      if (typeof console[level] === 'function') {
        // Store original method
        this.originalConsole[level] = console[level];

        // Replace with intercepted version
        console[level] = (...args) => {
          // Call original console method if preserveOriginal is true
          if (this.options.preserveOriginal && this.originalConsole[level]) {
            this.originalConsole[level].apply(console, args);
          }

          // Capture the log
          this.handleLog(level, args);
        };
      }
    });
  }

  /**
   * Restore original console methods
   * @private
   */
  _restoreConsole() {
    Object.keys(this.originalConsole).forEach(level => {
      if (this.originalConsole[level]) {
        console[level] = this.originalConsole[level];
      }
    });
    this.originalConsole = {};
  }

  /**
   * Handle captured log
   * @param {string} level - Log level (log, error, warn, info, debug)
   * @param {Array} args - Arguments passed to console method
   * @private
   */
  handleLog(level, args) {
    try {
      // Apply filters
      if (!this._shouldCapture(level, args)) {
        return;
      }

      // Process arguments and create log entry
      const logEntry = this._createLogEntry(level, args);

      // Check log size limit
      if (this._getLogSize(logEntry) > this.options.maxLogSize) {
        logEntry.message = '[Log too large - truncated]';
        logEntry.truncated = true;
      }

      // Add to queue
      this.logQueue.push(logEntry);

      // Notify listeners
      this._notifyListeners(logEntry);
    } catch (error) {
      // Fail silently to avoid breaking the application
      if (this.options.preserveOriginal && this.originalConsole.error) {
        this.originalConsole.error('LogCapture error:', error);
      }
    }
  }

  /**
   * Check if log should be captured based on filters
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {boolean} Whether to capture this log
   * @private
   */
  _shouldCapture(level, args) {
    const { filters } = this.options;

    // Check level filter
    if (filters.levels && !filters.levels.includes(level)) {
      return false;
    }

    // Convert args to string for pattern matching
    const message = this._argsToString(args);

    // Check exclude patterns
    if (filters.excludePatterns && filters.excludePatterns.length > 0) {
      for (const pattern of filters.excludePatterns) {
        if (pattern instanceof RegExp && pattern.test(message)) {
          return false;
        }
        if (typeof pattern === 'string' && message.includes(pattern)) {
          return false;
        }
      }
    }

    // Check include patterns (if specified, message must match at least one)
    if (filters.includePatterns && filters.includePatterns.length > 0) {
      let matches = false;
      for (const pattern of filters.includePatterns) {
        if (pattern instanceof RegExp && pattern.test(message)) {
          matches = true;
          break;
        }
        if (typeof pattern === 'string' && message.includes(pattern)) {
          matches = true;
          break;
        }
      }
      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create log entry with metadata
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Object} Log entry object
   * @private
   */
  _createLogEntry(level, args) {
    const logEntry = {
      level,
      message: this._argsToString(args),
      args: this._serializeArgs(args),
      timestamp: new Date().toISOString(),
    };

    // Add metadata if enabled
    if (this.options.captureMetadata) {
      logEntry.metadata = this._collectMetadata();
    }

    return logEntry;
  }

  /**
   * Convert arguments to string representation
   * @param {Array} args - Arguments array
   * @returns {string} String representation
   * @private
   */
  _argsToString(args) {
    return args
      .map(arg => {
        if (typeof arg === 'string') {
          return arg;
        }
        if (arg === null) {
          return 'null';
        }
        if (arg === undefined) {
          return 'undefined';
        }
        try {
          return JSON.stringify(arg, this._circularReplacer());
        } catch (error) {
          return String(arg);
        }
      })
      .join(' ');
  }

  /**
   * Serialize arguments with circular reference handling
   * @param {Array} args - Arguments array
   * @returns {Array} Serialized arguments
   * @private
   */
  _serializeArgs(args) {
    return args.map(arg => {
      try {
        // Handle primitive types
        if (arg === null || arg === undefined || typeof arg !== 'object') {
          return arg;
        }

        // Handle Error objects specially
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
            __type: 'Error',
          };
        }

        // Handle other objects with circular reference protection
        return JSON.parse(JSON.stringify(arg, this._circularReplacer()));
      } catch (error) {
        return `[Unserializable: ${typeof arg}]`;
      }
    });
  }

  /**
   * Circular reference replacer for JSON.stringify
   * @returns {Function} Replacer function
   * @private
   */
  _circularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  /**
   * Collect metadata about the current context
   * @returns {Object} Metadata object
   * @private
   */
  _collectMetadata() {
    const metadata = {};

    try {
      // URL information
      if (typeof window !== 'undefined' && window.location) {
        metadata.url = window.location.href;
        metadata.pathname = window.location.pathname;
        metadata.search = window.location.search;
      }

      // User agent
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        metadata.userAgent = navigator.userAgent;
      }

      // Timestamp
      metadata.timestamp = Date.now();

      // Stack trace (for debugging)
      if (Error.captureStackTrace) {
        const stack = {};
        Error.captureStackTrace(stack, this.handleLog);
        metadata.stack = stack.stack;
      } else {
        metadata.stack = new Error().stack;
      }
    } catch (error) {
      // Fail silently
    }

    return metadata;
  }

  /**
   * Get approximate size of log entry in bytes
   * @param {Object} logEntry - Log entry object
   * @returns {number} Size in bytes
   * @private
   */
  _getLogSize(logEntry) {
    try {
      return JSON.stringify(logEntry).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Notify all listeners of new log entry
   * @param {Object} logEntry - Log entry object
   * @private
   */
  _notifyListeners(logEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        // Fail silently to avoid breaking other listeners
      }
    });
  }
}

export default LogCapture;
