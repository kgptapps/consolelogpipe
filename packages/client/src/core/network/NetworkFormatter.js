/**
 * NetworkFormatter - Format network data into AI-friendly structures
 */

const NetworkUtils = require('./NetworkUtils');
const NetworkSanitizer = require('./NetworkSanitizer');
const NetworkAnalyzer = require('./NetworkAnalyzer');

class NetworkFormatter {
  constructor(options = {}) {
    this.options = {
      applicationName: options.applicationName,
      sessionId: options.sessionId,
      environment: options.environment || 'development',
      developer: options.developer,
      branch: options.branch,
      enableNetworkAnalysis: options.enableNetworkAnalysis !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      ...options,
    };

    this.sanitizer = new NetworkSanitizer(options);
    this.analyzer = new NetworkAnalyzer(options);
  }

  /**
   * Create structured request entry with AI-friendly format
   * @param {string} requestId - Unique request ID
   * @param {Object} requestData - Request data
   * @returns {Object} Formatted request entry
   */
  createRequestEntry(requestId, requestData) {
    const timestamp = new Date().toISOString();

    return {
      // Core network information
      id: requestId,
      timestamp,
      type: 'network',
      subtype: 'request',
      level: 'info',

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
      },

      // Request details
      request: {
        id: requestId,
        url: requestData.url,
        method: requestData.method.toUpperCase(),
        headers: this.sanitizer.sanitizeHeaders(requestData.headers),
        body: this.sanitizer.sanitizeBody(requestData.body),
        type: requestData.type, // 'fetch' or 'xhr'
        timestamp: requestData.startTime,
      },

      // AI-friendly categorization
      category: this.analyzer.categorizeRequest(requestData),
      tags: this.analyzer.generateRequestTags(requestData),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? NetworkUtils.collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this.analyzer.analyzeRequest(requestData)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create structured response entry with AI-friendly format
   * @param {string} requestId - Request ID
   * @param {Response} response - Response object
   * @param {Object} timing - Timing information
   * @returns {Object} Formatted response entry
   */
  async createResponseEntry(requestId, response, timing) {
    const timestamp = new Date().toISOString();
    const duration = timing.endTime - timing.startTime;

    // Clone response to read body without consuming it
    const responseClone = response.clone();
    let responseBody = null;

    try {
      if (
        this.options.captureResponseBody &&
        NetworkUtils.shouldCaptureResponseBody(response)
      ) {
        responseBody = await responseClone.text();
      }
    } catch (error) {
      // Ignore body reading errors
      responseBody = `[Error reading response body: ${error.message}]`;
    }

    return {
      // Core network information
      id: `${requestId}_response`,
      timestamp,
      type: 'network',
      subtype: 'response',
      level: NetworkUtils.getResponseLevel(response.status),

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
      },

      // Response details
      response: {
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: this.sanitizer.sanitizeHeaders(
          NetworkUtils.getResponseHeaders(response)
        ),
        body: this.sanitizer.sanitizeBody(responseBody),
        url: timing.url,
        method: timing.method,
        timestamp: timing.endTime,
      },

      // Timing information
      timing: {
        start: timing.startTime,
        end: timing.endTime,
        duration,
        durationMs: Math.round(duration * 100) / 100,
      },

      // AI-friendly categorization
      category: this.analyzer.categorizeResponse(response, timing),
      severity: this.analyzer.calculateResponseSeverity(response, timing),
      tags: this.analyzer.generateResponseTags(response, timing),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? NetworkUtils.collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this.analyzer.analyzeResponse(response, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create XMLHttpRequest response entry
   * @param {string} requestId - Request ID
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Object} Formatted XHR response entry
   */
  createXHRResponseEntry(requestId, xhr, timing) {
    const timestamp = new Date().toISOString();
    const duration = timing.endTime - timing.startTime;

    let responseBody = null;
    if (
      this.options.captureResponseBody &&
      NetworkUtils.shouldCaptureXHRResponseBody(xhr)
    ) {
      responseBody = xhr.responseText;
    }

    return {
      // Core network information
      id: `${requestId}_response`,
      timestamp,
      type: 'network',
      subtype: 'response',
      level: NetworkUtils.getResponseLevel(xhr.status),

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
      },

      // Response details
      response: {
        requestId,
        status: xhr.status,
        statusText: xhr.statusText,
        responseType: xhr.responseType || 'text',
        headers: this.sanitizer.sanitizeHeaders(
          NetworkUtils.getXHRResponseHeaders(xhr)
        ),
        body: this.sanitizer.sanitizeBody(responseBody),
        url: timing.url,
        method: timing.method,
        timestamp: timing.endTime,
      },

      // Timing information
      timing: {
        start: timing.startTime,
        end: timing.endTime,
        duration,
        durationMs: Math.round(duration * 100) / 100,
      },

      // AI-friendly categorization
      category: this.analyzer.categorizeXHRResponse(xhr, timing),
      severity: this.analyzer.calculateXHRResponseSeverity(xhr, timing),
      tags: this.analyzer.generateXHRResponseTags(xhr, timing),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? NetworkUtils.collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this.analyzer.analyzeXHRResponse(xhr, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create error entry for failed network requests
   * @param {string} requestId - Request ID
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Formatted error entry
   */
  createErrorEntry(requestId, error, timing) {
    const timestamp = new Date().toISOString();
    const duration = timing.endTime - timing.startTime;

    return {
      // Core network information
      id: `${requestId}_error`,
      timestamp,
      type: 'network',
      subtype: 'error',
      level: 'error',

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
      },

      // Error details
      error: {
        requestId,
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: timing.url,
        method: timing.method,
        timestamp: timing.endTime,
      },

      // Timing information
      timing: {
        start: timing.startTime,
        end: timing.endTime,
        duration,
        durationMs: Math.round(duration * 100) / 100,
      },

      // AI-friendly categorization
      category: this.analyzer.categorizeNetworkError(error, timing),
      severity: this.analyzer.calculateErrorSeverity(error, timing),
      tags: this.analyzer.generateErrorTags(error, timing),

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this.analyzer.analyzeNetworkError(error, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: Date.now(),
      },
    };
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = NetworkFormatter;
}
