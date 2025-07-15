/**
 * LogCapture - Main coordination class for log capture functionality
 *
 * This is the modular version that uses separate modules for different concerns.
 */

const LogUtils = require('./LogUtils');
const LogFormatter = require('./LogFormatter');
const LogInterceptor = require('./LogInterceptor');

class LogCapture {
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

    // Validate required applicationName
    if (
      !options.applicationName ||
      typeof options.applicationName !== 'string'
    ) {
      throw new Error(
        'applicationName is required and must be a non-empty string'
      );
    }

    this.options = {
      levels: ['log', 'error', 'warn', 'info', 'debug'],
      captureMetadata: true,
      preserveOriginal: true,
      maxLogSize: 10 * 1024, // 10KB per log

      // Multi-application support (REQUIRED)
      applicationName: options.applicationName,
      sessionId: options.sessionId || LogUtils.generateSessionId(),

      // AI-friendly development context
      environment: options.environment || LogUtils.detectEnvironment(),
      developer: options.developer || LogUtils.detectDeveloper(),
      branch: options.branch || LogUtils.detectBranch(),

      // Server connection configuration
      serverPort:
        options.serverPort ||
        LogUtils.getApplicationPort(options.applicationName),
      serverHost: options.serverHost || 'localhost',
      enableRemoteLogging: options.enableRemoteLogging || false,
      batchSize: options.batchSize || 10, // For remote logging
      batchTimeout: options.batchTimeout || 1000, // 1 second

      // AI-friendly error categorization
      enableErrorCategorization: options.enableErrorCategorization !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,

      filters: {
        excludePatterns: [],
        includePatterns: [],
        levels: null, // null means all levels
        ...options.filters,
      },

      ...options,
    };

    // Initialize components
    this.formatter = new LogFormatter(this.options);
    this.interceptor = new LogInterceptor(
      this.options,
      this.formatter,
      this.handleLogData.bind(this),
      this._createLogEntry.bind(this)
    );

    // State management
    this.isCapturing = false;
    this.listeners = new Set();
    this.logQueue = [];

    // Initialize error categories for backward compatibility
    this.errorCategories = this.formatter.analyzer.initializeErrorCategories();

    // Expose original console methods for testing
    this.originalConsole = this.interceptor.originalConsole;

    // Log session information to console for manual inspection
    this.logSessionInfo();

    // Bind methods to preserve context
    this.handleLog = this.handleLogData.bind(this);
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

    this.interceptor.startInterception();
    this.isCapturing = true;
  }

  /**
   * Stop capturing console logs and restore original console
   */
  stop() {
    if (!this.isCapturing) {
      return;
    }

    this.interceptor.stopInterception();
    this.isCapturing = false;
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
   * Handle captured log data from interceptor
   * @param {Object} logEntry - Processed log entry
   * @private
   */
  handleLogData(logEntry) {
    try {
      // Add to queue
      this.logQueue.push(logEntry);

      // Notify listeners
      this.notifyListeners(logEntry);
    } catch (error) {
      // Handle errors gracefully and call original console.error
      if (this.originalConsole && this.originalConsole.error) {
        this.originalConsole.error('LogCapture error:', error);
      }
    }
  }

  /**
   * Notify all listeners of new log entry
   * @param {Object} logEntry - Log entry object
   * @private
   */
  notifyListeners(logEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        // Fail silently to avoid breaking other listeners
      }
    });
  }

  /**
   * Log session information to console for manual inspection
   * @private
   */
  logSessionInfo() {
    // Completely disable session logging to prevent recursion
    // Session info will be available through other methods
  }

  /**
   * Get log summary
   * @returns {Object} Summary of captured logs
   */
  getLogSummary() {
    return this.formatter.createLogSummary(this.logQueue);
  }

  /**
   * Filter logs based on criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered logs
   */
  filterLogs(filters) {
    return this.formatter.filterLogEntries(this.logQueue, filters);
  }

  /**
   * Export logs in different formats
   * @param {string} format - 'json', 'console', or 'transmission'
   * @returns {string|Array} Formatted logs
   */
  exportLogs(format = 'json') {
    switch (format) {
      case 'console':
        return this.logQueue.map(entry =>
          this.formatter.formatForConsole(entry)
        );
      case 'transmission':
        return this.logQueue.map(entry =>
          this.formatter.formatForTransmission(entry)
        );
      case 'json':
      default:
        return this.logQueue.map(entry => this.formatter.formatForJSON(entry));
    }
  }

  /**
   * Add filter to interceptor
   * @param {string} type - 'exclude' or 'include'
   * @param {string|RegExp} pattern - Pattern to add
   */
  addFilter(type, pattern) {
    this.interceptor.addFilter(type, pattern);
  }

  /**
   * Remove filter from interceptor
   * @param {string} type - 'exclude' or 'include'
   * @param {string|RegExp} pattern - Pattern to remove
   */
  removeFilter(type, pattern) {
    this.interceptor.removeFilter(type, pattern);
  }

  /**
   * Clear filters
   * @param {string} type - 'exclude', 'include', or 'all'
   */
  clearFilters(type = 'all') {
    this.interceptor.clearFilters(type);
  }

  /**
   * Set level filter
   * @param {Array|null} levels - Array of levels to capture, or null for all
   */
  setLevelFilter(levels) {
    this.interceptor.setLevelFilter(levels);
  }

  /**
   * Get current filter configuration
   * @returns {Object} Current filters
   */
  getFilters() {
    return this.interceptor.getFilters();
  }

  // Legacy method aliases for backward compatibility
  handleLog(level, args) {
    // This is now handled by the interceptor, but kept for compatibility
    return this.interceptor.handleLog(level, args);
  }

  _shouldCapture(level, args) {
    return this.interceptor.shouldCapture(level, args);
  }

  _createLogEntry(level, args) {
    try {
      return this.formatter.createLogEntry(level, args);
    } catch (error) {
      // Handle errors gracefully and call original console.error
      if (this.originalConsole && this.originalConsole.error) {
        this.originalConsole.error('LogCapture error:', error);
      }
      // Return a fallback log entry instead of re-throwing to prevent breaking the app
      return {
        level,
        message: '[Error creating log entry]',
        args: args || [],
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  _argsToString(args) {
    return LogUtils.argsToString(args);
  }

  _serializeArgs(args) {
    return LogUtils.serializeArgs(args);
  }

  _circularReplacer() {
    return LogUtils.circularReplacer();
  }

  _collectEnhancedMetadata() {
    return LogUtils.collectEnhancedMetadata();
  }

  _collectMetadata() {
    return LogUtils.collectEnhancedMetadata();
  }

  _categorizeLog(level, message, args) {
    return this.formatter.analyzer.categorizeLog(level, message, args);
  }

  _calculateSeverity(level, message, args) {
    return this.formatter.analyzer.calculateSeverity(level, message, args);
  }

  _getSeverityDescription(level) {
    return this.formatter.analyzer.getSeverityDescription(level);
  }

  _getLogSize(logEntry) {
    return LogUtils.getLogSize(logEntry);
  }

  _notifyListeners(logEntry) {
    return this.notifyListeners(logEntry);
  }

  _generateSessionId() {
    return LogUtils.generateSessionId();
  }

  _getApplicationPort(applicationName) {
    return LogUtils.getApplicationPort(applicationName);
  }

  _detectEnvironment() {
    return LogUtils.detectEnvironment();
  }

  _detectDeveloper() {
    return LogUtils.detectDeveloper();
  }

  _detectBranch() {
    return LogUtils.detectBranch();
  }

  _generateAITags(level, message, args) {
    return this.formatter.analyzer.generateAITags(level, message, args);
  }

  _analyzeError(message, args) {
    return this.formatter.analyzer.analyzeError(message, args);
  }

  _initializeErrorCategories() {
    return this.formatter.analyzer.initializeErrorCategories();
  }

  _collectPerformanceMetrics() {
    return LogUtils.collectPerformanceMetrics();
  }

  _parseStackTrace(stack) {
    return LogUtils.parseStackTrace(stack);
  }

  _logSessionInfo() {
    return this.logSessionInfo();
  }

  _interceptConsole() {
    return this.interceptor.interceptConsole();
  }

  _restoreConsole() {
    return this.interceptor.restoreConsole();
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = LogCapture;
}
