/**
 * LogInterceptor - Handle console method interception
 */

class LogInterceptor {
  constructor(options = {}, formatter, onLogData) {
    this.options = {
      levels: options.levels || ['log', 'error', 'warn', 'info', 'debug'],
      preserveOriginal: options.preserveOriginal !== false,
      filters: options.filters || {
        excludePatterns: [],
        includePatterns: [],
        levels: null,
      },
      ...options,
    };

    this.formatter = formatter;
    this.onLogData = onLogData;

    // Store original console methods
    this.originalConsole = {};

    // Track interception state
    this.isIntercepting = false;
  }

  /**
   * Start console interception
   */
  startInterception() {
    if (this.isIntercepting) {
      return;
    }

    this.interceptConsole();
    this.isIntercepting = true;
  }

  /**
   * Stop console interception and restore original methods
   */
  stopInterception() {
    if (!this.isIntercepting) {
      return;
    }

    this.restoreConsole();
    this.isIntercepting = false;
  }

  /**
   * Intercept console methods
   * @private
   */
  interceptConsole() {
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
  restoreConsole() {
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
   * @param {Array} args - Log arguments
   * @private
   */
  handleLog(level, args) {
    try {
      // Apply filters
      if (!this.shouldCapture(level, args)) {
        return;
      }

      // Process arguments and create log entry
      const logEntry = this.formatter.createLogEntry(level, args);

      // Check log size limit and truncate if necessary
      const finalLogEntry = this.formatter.checkAndTruncateLogEntry(logEntry);

      // Notify the main LogCapture instance
      this.onLogData(finalLogEntry);
    } catch (error) {
      // Fail silently to avoid breaking the application
      if (this.options.preserveOriginal && this.originalConsole.error) {
        // eslint-disable-next-line no-console
        this.originalConsole.error('LogInterceptor error:', error);
      }
    }
  }

  /**
   * Check if log should be captured based on filters
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {boolean} Whether to capture the log
   * @private
   */
  shouldCapture(level, args) {
    const { filters } = this.options;

    // Check level filter
    if (filters.levels && !filters.levels.includes(level)) {
      return false;
    }

    // Convert args to string for pattern matching
    const message = this.argsToString(args);

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
   * Convert arguments to string for filtering
   * @param {Array} args - Arguments array
   * @returns {string} String representation
   * @private
   */
  argsToString(args) {
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
          return JSON.stringify(arg);
        } catch (error) {
          return arg.toString();
        }
      })
      .join(' ');
  }

  /**
   * Add filter pattern
   * @param {string} type - 'exclude' or 'include'
   * @param {string|RegExp} pattern - Pattern to add
   */
  addFilter(type, pattern) {
    if (type === 'exclude') {
      this.options.filters.excludePatterns.push(pattern);
    } else if (type === 'include') {
      this.options.filters.includePatterns.push(pattern);
    }
  }

  /**
   * Remove filter pattern
   * @param {string} type - 'exclude' or 'include'
   * @param {string|RegExp} pattern - Pattern to remove
   */
  removeFilter(type, pattern) {
    if (type === 'exclude') {
      const index = this.options.filters.excludePatterns.indexOf(pattern);
      if (index > -1) {
        this.options.filters.excludePatterns.splice(index, 1);
      }
    } else if (type === 'include') {
      const index = this.options.filters.includePatterns.indexOf(pattern);
      if (index > -1) {
        this.options.filters.includePatterns.splice(index, 1);
      }
    }
  }

  /**
   * Clear all filters
   * @param {string} type - 'exclude', 'include', or 'all'
   */
  clearFilters(type = 'all') {
    if (type === 'exclude' || type === 'all') {
      this.options.filters.excludePatterns = [];
    }
    if (type === 'include' || type === 'all') {
      this.options.filters.includePatterns = [];
    }
    if (type === 'all') {
      this.options.filters.levels = null;
    }
  }

  /**
   * Set level filter
   * @param {Array|null} levels - Array of levels to capture, or null for all
   */
  setLevelFilter(levels) {
    this.options.filters.levels = levels;
  }

  /**
   * Get current filter configuration
   * @returns {Object} Current filters
   */
  getFilters() {
    return {
      excludePatterns: [...this.options.filters.excludePatterns],
      includePatterns: [...this.options.filters.includePatterns],
      levels: this.options.filters.levels
        ? [...this.options.filters.levels]
        : null,
    };
  }

  /**
   * Check if currently intercepting
   * @returns {boolean} Interception status
   */
  isActive() {
    return this.isIntercepting;
  }

  /**
   * Get original console methods (for testing or manual calls)
   * @returns {Object} Original console methods
   */
  getOriginalConsole() {
    return { ...this.originalConsole };
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = LogInterceptor;
}
