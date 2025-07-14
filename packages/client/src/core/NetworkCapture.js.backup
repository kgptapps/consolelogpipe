/**
 * NetworkCapture - Comprehensive network request/response capture
 *
 * This module intercepts fetch API and XMLHttpRequest calls to capture
 * network activity with AI-friendly analysis and configurable filtering.
 */

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
        /analytics/,
        /tracking/,
      ],

      includeUrls: [], // If specified, only capture URLs matching these patterns

      ...options,
    };

    this.listeners = new Set();
    this.networkQueue = [];
    this.originalFetch = null;
    this.originalXHROpen = null;
    this.originalXHRSend = null;
    this.isCapturing = false;
    this.activeRequests = new Map(); // Track ongoing requests
  }

  /**
   * Start network capture
   */
  start() {
    if (this.isCapturing) {
      return;
    }

    this._setupNetworkInterception();
    this.isCapturing = true;
  }

  /**
   * Stop network capture and restore original methods
   */
  stop() {
    if (!this.isCapturing) {
      return;
    }

    this._restoreNetworkMethods();
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
   * Setup network interception for fetch and XMLHttpRequest
   * @private
   */
  _setupNetworkInterception() {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }

    // Intercept fetch API
    if (this.options.captureFetch && typeof window.fetch === 'function') {
      this._setupFetchInterception();
    }

    // Intercept XMLHttpRequest
    if (
      this.options.captureXHR &&
      typeof window.XMLHttpRequest === 'function'
    ) {
      this._setupXHRInterception();
    }
  }

  /**
   * Setup fetch API interception
   * @private
   */
  _setupFetchInterception() {
    this.originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const requestId = this._generateRequestId();
      const startTime = performance.now();

      try {
        // Parse request details
        const url = typeof input === 'string' ? input : input.url;
        const method = init.method || 'GET';

        // Check if URL should be captured
        if (!this._shouldCaptureUrl(url)) {
          return this.originalFetch.call(window, input, init);
        }

        // Capture request
        const requestData = this._createRequestEntry(requestId, {
          url,
          method,
          headers: init.headers || {},
          body: init.body,
          type: 'fetch',
          startTime,
        });

        this._notifyListeners(requestData);
        this.activeRequests.set(requestId, { startTime, url, method });

        // Make the actual request
        const response = await this.originalFetch.call(window, input, init);

        // Capture response
        const endTime = performance.now();
        const responseData = await this._createResponseEntry(
          requestId,
          response,
          {
            startTime,
            endTime,
            url,
            method,
          }
        );

        this._notifyListeners(responseData);
        this.activeRequests.delete(requestId);

        return response;
      } catch (error) {
        // Capture error
        const endTime = performance.now();
        const errorData = this._createErrorEntry(requestId, error, {
          startTime,
          endTime,
          url: typeof input === 'string' ? input : input.url,
          method: init.method || 'GET',
        });

        this._notifyListeners(errorData);
        this.activeRequests.delete(requestId);

        throw error;
      }
    };
  }

  /**
   * Setup XMLHttpRequest interception
   * @private
   */
  _setupXHRInterception() {
    const self = this;

    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      method,
      url,
      async = true,
      user,
      password
    ) {
      this._networkCapture = {
        requestId: self._generateRequestId(),
        method,
        url,
        async,
        startTime: null,
      };

      return self.originalXHROpen.call(
        this,
        method,
        url,
        async,
        user,
        password
      );
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (!this._networkCapture) {
        return self.originalXHRSend.call(this, body);
      }

      const { requestId, method, url } = this._networkCapture;

      // Check if URL should be captured
      if (!self._shouldCaptureUrl(url)) {
        return self.originalXHRSend.call(this, body);
      }

      const startTime = performance.now();
      this._networkCapture.startTime = startTime;

      // Capture request
      const requestData = self._createRequestEntry(requestId, {
        url,
        method,
        headers: self._getXHRHeaders(this),
        body,
        type: 'xhr',
        startTime,
      });

      self._notifyListeners(requestData);
      self.activeRequests.set(requestId, { startTime, url, method });

      // Setup response handlers
      const originalOnReadyStateChange = this.onreadystatechange;

      this.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          const endTime = performance.now();

          try {
            const responseData = self._createXHRResponseEntry(requestId, this, {
              startTime,
              endTime,
              url,
              method,
            });

            self._notifyListeners(responseData);
          } catch (error) {
            const errorData = self._createErrorEntry(requestId, error, {
              startTime,
              endTime,
              url,
              method,
            });

            self._notifyListeners(errorData);
          }

          self.activeRequests.delete(requestId);
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this);
        }
      };

      return self.originalXHRSend.call(this, body);
    };
  }

  /**
   * Restore original network methods
   * @private
   */
  _restoreNetworkMethods() {
    if (typeof window === 'undefined') {
      return;
    }

    // Restore fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // Restore XMLHttpRequest
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }

    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }
  }

  /**
   * Check if URL should be captured based on include/exclude patterns
   * @param {string} url - URL to check
   * @returns {boolean} Whether to capture this URL
   * @private
   */
  _shouldCaptureUrl(url) {
    // Check exclude patterns first
    for (const pattern of this.options.excludeUrls) {
      if (
        pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern)
      ) {
        return false;
      }
    }

    // If include patterns are specified, URL must match at least one
    if (this.options.includeUrls.length > 0) {
      return this.options.includeUrls.some(pattern =>
        pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern)
      );
    }

    return true;
  }

  /**
   * Generate unique request ID
   * @returns {string} Unique request ID
   * @private
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create structured request entry with AI-friendly format
   * @param {string} requestId - Unique request ID
   * @param {Object} requestData - Request data
   * @returns {Object} Structured request entry
   * @private
   */
  _createRequestEntry(requestId, requestData) {
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
        port: this.options.serverPort,
      },

      // Request details
      request: {
        id: requestId,
        url: requestData.url,
        method: requestData.method.toUpperCase(),
        headers: this._sanitizeHeaders(requestData.headers),
        body: this._sanitizeBody(requestData.body),
        type: requestData.type, // 'fetch' or 'xhr'
        timestamp: requestData.startTime,
      },

      // AI-friendly categorization
      category: this._categorizeRequest(requestData),
      tags: this._generateRequestTags(requestData),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? this._collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this._analyzeRequest(requestData)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create structured response entry with AI-friendly format
   * @param {string} requestId - Request ID
   * @param {Response} response - Fetch response object
   * @param {Object} timing - Timing information
   * @returns {Object} Structured response entry
   * @private
   */
  async _createResponseEntry(requestId, response, timing) {
    const timestamp = new Date().toISOString();
    const duration = timing.endTime - timing.startTime;

    // Clone response to read body without consuming it
    const responseClone = response.clone();
    let responseBody = null;

    try {
      if (
        this.options.captureResponseBody &&
        this._shouldCaptureResponseBody(response)
      ) {
        const text = await responseClone.text();
        responseBody = this._sanitizeBody(text);
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
      level: this._getResponseLevel(response.status),

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
        port: this.options.serverPort,
      },

      // Response details
      response: {
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: this._sanitizeHeaders(this._getResponseHeaders(response)),
        body: responseBody,
        url: response.url,
        type: response.type,
        redirected: response.redirected,
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
      category: this._categorizeResponse(response, timing),
      severity: this._calculateResponseSeverity(response, timing),
      tags: this._generateResponseTags(response, timing),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? this._collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this._analyzeResponse(response, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create XMLHttpRequest response entry
   * @param {string} requestId - Request ID
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Object} Structured response entry
   * @private
   */
  _createXHRResponseEntry(requestId, xhr, timing) {
    const timestamp = new Date().toISOString();
    const duration = timing.endTime - timing.startTime;

    let responseBody = null;
    if (
      this.options.captureResponseBody &&
      this._shouldCaptureXHRResponseBody(xhr)
    ) {
      responseBody = this._sanitizeBody(xhr.responseText || xhr.response);
    }

    return {
      // Core network information
      id: `${requestId}_response`,
      timestamp,
      type: 'network',
      subtype: 'response',
      level: this._getResponseLevel(xhr.status),

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
        port: this.options.serverPort,
      },

      // Response details
      response: {
        requestId,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: this._sanitizeHeaders(this._getXHRResponseHeaders(xhr)),
        body: responseBody,
        url: timing.url,
        responseType: xhr.responseType,
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
      category: this._categorizeXHRResponse(xhr, timing),
      severity: this._calculateXHRResponseSeverity(xhr, timing),
      tags: this._generateXHRResponseTags(xhr, timing),

      // Performance metrics
      performance: this.options.enablePerformanceTracking
        ? this._collectPerformanceMetrics()
        : null,

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this._analyzeXHRResponse(xhr, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create error entry for failed network requests
   * @param {string} requestId - Request ID
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Structured error entry
   * @private
   */
  _createErrorEntry(requestId, error, timing) {
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
        port: this.options.serverPort,
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
      category: this._categorizeNetworkError(error, timing),
      severity: this._calculateErrorSeverity(error, timing),
      tags: this._generateErrorTags(error, timing),

      // Network analysis for AI
      analysis: this.options.enableNetworkAnalysis
        ? this._analyzeNetworkError(error, timing)
        : null,

      // Metadata
      metadata: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Sanitize headers by removing sensitive information
   * @param {Object|Headers} headers - Headers to sanitize
   * @returns {Object} Sanitized headers
   * @private
   */
  _sanitizeHeaders(headers) {
    if (!this.options.captureHeaders) {
      return {};
    }

    const sanitized = {};
    const headersObj =
      headers instanceof Headers ? this._headersToObject(headers) : headers;

    for (const [key, value] of Object.entries(headersObj || {})) {
      const lowerKey = key.toLowerCase();

      if (
        this.options.sensitiveHeaders.some(sensitive =>
          lowerKey.includes(sensitive.toLowerCase())
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        // Limit header size
        const headerValue = String(value);
        sanitized[key] =
          headerValue.length > this.options.maxHeaderSize
            ? `${headerValue.substring(
                0,
                this.options.maxHeaderSize
              )}...[TRUNCATED]`
            : headerValue;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request/response body
   * @param {any} body - Body to sanitize
   * @returns {string|null} Sanitized body
   * @private
   */
  _sanitizeBody(body) {
    if (!body) {
      return null;
    }

    let bodyString;

    try {
      if (typeof body === 'string') {
        bodyString = body;
      } else if (body instanceof FormData) {
        bodyString = '[FormData]';
      } else if (body instanceof ArrayBuffer) {
        bodyString = `[ArrayBuffer: ${body.byteLength} bytes]`;
      } else if (body instanceof Blob) {
        bodyString = `[Blob: ${body.size} bytes, type: ${body.type}]`;
      } else {
        bodyString = JSON.stringify(body);
      }
    } catch (error) {
      bodyString = `[Unserializable body: ${error.message}]`;
    }

    // Limit body size
    if (bodyString.length > this.options.maxBodySize) {
      return `${bodyString.substring(
        0,
        this.options.maxBodySize
      )}...[TRUNCATED]`;
    }

    return bodyString;
  }

  /**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object
   * @private
   */
  _headersToObject(headers) {
    const obj = {};
    for (const [key, value] of headers.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Get response headers from fetch Response
   * @param {Response} response - Response object
   * @returns {Object} Headers object
   * @private
   */
  _getResponseHeaders(response) {
    return this._headersToObject(response.headers);
  }

  /**
   * Get headers from XMLHttpRequest
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @returns {Object} Headers object
   * @private
   */
  _getXHRHeaders(xhr) {
    const headers = {};

    // Try to get request headers (not always available)
    try {
      const requestHeaders = xhr.getAllRequestHeaders();
      if (requestHeaders) {
        requestHeaders.split('\r\n').forEach(line => {
          const [key, value] = line.split(': ');
          if (key && value) {
            headers[key] = value;
          }
        });
      }
    } catch (error) {
      // Ignore errors getting request headers
    }

    return headers;
  }

  /**
   * Get response headers from XMLHttpRequest
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @returns {Object} Headers object
   * @private
   */
  _getXHRResponseHeaders(xhr) {
    const headers = {};

    try {
      const responseHeaders = xhr.getAllResponseHeaders();
      if (responseHeaders) {
        responseHeaders.split('\r\n').forEach(line => {
          const [key, value] = line.split(': ');
          if (key && value) {
            headers[key] = value;
          }
        });
      }
    } catch (error) {
      // Ignore errors getting response headers
    }

    return headers;
  }

  /**
   * Determine if response body should be captured
   * @param {Response} response - Response object
   * @returns {boolean} Whether to capture body
   * @private
   */
  _shouldCaptureResponseBody(response) {
    const contentType = response.headers.get('content-type') || '';

    // Don't capture binary content
    if (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/octet-stream')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Determine if XHR response body should be captured
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @returns {boolean} Whether to capture body
   * @private
   */
  _shouldCaptureXHRResponseBody(xhr) {
    const contentType = xhr.getResponseHeader('content-type') || '';

    // Don't capture binary content
    if (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/octet-stream')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get response level based on status code
   * @param {number} status - HTTP status code
   * @returns {string} Log level
   * @private
   */
  _getResponseLevel(status) {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warn';
    if (status >= 300) return 'info';
    return 'info';
  }

  /**
   * Categorize network request for AI analysis
   * @param {Object} requestData - Request data
   * @returns {string} Request category
   * @private
   */
  _categorizeRequest(requestData) {
    const url = requestData.url.toLowerCase();
    const method = requestData.method.toUpperCase();

    // API requests (check first, before method-based categorization)
    if (
      url.includes('/api/') ||
      url.includes('/v1/') ||
      url.includes('/v2/') ||
      url.includes('api.')
    ) {
      return 'API Request';
    }

    // GraphQL
    if (
      url.includes('graphql') ||
      (method === 'POST' && url.includes('query'))
    ) {
      return 'GraphQL Request';
    }

    // Static assets
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return 'Static Asset';
    }

    // Authentication
    if (
      url.includes('auth') ||
      url.includes('login') ||
      url.includes('oauth')
    ) {
      return 'Authentication';
    }

    // Data fetching
    if (method === 'GET') {
      return 'Data Fetch';
    }

    // Data mutation
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return 'Data Mutation';
    }

    // Data deletion
    if (method === 'DELETE') {
      return 'Data Deletion';
    }

    return 'HTTP Request';
  }

  /**
   * Categorize network response for AI analysis
   * @param {Response} response - Response object
   * @param {Object} timing - Timing information
   * @returns {string} Response category
   * @private
   */
  _categorizeResponse(response, _timing) {
    const status = response.status;
    const url = response.url.toLowerCase();

    if (status >= 500) return 'Server Error';
    if (status >= 400) return 'Client Error';
    if (status >= 300) return 'Redirect';
    if (status >= 200) {
      if (
        url.includes('/api/') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('api.')
      )
        return 'API Success';
      if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/))
        return 'Asset Success';
      return 'Success';
    }

    return 'Unknown Response';
  }

  /**
   * Categorize XHR response for AI analysis
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {string} Response category
   * @private
   */
  _categorizeXHRResponse(xhr, timing) {
    const status = xhr.status;
    const url = timing.url.toLowerCase();

    if (status >= 500) return 'Server Error';
    if (status >= 400) return 'Client Error';
    if (status >= 300) return 'Redirect';
    if (status >= 200) {
      if (url.includes('/api/')) return 'API Success';
      return 'Success';
    }

    return 'Unknown Response';
  }

  /**
   * Categorize network error for AI analysis
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {string} Error category
   * @private
   */
  _categorizeNetworkError(error, _timing) {
    const message = error.message.toLowerCase();

    if (message.includes('cors')) return 'CORS Error';
    if (message.includes('timeout')) return 'Timeout Error';
    if (message.includes('network')) return 'Network Error';
    if (message.includes('abort')) return 'Request Aborted';
    if (message.includes('fetch')) return 'Fetch Error';

    return 'Network Error';
  }

  /**
   * Calculate response severity for AI analysis
   * @param {Response} response - Response object
   * @param {Object} timing - Timing information
   * @returns {Object} Severity information
   * @private
   */
  _calculateResponseSeverity(response, timing) {
    let score = 1; // Default low severity
    const factors = [];

    // Status code severity
    if (response.status >= 500) {
      score = 9;
      factors.push('server-error');
    } else if (response.status >= 400) {
      score = 6;
      factors.push('client-error');
    } else if (response.status >= 300) {
      score = 3;
      factors.push('redirect');
    }

    // Performance severity
    if (timing.duration > 5000) {
      // > 5 seconds
      score = Math.max(score, 7);
      factors.push('slow-response');
    } else if (timing.duration > 2000) {
      // > 2 seconds
      score = Math.max(score, 5);
      factors.push('moderate-delay');
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
      level: levels[score] || 'low',
      score,
      factors,
    };
  }

  /**
   * Calculate XHR response severity for AI analysis
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Object} Severity information
   * @private
   */
  _calculateXHRResponseSeverity(xhr, timing) {
    let score = 1; // Default low severity
    const factors = [];

    // Status code severity
    if (xhr.status >= 500) {
      score = 9;
      factors.push('server-error');
    } else if (xhr.status >= 400) {
      score = 6;
      factors.push('client-error');
    } else if (xhr.status >= 300) {
      score = 3;
      factors.push('redirect');
    }

    // Performance severity
    if (timing.duration > 5000) {
      // > 5 seconds
      score = Math.max(score, 7);
      factors.push('slow-response');
    } else if (timing.duration > 2000) {
      // > 2 seconds
      score = Math.max(score, 5);
      factors.push('moderate-delay');
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
      level: levels[score] || 'low',
      score,
      factors,
    };
  }

  /**
   * Calculate error severity for AI analysis
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Severity information
   * @private
   */
  _calculateErrorSeverity(error, _timing) {
    let score = 8; // Network errors are generally high severity
    const factors = ['network-failure'];

    const message = error.message.toLowerCase();

    if (message.includes('cors')) {
      score = 7;
      factors.push('cors-issue');
    } else if (message.includes('timeout')) {
      score = 6;
      factors.push('timeout');
    } else if (message.includes('abort')) {
      score = 4;
      factors.push('user-cancelled');
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
      level: levels[score] || 'high',
      score,
      factors,
    };
  }

  /**
   * Generate AI-friendly tags for requests
   * @param {Object} requestData - Request data
   * @returns {Array} Array of tags
   * @private
   */
  _generateRequestTags(requestData) {
    const tags = ['network', 'request'];
    const url = requestData.url.toLowerCase();
    const method = requestData.method.toUpperCase();

    // Method tags
    tags.push(`method-${method.toLowerCase()}`);

    // URL pattern tags
    if (
      url.includes('/api/') ||
      url.includes('/v1/') ||
      url.includes('/v2/') ||
      url.includes('api.')
    )
      tags.push('api');
    if (url.includes('graphql')) tags.push('graphql');
    if (url.includes('auth')) tags.push('authentication');
    if (url.match(/\.(js|css)$/)) tags.push('asset', 'script-style');
    if (url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) tags.push('asset', 'image');

    // Technology detection
    if (url.includes('react')) tags.push('react');
    if (url.includes('vue')) tags.push('vue');
    if (url.includes('angular')) tags.push('angular');

    // Environment tags
    if (this.options.environment) tags.push(`env-${this.options.environment}`);
    if (this.options.branch) tags.push(`branch-${this.options.branch}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate AI-friendly tags for responses
   * @param {Response} response - Response object
   * @param {Object} timing - Timing information
   * @returns {Array} Array of tags
   * @private
   */
  _generateResponseTags(response, timing) {
    const tags = ['network', 'response'];
    const status = response.status;

    // Status tags
    tags.push(`status-${Math.floor(status / 100)}xx`);
    if (status >= 400) tags.push('error');
    if (status >= 500) tags.push('server-error');
    if (status >= 400 && status < 500) tags.push('client-error');

    // Performance tags
    if (timing.duration > 5000) tags.push('slow');
    if (timing.duration > 2000) tags.push('delayed');
    if (timing.duration < 100) tags.push('fast');

    // Content type tags
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('json')) tags.push('json');
    if (contentType.includes('html')) tags.push('html');
    if (contentType.includes('xml')) tags.push('xml');

    // Environment tags
    if (this.options.environment) tags.push(`env-${this.options.environment}`);
    if (this.options.branch) tags.push(`branch-${this.options.branch}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate AI-friendly tags for XHR responses
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Array} Array of tags
   * @private
   */
  _generateXHRResponseTags(xhr, timing) {
    const tags = ['network', 'response', 'xhr'];
    const status = xhr.status;

    // Status tags
    tags.push(`status-${Math.floor(status / 100)}xx`);
    if (status >= 400) tags.push('error');
    if (status >= 500) tags.push('server-error');
    if (status >= 400 && status < 500) tags.push('client-error');

    // Performance tags
    if (timing.duration > 5000) tags.push('slow');
    if (timing.duration > 2000) tags.push('delayed');
    if (timing.duration < 100) tags.push('fast');

    // Content type tags
    const contentType = xhr.getResponseHeader('content-type') || '';
    if (contentType.includes('json')) tags.push('json');
    if (contentType.includes('html')) tags.push('html');
    if (contentType.includes('xml')) tags.push('xml');

    // Environment tags
    if (this.options.environment) tags.push(`env-${this.options.environment}`);
    if (this.options.branch) tags.push(`branch-${this.options.branch}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate AI-friendly tags for errors
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Array} Array of tags
   * @private
   */
  _generateErrorTags(error, _timing) {
    const tags = ['network', 'error'];
    const message = error.message.toLowerCase();

    // Error type tags
    if (message.includes('cors')) tags.push('cors');
    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('abort')) tags.push('aborted');
    if (message.includes('fetch')) tags.push('fetch-error');

    // Environment tags
    if (this.options.environment) tags.push(`env-${this.options.environment}`);
    if (this.options.branch) tags.push(`branch-${this.options.branch}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Analyze request for AI insights
   * @param {Object} requestData - Request data
   * @returns {Object} Analysis results
   * @private
   */
  _analyzeRequest(requestData) {
    return {
      patterns: this._detectRequestPatterns(requestData),
      optimization: this._suggestRequestOptimizations(requestData),
      security: this._analyzeRequestSecurity(requestData),
    };
  }

  /**
   * Analyze response for AI insights
   * @param {Response} response - Response object
   * @param {Object} timing - Timing information
   * @returns {Object} Analysis results
   * @private
   */
  _analyzeResponse(response, timing) {
    return {
      patterns: this._detectResponsePatterns(response, timing),
      optimization: this._suggestResponseOptimizations(response, timing),
      performance: this._analyzeResponsePerformance(response, timing),
    };
  }

  /**
   * Analyze XHR response for AI insights
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Object} Analysis results
   * @private
   */
  _analyzeXHRResponse(xhr, timing) {
    return {
      patterns: this._detectXHRResponsePatterns(xhr, timing),
      optimization: this._suggestXHRResponseOptimizations(xhr, timing),
      performance: this._analyzeXHRResponsePerformance(xhr, timing),
    };
  }

  /**
   * Analyze network error for AI insights
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Analysis results
   * @private
   */
  _analyzeNetworkError(error, timing) {
    return {
      cause: this._identifyErrorCause(error, timing),
      recovery: this._suggestErrorRecovery(error, timing),
      prevention: this._suggestErrorPrevention(error, timing),
    };
  }

  /**
   * Collect performance metrics
   * @returns {Object|null} Performance metrics
   * @private
   */
  _collectPerformanceMetrics() {
    if (typeof performance === 'undefined') {
      return null;
    }

    const metrics = {
      timing: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin || Date.now(),
      },
    };

    // Add memory information if available
    if (performance.memory) {
      metrics.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
    }

    return metrics;
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

  // Placeholder methods for AI analysis (can be expanded)
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
