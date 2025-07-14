/**
 * LogCapture - Core console log interception and capture functionality
 *
 * This module intercepts browser console methods (log, error, warn, info, debug)
 * while preserving original functionality and adding metadata collection.
 */

class LogCapture {
  constructor(options = {}) {
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
      sessionId: options.sessionId || this._generateSessionId(),

      // AI-friendly development context
      environment: options.environment || this._detectEnvironment(),
      developer: options.developer || this._detectDeveloper(),
      branch: options.branch || this._detectBranch(),

      // Server connection configuration
      serverPort:
        options.serverPort || this._getApplicationPort(options.applicationName),
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
      },
      ...options,
    };

    this.originalConsole = {};
    this.isCapturing = false;
    this.logQueue = [];
    this.listeners = new Set();
    this.remoteBatch = [];
    this.batchTimer = null;
    this.websocket = null;
    this.hasActiveListeners = false;
    this.performanceMarks = new Map();
    this.errorCategories = this._initializeErrorCategories();

    // Log session information to console for manual inspection
    this._logSessionInfo();

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
   * Create log entry with metadata and AI-friendly structure
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Object} Log entry object
   * @private
   */
  _createLogEntry(level, args) {
    const timestamp = new Date().toISOString();
    const message = this._argsToString(args);

    // Create structured log entry with AI-friendly format
    const logEntry = {
      // Core log data
      level,
      message,
      args: this._serializeArgs(args),
      timestamp,

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
        port: this.options.serverPort,
      },

      // AI-friendly categorization
      category: this._categorizeLog(level, message, args),
      severity: this._calculateSeverity(level, message, args),
      tags: this._generateAITags(level, message, args),

      // Performance metrics (if enabled)
      performance: this.options.enablePerformanceTracking
        ? this._collectPerformanceMetrics()
        : null,

      // Error analysis (for error logs)
      errorAnalysis:
        level === 'error' ? this._analyzeError(message, args) : null,

      // Contextual metadata
      context: this.options.captureMetadata
        ? this._collectEnhancedMetadata()
        : null,
    };

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
   * Collect enhanced metadata about the current context for AI analysis
   * @returns {Object} Enhanced metadata object
   * @private
   */
  _collectEnhancedMetadata() {
    const metadata = {};

    try {
      // URL and navigation information
      if (typeof window !== 'undefined' && window.location) {
        metadata.url = {
          href: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          origin: window.location.origin,
        };
      }

      // Browser and device information
      if (typeof navigator !== 'undefined') {
        metadata.browser = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        };
      }

      // Viewport and screen information
      if (typeof window !== 'undefined') {
        metadata.viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          screenWidth: window.screen?.width,
          screenHeight: window.screen?.height,
          devicePixelRatio: window.devicePixelRatio,
        };
      }

      // Timing information
      metadata.timing = {
        timestamp: Date.now(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      };

      // Stack trace for debugging
      if (Error.captureStackTrace) {
        const stack = {};
        Error.captureStackTrace(stack, this.handleLog);
        metadata.stack = this._parseStackTrace(stack.stack);
      } else {
        metadata.stack = this._parseStackTrace(new Error().stack);
      }

      // Document state
      if (typeof document !== 'undefined') {
        metadata.document = {
          readyState: document.readyState,
          title: document.title,
          referrer: document.referrer,
          visibilityState: document.visibilityState,
        };
      }
    } catch (error) {
      // Fail silently but log the error
      metadata.metadataError = error.message;
    }

    return metadata;
  }

  /**
   * Collect metadata about the current context (legacy method for backward compatibility)
   * @returns {Object} Metadata object
   * @private
   */
  _collectMetadata() {
    return this._collectEnhancedMetadata();
  }

  /**
   * Categorize log entry for AI analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Log arguments
   * @returns {string} Category
   * @private
   */
  _categorizeLog(level, message, _args) {
    const lowerMessage = message.toLowerCase();

    // Error categorization
    if (level === 'error') {
      if (
        lowerMessage.includes('syntaxerror') ||
        lowerMessage.includes('unexpected token')
      ) {
        return 'syntax_error';
      }
      if (
        lowerMessage.includes('typeerror') ||
        lowerMessage.includes('referenceerror')
      ) {
        return 'runtime_error';
      }
      if (
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('network') ||
        lowerMessage.includes('xhr') ||
        lowerMessage.includes('ajax')
      ) {
        return 'network_error';
      }
      if (
        lowerMessage.includes('permission') ||
        lowerMessage.includes('security') ||
        lowerMessage.includes('cors') ||
        lowerMessage.includes('csp')
      ) {
        return 'security_error';
      }
      if (
        lowerMessage.includes('performance') ||
        lowerMessage.includes('memory') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('slow')
      ) {
        return 'performance_error';
      }
      return 'runtime_error'; // Default for errors
    }

    // Warning categorization
    if (level === 'warn') {
      if (
        lowerMessage.includes('deprecated') ||
        lowerMessage.includes('obsolete')
      ) {
        return 'deprecation_warning';
      }
      if (
        lowerMessage.includes('performance') ||
        lowerMessage.includes('slow')
      ) {
        return 'performance_warning';
      }
      return 'general_warning';
    }

    // Info and debug categorization
    if (level === 'info') {
      if (
        lowerMessage.includes('api') ||
        lowerMessage.includes('request') ||
        lowerMessage.includes('response')
      ) {
        return 'api_info';
      }
      if (
        lowerMessage.includes('user') ||
        lowerMessage.includes('click') ||
        lowerMessage.includes('interaction')
      ) {
        return 'user_action';
      }
      return 'general_info';
    }

    return 'general_log';
  }

  /**
   * Calculate severity level for AI analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Log arguments
   * @returns {Object} Severity information
   * @private
   */
  _calculateSeverity(level, message, _args) {
    const lowerMessage = message.toLowerCase();

    // Base severity by log level
    const baseSeverity = {
      error: { level: 'high', score: 8 },
      warn: { level: 'medium', score: 5 },
      info: { level: 'low', score: 2 },
      log: { level: 'low', score: 1 },
      debug: { level: 'low', score: 1 },
    }[level] || { level: 'low', score: 1 };

    // Adjust severity based on content
    let adjustedScore = baseSeverity.score;

    if (level === 'error') {
      // Critical errors
      if (
        lowerMessage.includes('uncaught') ||
        lowerMessage.includes('fatal') ||
        lowerMessage.includes('critical') ||
        lowerMessage.includes('crash')
      ) {
        adjustedScore = 10;
      }
      // Security errors
      else if (
        lowerMessage.includes('security') ||
        lowerMessage.includes('xss') ||
        lowerMessage.includes('csrf') ||
        lowerMessage.includes('injection')
      ) {
        adjustedScore = 9;
      }
      // Network errors
      else if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection')
      ) {
        adjustedScore = 7;
      }
    }

    // Determine final severity level
    let finalLevel = 'low';
    if (adjustedScore >= 8) finalLevel = 'critical';
    else if (adjustedScore >= 6) finalLevel = 'high';
    else if (adjustedScore >= 4) finalLevel = 'medium';

    return {
      level: finalLevel,
      score: adjustedScore,
      description: this._getSeverityDescription(finalLevel),
    };
  }

  /**
   * Get severity description for AI understanding
   * @param {string} level - Severity level
   * @returns {string} Description
   * @private
   */
  _getSeverityDescription(level) {
    const descriptions = {
      critical: 'Requires immediate attention - may cause application failure',
      high: 'Important issue that should be addressed soon',
      medium: 'Moderate issue that should be investigated',
      low: 'Informational - no immediate action required',
    };
    return descriptions[level] || descriptions.low;
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

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   * @private
   */
  _generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `clp_${timestamp}_${random}`;
  }

  /**
   * Get application-specific port (3001-3100 range)
   * @param {string} applicationName - Application name
   * @returns {number} Port number
   * @private
   */
  _getApplicationPort(applicationName) {
    // Simple hash function to assign consistent ports
    let hash = 0;
    for (let i = 0; i < applicationName.length; i++) {
      const char = applicationName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Map to port range 3001-3100
    return 3001 + (Math.abs(hash) % 100);
  }

  /**
   * Detect current environment
   * @returns {string} Environment name
   * @private
   */
  _detectEnvironment() {
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      if (hostname?.includes('staging') || hostname?.includes('dev')) {
        return 'staging';
      }
      return 'production';
    }
    return 'development';
  }

  /**
   * Detect developer name from various sources
   * @returns {string|null} Developer name
   * @private
   */
  _detectDeveloper() {
    // In browser environment, we can't access git config
    // This would be enhanced in a Node.js environment
    if (typeof window !== 'undefined') {
      // Try to get from localStorage or sessionStorage
      const stored =
        localStorage?.getItem('console-log-pipe-developer') ||
        sessionStorage?.getItem('console-log-pipe-developer');
      if (stored) return stored;
    }
    return null;
  }

  /**
   * Detect current git branch
   * @returns {string|null} Branch name
   * @private
   */
  _detectBranch() {
    // In browser environment, we can't access git directly
    // This would be enhanced in a Node.js environment or with build-time injection
    if (typeof window !== 'undefined') {
      // Try to get from build-time environment variables
      const branch =
        window.__GIT_BRANCH__ ||
        localStorage?.getItem('console-log-pipe-branch');
      if (branch) return branch;
    }
    return null;
  }

  /**
   * Generate AI-friendly tags for log analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Log arguments
   * @returns {Array} Array of tags
   * @private
   */
  _generateAITags(level, message, _args) {
    const tags = [level]; // Always include log level
    const lowerMessage = message.toLowerCase();

    // Technology tags
    if (lowerMessage.includes('react') || lowerMessage.includes('jsx'))
      tags.push('react');
    if (lowerMessage.includes('vue') || lowerMessage.includes('vuejs'))
      tags.push('vue');
    if (lowerMessage.includes('angular')) tags.push('angular');
    if (
      lowerMessage.includes('api') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('xhr') ||
      lowerMessage.includes('ajax')
    )
      tags.push('api');
    if (lowerMessage.includes('websocket') || lowerMessage.includes('ws'))
      tags.push('websocket');
    if (lowerMessage.includes('database') || lowerMessage.includes('sql'))
      tags.push('database');

    // Error type tags
    if (level === 'error') {
      if (lowerMessage.includes('typeerror')) tags.push('type-error');
      if (lowerMessage.includes('referenceerror')) tags.push('reference-error');
      if (lowerMessage.includes('syntaxerror')) tags.push('syntax-error');
      if (lowerMessage.includes('rangeerror')) tags.push('range-error');
      if (lowerMessage.includes('urierror')) tags.push('uri-error');
    }

    // Feature tags
    if (
      lowerMessage.includes('auth') ||
      lowerMessage.includes('login') ||
      lowerMessage.includes('token')
    )
      tags.push('authentication');
    if (lowerMessage.includes('permission') || lowerMessage.includes('access'))
      tags.push('authorization');
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid'))
      tags.push('validation');
    if (
      lowerMessage.includes('performance') ||
      lowerMessage.includes('slow') ||
      lowerMessage.includes('timeout')
    )
      tags.push('performance');
    if (lowerMessage.includes('memory') || lowerMessage.includes('leak'))
      tags.push('memory');
    if (
      lowerMessage.includes('security') ||
      lowerMessage.includes('xss') ||
      lowerMessage.includes('csrf') ||
      lowerMessage.includes('cors')
    )
      tags.push('security');

    // User interaction tags
    if (lowerMessage.includes('click') || lowerMessage.includes('button'))
      tags.push('user-interaction');
    if (lowerMessage.includes('form') || lowerMessage.includes('input'))
      tags.push('form');
    if (lowerMessage.includes('navigation') || lowerMessage.includes('route'))
      tags.push('navigation');

    // Environment tags
    tags.push(`env:${this.options.environment}`);
    tags.push(`app:${this.options.applicationName}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Analyze error for AI-friendly insights
   * @param {string} message - Error message
   * @param {Array} args - Error arguments
   * @returns {Object} Error analysis
   * @private
   */
  _analyzeError(message, _args) {
    const lowerMessage = message.toLowerCase();
    const analysis = {
      type: 'unknown',
      cause: 'unknown',
      suggestions: [],
      recoverable: false,
      impact: 'medium',
    };

    // Analyze error type and provide suggestions
    if (lowerMessage.includes('typeerror')) {
      analysis.type = 'TypeError';
      analysis.cause =
        'Attempting to use a value as a different type than expected';
      analysis.suggestions = [
        'Check if the variable is defined before using it',
        'Verify the data type matches the expected type',
        'Add null/undefined checks',
        'Use optional chaining (?.) for object properties',
      ];
      analysis.recoverable = true;
      analysis.impact = 'high';
    } else if (lowerMessage.includes('referenceerror')) {
      analysis.type = 'ReferenceError';
      analysis.cause = 'Trying to access a variable that is not defined';
      analysis.suggestions = [
        'Check if the variable is declared',
        'Verify the variable scope',
        'Check for typos in variable names',
        'Ensure imports/requires are correct',
      ];
      analysis.recoverable = true;
      analysis.impact = 'high';
    } else if (lowerMessage.includes('syntaxerror')) {
      analysis.type = 'SyntaxError';
      analysis.cause = 'Invalid JavaScript syntax';
      analysis.suggestions = [
        'Check for missing brackets, parentheses, or semicolons',
        'Verify proper string quoting',
        'Check for invalid characters',
        'Use a linter to identify syntax issues',
      ];
      analysis.recoverable = false;
      analysis.impact = 'critical';
    } else if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch')
    ) {
      analysis.type = 'NetworkError';
      analysis.cause = 'Network request failed';
      analysis.suggestions = [
        'Check internet connectivity',
        'Verify API endpoint URL',
        'Check CORS configuration',
        'Add retry logic for failed requests',
        'Implement proper error handling',
      ];
      analysis.recoverable = true;
      analysis.impact = 'medium';
    }

    return analysis;
  }

  /**
   * Initialize error categorization system
   * @returns {Object} Error categories
   * @private
   */
  _initializeErrorCategories() {
    return {
      syntax_error: 'Code syntax issues',
      runtime_error: 'Runtime execution errors',
      network_error: 'API/network connectivity issues',
      user_error: 'User input or interaction errors',
      system_error: 'Browser/system level errors',
      performance_error: 'Performance degradation issues',
      security_error: 'Security or permission errors',
    };
  }

  /**
   * Collect performance metrics for AI analysis
   * @returns {Object} Performance metrics
   * @private
   */
  _collectPerformanceMetrics() {
    const metrics = {};

    try {
      // Memory information
      if (performance.memory) {
        metrics.memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          usage: Math.round(
            (performance.memory.usedJSHeapSize /
              performance.memory.totalJSHeapSize) *
              100
          ),
        };
      }

      // Timing information
      if (performance.now) {
        metrics.timing = {
          now: performance.now(),
          timeOrigin: performance.timeOrigin,
        };
      }

      // Navigation timing
      if (performance.getEntriesByType) {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          metrics.navigation = {
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            firstPaint: navigation.responseEnd - navigation.requestStart,
          };
        }
      }

      // Resource timing summary
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        if (resources.length > 0) {
          const totalDuration = resources.reduce(
            (sum, resource) => sum + resource.duration,
            0
          );
          metrics.resources = {
            count: resources.length,
            averageDuration: Math.round(totalDuration / resources.length),
            totalDuration: Math.round(totalDuration),
          };
        }
      }
    } catch (error) {
      metrics.error = 'Performance metrics collection failed';
    }

    return metrics;
  }

  /**
   * Parse stack trace for AI-friendly format
   * @param {string} stack - Stack trace string
   * @returns {Object} Parsed stack trace
   * @private
   */
  _parseStackTrace(stack) {
    if (!stack) return null;

    try {
      const lines = stack.split('\n').slice(1); // Remove first line (error message)
      const frames = lines
        .map(line => {
          const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
          if (match) {
            return {
              function: match[1],
              file: match[2],
              line: parseInt(match[3]),
              column: parseInt(match[4]),
            };
          }
          return { raw: line.trim() };
        })
        .filter(frame => frame.function || frame.raw);

      return {
        frames: frames.slice(0, 10), // Limit to top 10 frames
        raw: stack,
      };
    } catch (error) {
      return { raw: stack, parseError: error.message };
    }
  }

  /**
   * Log session information to console for manual inspection
   * @private
   */
  _logSessionInfo() {
    if (this.options.preserveOriginal && typeof console !== 'undefined') {
      const sessionInfo = {
        applicationName: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
        serverPort: this.options.serverPort,
      };

      console.log(
        '%c🔍 Console Log Pipe Session Started',
        'color: #4CAF50; font-weight: bold; font-size: 14px;',
        sessionInfo
      );
    }
  }
}

export default LogCapture;
