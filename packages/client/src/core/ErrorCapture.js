/**
 * ErrorCapture - Comprehensive error capture for unhandled errors and promise rejections
 *
 * This module captures unhandled JavaScript errors and promise rejections,
 * processes stack traces, and provides AI-friendly error categorization.
 */

class ErrorCapture {
  constructor(options = {}) {
    this.options = {
      captureUnhandledErrors: true,
      capturePromiseRejections: true,
      captureStackTraces: true,
      maxStackDepth: 50,
      enableSourceMaps: false, // Future feature

      // AI-friendly error categorization
      enableErrorCategorization: options.enableErrorCategorization !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,

      // Application context (required for multi-app support)
      applicationName: options.applicationName,
      sessionId: options.sessionId,
      environment: options.environment || 'development',
      developer: options.developer,
      branch: options.branch,

      // Server configuration
      serverPort: options.serverPort || 3001,
      serverHost: options.serverHost || 'localhost',

      ...options,
    };

    this.listeners = new Set();
    this.errorQueue = [];
    this.originalHandlers = {};
    this.isCapturing = false;
  }

  /**
   * Start error capture
   */
  start() {
    if (this.isCapturing) {
      return;
    }

    this._setupErrorHandlers();
    this.isCapturing = true;
  }

  /**
   * Stop error capture and restore original handlers
   */
  stop() {
    if (!this.isCapturing) {
      return;
    }

    this._restoreErrorHandlers();
    this.isCapturing = false;
  }

  /**
   * Add a listener for captured errors
   * @param {Function} listener - Function to call with captured error data
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
   * Get current error queue
   * @returns {Array} Array of captured errors
   */
  getErrors() {
    return [...this.errorQueue];
  }

  /**
   * Clear the error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Setup error handlers for window.onerror and unhandled promise rejections
   * @private
   */
  _setupErrorHandlers() {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }

    // Capture unhandled JavaScript errors
    if (this.options.captureUnhandledErrors) {
      this.originalHandlers.onerror = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        this._handleError({
          type: 'javascript',
          message,
          source,
          lineno,
          colno,
          error,
          timestamp: new Date().toISOString(),
        });

        // Call original handler if it exists
        if (this.originalHandlers.onerror) {
          return this.originalHandlers.onerror(
            message,
            source,
            lineno,
            colno,
            error
          );
        }
        return false;
      };
    }

    // Capture unhandled promise rejections
    if (this.options.capturePromiseRejections) {
      this.originalHandlers.onunhandledrejection = window.onunhandledrejection;
      window.addEventListener('unhandledrejection', event => {
        this._handlePromiseRejection(event);
      });
    }
  }

  /**
   * Restore original error handlers
   * @private
   */
  _restoreErrorHandlers() {
    if (typeof window === 'undefined') {
      return;
    }

    // Restore window.onerror
    if (this.originalHandlers.onerror !== undefined) {
      window.onerror = this.originalHandlers.onerror;
    }

    // Restore unhandled rejection handler
    if (this.originalHandlers.onunhandledrejection !== undefined) {
      window.onunhandledrejection = this.originalHandlers.onunhandledrejection;
    }

    this.originalHandlers = {};
  }

  /**
   * Handle JavaScript errors
   * @param {Object} errorData - Error information
   * @private
   */
  _handleError(errorData) {
    try {
      const errorEntry = this._createErrorEntry('javascript', errorData);
      this.errorQueue.push(errorEntry);
      this._notifyListeners(errorEntry);
    } catch (processingError) {
      // Avoid infinite loops - log processing error to console only
      // eslint-disable-next-line no-console
      console.error('ErrorCapture: Failed to process error', processingError);
    }
  }

  /**
   * Handle promise rejections
   * @param {PromiseRejectionEvent} event - Promise rejection event
   * @private
   */
  _handlePromiseRejection(event) {
    try {
      const errorData = {
        type: 'promise',
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString(),
      };

      const errorEntry = this._createErrorEntry('promise', errorData);
      this.errorQueue.push(errorEntry);
      this._notifyListeners(errorEntry);
    } catch (processingError) {
      // eslint-disable-next-line no-console
      console.error(
        'ErrorCapture: Failed to process promise rejection',
        processingError
      );
    }
  }

  /**
   * Create structured error entry with AI-friendly format
   * @param {string} type - Error type (javascript, promise)
   * @param {Object} errorData - Raw error data
   * @returns {Object} Structured error entry
   * @private
   */
  _createErrorEntry(type, errorData) {
    const timestamp = errorData.timestamp || new Date().toISOString();

    // Extract error message
    const message = this._extractErrorMessage(type, errorData);

    // Process stack trace
    const stackTrace = this._processStackTrace(errorData);

    // Create AI-friendly structured error entry
    const errorEntry = {
      // Core error information
      id: this._generateErrorId(),
      timestamp,
      type: 'error',
      subtype: type,
      level: 'error',
      message,

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
        port: this.options.serverPort,
      },

      // Error details
      error: {
        name: this._getErrorName(errorData),
        message,
        stack: stackTrace.formatted,
        source: errorData.source || null,
        line: errorData.lineno || null,
        column: errorData.colno || null,
        originalError: this._serializeError(
          errorData.error || errorData.reason
        ),
      },

      // AI-friendly categorization
      category: this._categorizeError(type, message, errorData),
      severity: this._calculateErrorSeverity(type, message, errorData),
      tags: this._generateErrorTags(type, message, errorData),

      // Performance metrics (if enabled)
      performance: this.options.enablePerformanceTracking
        ? this._collectPerformanceMetrics()
        : null,

      // Error analysis for AI
      analysis: {
        recoverable: this._isRecoverable(type, message, errorData),
        impact: this._assessImpact(type, message, errorData),
        suggestions: this._generateRecoverySuggestions(
          type,
          message,
          errorData
        ),
      },

      // Stack trace details
      stackTrace: stackTrace.parsed,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        timestamp: Date.now(),
      },
    };

    return errorEntry;
  }

  /**
   * Extract error message from error data
   * @param {string} type - Error type
   * @param {Object} errorData - Error data
   * @returns {string} Error message
   * @private
   */
  _extractErrorMessage(type, errorData) {
    if (type === 'javascript') {
      return errorData.message || 'Unknown JavaScript error';
    } else if (type === 'promise') {
      if (errorData.reason instanceof Error) {
        return errorData.reason.message || errorData.reason.toString();
      }
      return String(errorData.reason || 'Unknown promise rejection');
    }
    return 'Unknown error';
  }

  /**
   * Get error name from error data
   * @param {Object} errorData - Error data
   * @returns {string} Error name
   * @private
   */
  _getErrorName(errorData) {
    if (errorData.error && errorData.error.name) {
      return errorData.error.name;
    }
    if (errorData.reason instanceof Error && errorData.reason.name) {
      return errorData.reason.name;
    }
    return 'Error';
  }

  /**
   * Process and format stack trace
   * @param {Object} errorData - Error data
   * @returns {Object} Processed stack trace
   * @private
   */
  _processStackTrace(errorData) {
    const error = errorData.error || errorData.reason;

    if (!error || !error.stack) {
      return {
        formatted: null,
        parsed: [],
      };
    }

    const stackLines = error.stack.split('\n');
    const parsed = [];

    for (
      let i = 0;
      i < Math.min(stackLines.length, this.options.maxStackDepth);
      i++
    ) {
      const line = stackLines[i].trim();
      if (line) {
        const parsedFrame = this._parseStackFrame(line);
        if (parsedFrame) {
          parsed.push(parsedFrame);
        }
      }
    }

    return {
      formatted: error.stack,
      parsed,
    };
  }

  /**
   * Parse individual stack frame
   * @param {string} frame - Stack frame string
   * @returns {Object|null} Parsed frame or null
   * @private
   */
  _parseStackFrame(frame) {
    // Basic stack frame parsing - can be enhanced for different browsers
    const match = frame.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1] || 'anonymous',
        file: match[2],
        line: parseInt(match[3], 10),
        column: parseInt(match[4], 10),
      };
    }

    // Alternative format
    const simpleMatch = frame.match(/at\s+(.+?):(\d+):(\d+)/);
    if (simpleMatch) {
      return {
        function: 'anonymous',
        file: simpleMatch[1],
        line: parseInt(simpleMatch[2], 10),
        column: parseInt(simpleMatch[3], 10),
      };
    }

    return null;
  }

  /**
   * Serialize error object for JSON transmission
   * @param {Error|any} error - Error object or value
   * @returns {Object} Serialized error
   * @private
   */
  _serializeError(error) {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
          if (key !== 'name' && key !== 'message' && key !== 'stack') {
            acc[key] = error[key];
          }
          return acc;
        }, {}),
      };
    }

    // For non-Error objects, try to serialize safely
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  /**
   * Categorize error for AI analysis
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {string} Error category
   * @private
   */
  _categorizeError(type, message, _errorData) {
    const lowerMessage = message.toLowerCase();

    // Network-related errors
    if (
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('cors') ||
      lowerMessage.includes('xhr')
    ) {
      return 'Network Error';
    }

    // Syntax errors
    if (
      lowerMessage.includes('syntax') ||
      lowerMessage.includes('unexpected token')
    ) {
      return 'Syntax Error';
    }

    // Type errors (check before reference errors since they can overlap)
    if (
      lowerMessage.includes('cannot read property') ||
      lowerMessage.includes('is not a function')
    ) {
      return 'Type Error';
    }

    // Reference errors
    if (
      lowerMessage.includes('is not defined') ||
      lowerMessage.includes('undefined')
    ) {
      return 'Reference Error';
    }

    // Promise-related errors
    if (type === 'promise') {
      return 'Promise Rejection';
    }

    return 'Runtime Error';
  }

  /**
   * Calculate error severity
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {Object} Severity information
   * @private
   */
  _calculateErrorSeverity(type, message, errorData) {
    const lowerMessage = message.toLowerCase();
    let score = 5; // Default medium severity

    // High severity indicators
    if (
      lowerMessage.includes('security') ||
      lowerMessage.includes('cors') ||
      lowerMessage.includes('permission') ||
      lowerMessage.includes('unauthorized')
    ) {
      score = 9;
    }
    // Network errors are often critical
    else if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch failed')
    ) {
      score = 8;
    }
    // Syntax errors prevent execution
    else if (lowerMessage.includes('syntax')) {
      score = 8;
    }
    // Reference errors are serious
    else if (lowerMessage.includes('is not defined')) {
      score = 7;
    }
    // Type errors can break functionality
    else if (
      lowerMessage.includes('cannot read property') ||
      lowerMessage.includes('is not a function')
    ) {
      score = 6;
    }

    const levels = {
      1: 'low',
      2: 'low',
      3: 'low',
      4: 'medium',
      5: 'medium',
      6: 'medium',
      7: 'high',
      8: 'high',
      9: 'critical',
      10: 'critical',
    };

    return {
      level: levels[score] || 'medium',
      score,
      factors: this._getSeverityFactors(type, message, errorData),
    };
  }

  /**
   * Get severity factors for AI analysis
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {Array} Severity factors
   * @private
   */
  _getSeverityFactors(type, message, errorData) {
    const factors = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('security')) factors.push('security-related');
    if (lowerMessage.includes('network')) factors.push('network-failure');
    if (lowerMessage.includes('syntax')) factors.push('syntax-error');
    if (type === 'promise') factors.push('async-operation');
    if (errorData.source && errorData.source.includes('node_modules'))
      factors.push('third-party');

    return factors;
  }

  /**
   * Generate AI-friendly tags
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {Array} Tags array
   * @private
   */
  _generateErrorTags(type, message, _errorData) {
    const tags = ['error', type];
    const lowerMessage = message.toLowerCase();

    // Technology tags
    if (lowerMessage.includes('react')) tags.push('react');
    if (lowerMessage.includes('vue')) tags.push('vue');
    if (lowerMessage.includes('angular')) tags.push('angular');
    if (lowerMessage.includes('fetch') || lowerMessage.includes('xhr'))
      tags.push('http');
    if (lowerMessage.includes('websocket')) tags.push('websocket');

    // Error type tags
    if (lowerMessage.includes('cors')) tags.push('cors');
    if (lowerMessage.includes('timeout')) tags.push('timeout');
    if (lowerMessage.includes('permission')) tags.push('permission');

    // Environment tags
    if (this.options.environment) tags.push(this.options.environment);
    if (this.options.branch) tags.push(`branch:${this.options.branch}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Check if error is recoverable
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {boolean} Whether error is recoverable
   * @private
   */
  _isRecoverable(type, message, _errorData) {
    const lowerMessage = message.toLowerCase();

    // Non-recoverable errors
    if (lowerMessage.includes('syntax') || lowerMessage.includes('security')) {
      return false;
    }

    // Network errors might be recoverable with retry
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return true;
    }

    // Promise rejections are often recoverable
    if (type === 'promise') {
      return true;
    }

    return true; // Default to recoverable
  }

  /**
   * Assess error impact
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {string} Impact level
   * @private
   */
  _assessImpact(type, message, _errorData) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('security') || lowerMessage.includes('cors')) {
      return 'critical';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('api')) {
      return 'high';
    }
    if (lowerMessage.includes('ui') || lowerMessage.includes('render')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate recovery suggestions for AI
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} errorData - Error data
   * @returns {Array} Recovery suggestions
   * @private
   */
  _generateRecoverySuggestions(type, message, _errorData) {
    const suggestions = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('is not defined')) {
      suggestions.push('Check variable declaration and scope');
      suggestions.push('Verify import/export statements');
    }
    if (lowerMessage.includes('cannot read property')) {
      suggestions.push('Add null/undefined checks');
      suggestions.push('Use optional chaining (?.)');
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      suggestions.push('Implement retry logic');
      suggestions.push('Add network error handling');
      suggestions.push('Check API endpoint availability');
    }
    if (type === 'promise') {
      suggestions.push('Add .catch() handler');
      suggestions.push('Use try-catch with async/await');
    }

    return suggestions;
  }

  /**
   * Collect performance metrics
   * @returns {Object} Performance metrics
   * @private
   */
  _collectPerformanceMetrics() {
    if (typeof performance === 'undefined') {
      return null;
    }

    return {
      memory:
        typeof performance.memory !== 'undefined'
          ? {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit,
            }
          : null,
      timing: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin || Date.now(),
      },
    };
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error ID
   * @private
   */
  _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all listeners of captured error
   * @param {Object} errorEntry - Error entry to send to listeners
   * @private
   */
  _notifyListeners(errorEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(errorEntry);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('ErrorCapture: Listener error', error);
      }
    });
  }
}

// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = ErrorCapture;
}
