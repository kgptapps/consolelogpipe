/**
 * NetworkUtils - Utility functions for network capture
 */

class NetworkUtils {
  /**
   * Generate unique request ID
   * @returns {string} Unique request ID
   */
  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert Headers object to plain object
   * @param {Headers} headers - Headers object
   * @returns {Object} Plain object representation
   */
  static headersToObject(headers) {
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
   */
  static getResponseHeaders(response) {
    return this.headersToObject(response.headers);
  }

  /**
   * Get headers from XMLHttpRequest
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @returns {Object} Headers object
   */
  static getXHRHeaders(xhr) {
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
   */
  static getXHRResponseHeaders(xhr) {
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
   */
  static shouldCaptureResponseBody(response) {
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
   */
  static shouldCaptureXHRResponseBody(xhr) {
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
   * @returns {string} Response level
   */
  static getResponseLevel(status) {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warn';
    if (status >= 300) return 'info';
    return 'info';
  }

  /**
   * Check if URL should be captured based on include/exclude patterns
   * @param {string} url - URL to check
   * @param {Object} options - Options with includeUrls and excludeUrls
   * @returns {boolean} Whether URL should be captured
   */
  static shouldCaptureUrl(url, options) {
    // Check exclude patterns first
    for (const pattern of options.excludeUrls) {
      if (
        pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern)
      ) {
        return false;
      }
    }

    // If include patterns are specified, URL must match at least one
    if (options.includeUrls.length > 0) {
      return options.includeUrls.some(pattern =>
        pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern)
      );
    }

    return true;
  }

  /**
   * Collect performance metrics
   * @returns {Object|null} Performance metrics
   */
  static collectPerformanceMetrics() {
    if (typeof performance === 'undefined') {
      return null;
    }

    const metrics = {
      timing: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin || Date.now(),
      },
      navigation: performance.getEntriesByType
        ? performance.getEntriesByType('navigation')[0]
        : null,
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
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = NetworkUtils;
}
