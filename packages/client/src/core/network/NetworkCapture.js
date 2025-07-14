/**
 * NetworkCapture - Comprehensive network request/response capture
 *
 * This module intercepts fetch API and XMLHttpRequest calls to capture
 * network activity with AI-friendly analysis and configurable filtering.
 */

const NetworkUtils = require('./NetworkUtils');
// eslint-disable-next-line no-unused-vars
const NetworkSanitizer = require('./NetworkSanitizer');
// eslint-disable-next-line no-unused-vars
const NetworkAnalyzer = require('./NetworkAnalyzer');
const NetworkFormatter = require('./NetworkFormatter');
const NetworkInterceptor = require('./NetworkInterceptor');

class NetworkCapture {
  constructor(options = {}) {
    this.options = {
      captureFetch: true,
      captureXHR: true,
      captureHeaders: true,
      captureRequestBody: true,
      captureResponseBody: true,
      maxBodySize: 50 * 1024, // 50KB max body size
      maxHeaderSize: 10 * 1024, // 10KB max headers

      // AI-friendly network analysis
      enableNetworkAnalysis: options.enableNetworkAnalysis !== false,
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

      // Filtering and sanitization
      sensitiveHeaders: [
        'authorization',
        'cookie',
        'set-cookie',
        'x-api-key',
        'x-auth-token',
        'x-access-token',
        'bearer',
        'basic',
      ],

      excludeUrls: [
        // Exclude Console Log Pipe's own requests to prevent infinite loops
        /localhost:\d+\/api\/logs/,
        /127\.0\.0\.1:\d+\/api\/logs/,
        // Common development/monitoring URLs to exclude
        /webpack-dev-server/,
        /hot-update/,
        /__webpack_hmr/,
        /sockjs-node/,
        /favicon\.ico/,
      ],

      includeUrls: [], // If specified, only URLs matching these patterns will be captured

      // URL filtering (can be overridden by options)
      urlFilters: options.urlFilters || {},

      ...options,
    };

    // Merge URL filters
    if (this.options.urlFilters.exclude) {
      this.options.excludeUrls = [
        ...this.options.excludeUrls,
        ...this.options.urlFilters.exclude,
      ];
    }
    if (this.options.urlFilters.include) {
      this.options.includeUrls = this.options.urlFilters.include;
    }

    // Initialize components
    this.utils = NetworkUtils;
    this.sanitizer = new NetworkSanitizer(this.options);
    this.analyzer = new NetworkAnalyzer(this.options);
    this.formatter = new NetworkFormatter(this.options);
    this.interceptor = new NetworkInterceptor(
      this.options,
      this.formatter,
      this._notifyListeners.bind(this)
    );

    // State management
    this.isCapturing = false;
    this.listeners = new Set();
    this.networkQueue = [];

    // Store original methods for backward compatibility
    this.originalFetch = null;
    this.originalXHROpen = null;
    this.originalXHRSend = null;
  }

  /**
   * Start network capture
   */
  start() {
    if (this.isCapturing) {
      return;
    }

    // Store original methods for backward compatibility
    if (typeof window !== 'undefined') {
      this.originalFetch = window.fetch;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
    }

    this.interceptor.setupInterception();
    this.isCapturing = true;
  }

  /**
   * Stop network capture and restore original methods
   */
  stop() {
    if (!this.isCapturing) {
      return;
    }

    this.interceptor.restoreOriginalMethods();
    this.isCapturing = false;
  }

  /**
   * Add a listener for captured network data
   * @param {Function} listener - Function to call with captured network data
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
   * Get current network queue
   * @returns {Array} Array of captured network requests
   */
  getNetworkData() {
    return [...this.networkQueue];
  }

  /**
   * Clear the network queue
   */
  clearNetworkData() {
    this.networkQueue = [];
  }

  /**
   * Notify all listeners with captured data
   * @param {Object} data - Captured network data
   * @private
   */
  _notifyListeners(data) {
    // Add to queue
    this.networkQueue.push(data);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('NetworkCapture: Listener error', error);
      }
    });
  }

  // Legacy method aliases for backward compatibility
  _shouldCaptureUrl(url) {
    return NetworkUtils.shouldCaptureUrl(url, this.options);
  }

  _generateRequestId() {
    return NetworkUtils.generateRequestId();
  }

  _createRequestEntry(requestId, requestData) {
    return this.formatter.createRequestEntry(requestId, requestData);
  }

  async _createResponseEntry(requestId, response, timing) {
    return await this.formatter.createResponseEntry(
      requestId,
      response,
      timing
    );
  }

  _createXHRResponseEntry(requestId, xhr, timing) {
    return this.formatter.createXHRResponseEntry(requestId, xhr, timing);
  }

  _createErrorEntry(requestId, error, timing) {
    return this.formatter.createErrorEntry(requestId, error, timing);
  }

  _headersToObject(headers) {
    return NetworkUtils.headersToObject(headers);
  }

  _getResponseHeaders(response) {
    return NetworkUtils.getResponseHeaders(response);
  }

  _getXHRHeaders(xhr) {
    return NetworkUtils.getXHRHeaders(xhr);
  }

  _getXHRResponseHeaders(xhr) {
    return NetworkUtils.getXHRResponseHeaders(xhr);
  }

  _shouldCaptureResponseBody(response) {
    return NetworkUtils.shouldCaptureResponseBody(response);
  }

  _shouldCaptureXHRResponseBody(xhr) {
    return NetworkUtils.shouldCaptureXHRResponseBody(xhr);
  }

  _getResponseLevel(status) {
    return NetworkUtils.getResponseLevel(status);
  }

  _categorizeRequest(requestData) {
    return this.formatter.analyzer.categorizeRequest(requestData);
  }

  _categorizeResponse(response, timing) {
    return this.formatter.analyzer.categorizeResponse(response, timing);
  }

  _categorizeXHRResponse(xhr, timing) {
    return this.formatter.analyzer.categorizeXHRResponse(xhr, timing);
  }

  _categorizeNetworkError(error, timing) {
    return this.formatter.analyzer.categorizeNetworkError(error, timing);
  }

  _calculateResponseSeverity(response, timing) {
    return this.formatter.analyzer.calculateResponseSeverity(response, timing);
  }

  _calculateXHRResponseSeverity(xhr, timing) {
    return this.formatter.analyzer.calculateXHRResponseSeverity(xhr, timing);
  }

  _calculateErrorSeverity(error, timing) {
    return this.formatter.analyzer.calculateErrorSeverity(error, timing);
  }

  _generateRequestTags(requestData) {
    return this.formatter.analyzer.generateRequestTags(requestData);
  }

  _generateResponseTags(response, timing) {
    return this.formatter.analyzer.generateResponseTags(response, timing);
  }

  _generateXHRResponseTags(xhr, timing) {
    return this.formatter.analyzer.generateXHRResponseTags(xhr, timing);
  }

  _generateErrorTags(error, timing) {
    return this.formatter.analyzer.generateErrorTags(error, timing);
  }

  _analyzeRequest(requestData) {
    return this.formatter.analyzer.analyzeRequest(requestData);
  }

  _analyzeResponse(response, timing) {
    return this.formatter.analyzer.analyzeResponse(response, timing);
  }

  _analyzeXHRResponse(xhr, timing) {
    return this.formatter.analyzer.analyzeXHRResponse(xhr, timing);
  }

  _analyzeNetworkError(error, timing) {
    return this.formatter.analyzer.analyzeNetworkError(error, timing);
  }

  _collectPerformanceMetrics() {
    return NetworkUtils.collectPerformanceMetrics();
  }

  _setupNetworkInterception() {
    this.interceptor.setupInterception();
  }

  _restoreNetworkMethods() {
    this.interceptor.restoreOriginalMethods();
  }

  _sanitizeHeaders(headers) {
    return this.sanitizer.sanitizeHeaders(headers, this.options);
  }

  _sanitizeBody(body) {
    return this.sanitizer.sanitizeBody(body);
  }

  _sanitizeUrl(url) {
    return this.sanitizer.sanitizeUrl(url);
  }

  // Placeholder methods for backward compatibility
  _detectRequestPatterns() {
    return [];
  }

  _suggestRequestOptimizations() {
    return [];
  }

  _analyzeRequestSecurity() {
    return {};
  }

  _detectResponsePatterns() {
    return [];
  }

  _suggestResponseOptimizations() {
    return [];
  }

  _analyzeResponsePerformance() {
    return {};
  }

  _detectXHRResponsePatterns() {
    return [];
  }

  _suggestXHRResponseOptimizations() {
    return [];
  }

  _analyzeXHRResponsePerformance() {
    return {};
  }

  _identifyErrorCause() {
    return 'Unknown';
  }

  _suggestErrorRecovery() {
    return [];
  }

  _suggestErrorPrevention() {
    return [];
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = NetworkCapture;
}
