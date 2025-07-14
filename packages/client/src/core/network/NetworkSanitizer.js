/**
 * NetworkSanitizer - Sanitization utilities for network data
 */

const NetworkUtils = require('./NetworkUtils');

class NetworkSanitizer {
  constructor(options = {}) {
    this.options = {
      captureHeaders: options.captureHeaders !== false,
      maxBodySize: options.maxBodySize || 50 * 1024, // 50KB
      maxHeaderSize: options.maxHeaderSize || 10 * 1024, // 10KB
      sensitiveHeaders: options.sensitiveHeaders || [
        'authorization',
        'cookie',
        'set-cookie',
        'x-api-key',
        'x-auth-token',
        'x-access-token',
        'bearer',
        'basic',
      ],
    };
  }

  /**
   * Sanitize headers by removing sensitive information
   * @param {Object|Headers} headers - Headers to sanitize
   * @param {Object} options - Override options
   * @returns {Object} Sanitized headers
   */
  sanitizeHeaders(headers, options = {}) {
    // Use passed options or fall back to instance options
    const effectiveOptions = { ...this.options, ...options };

    if (!effectiveOptions.captureHeaders) {
      return {};
    }

    // Convert Headers object to plain object if needed
    const headersObj =
      headers instanceof Headers
        ? NetworkUtils.headersToObject(headers)
        : headers;

    const sanitized = {};
    for (const [key, value] of Object.entries(headersObj || {})) {
      const lowerKey = key.toLowerCase();

      if (
        effectiveOptions.sensitiveHeaders.some(sensitive =>
          lowerKey.includes(sensitive.toLowerCase())
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        // Limit header size
        const headerValue = String(value);
        if (headerValue.length > effectiveOptions.maxHeaderSize) {
          sanitized[key] = `${headerValue.substring(
            0,
            effectiveOptions.maxHeaderSize
          )}...[TRUNCATED]`;
        } else {
          sanitized[key] = headerValue;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request/response body
   * @param {any} body - Body to sanitize
   * @param {Object} options - Override options
   * @returns {string|null} Sanitized body
   */
  sanitizeBody(body, options = {}) {
    // Use passed options or fall back to instance options
    const effectiveOptions = { ...this.options, ...options };
    if (!body) {
      return null;
    }

    let bodyString;
    try {
      if (typeof body === 'string') {
        bodyString = body;
      } else if (body instanceof FormData) {
        // Convert FormData to readable format
        const formEntries = [];
        for (const [key, value] of body.entries()) {
          formEntries.push(`${key}=${value}`);
        }
        bodyString =
          formEntries.length > 0
            ? `FormData: ${formEntries.join('&')}`
            : '[FormData]';
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
    if (bodyString.length > effectiveOptions.maxBodySize) {
      return `${bodyString.substring(
        0,
        effectiveOptions.maxBodySize
      )}...[TRUNCATED]`;
    }

    return bodyString;
  }

  /**
   * Sanitize sensitive data from URL parameters
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      const sensitiveParams = ['token', 'key', 'password', 'secret', 'auth'];

      for (const param of sensitiveParams) {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      }

      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original
      return url;
    }
  }

  /**
   * Sanitize error information
   * @param {Error} error - Error to sanitize
   * @returns {Object} Sanitized error info
   */
  sanitizeError(error) {
    if (!error) {
      return null;
    }

    const sanitized = {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      type: error.constructor.name,
    };

    // Include stack trace if available (truncated for security)
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 10); // Limit stack depth
      sanitized.stack = stackLines.join('\n');
    }

    return sanitized;
  }

  /**
   * Remove sensitive information from request data
   * @param {Object} requestData - Request data to sanitize
   * @returns {Object} Sanitized request data
   */
  sanitizeRequestData(requestData) {
    return {
      ...requestData,
      url: this.sanitizeUrl(requestData.url),
      headers: this.sanitizeHeaders(requestData.headers),
      body: this.sanitizeBody(requestData.body),
    };
  }

  /**
   * Remove sensitive information from response data
   * @param {Object} responseData - Response data to sanitize
   * @returns {Object} Sanitized response data
   */
  sanitizeResponseData(responseData) {
    return {
      ...responseData,
      headers: this.sanitizeHeaders(responseData.headers),
      body: this.sanitizeBody(responseData.body),
    };
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = NetworkSanitizer;
}
