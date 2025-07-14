/**
 * NetworkAnalyzer - AI-friendly analysis and categorization for network requests
 */

class NetworkAnalyzer {
  constructor(options = {}) {
    this.options = {
      environment: options.environment || 'development',
      branch: options.branch,
      enableNetworkAnalysis: options.enableNetworkAnalysis !== false,
    };
  }

  /**
   * Categorize network request for AI analysis
   * @param {Object} requestData - Request data
   * @returns {string} Request category
   */
  categorizeRequest(requestData) {
    const url = requestData.url.toLowerCase();
    const method = requestData.method.toUpperCase();

    // GraphQL (check first, more specific than API)
    if (
      url.includes('graphql') ||
      (method === 'POST' && url.includes('query'))
    ) {
      return 'GraphQL Request';
    }

    // API requests
    if (
      url.includes('/api/') ||
      url.includes('/v1/') ||
      url.includes('/v2/') ||
      url.includes('api.') ||
      url.includes('.api.')
    ) {
      return 'API Request';
    }

    // Static assets
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return 'Static Asset';
    }

    // Authentication
    if (
      url.includes('auth') ||
      url.includes('login') ||
      url.includes('oauth') ||
      url.includes('token')
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
   */
  categorizeResponse(response, _timing) {
    const status = response.status;
    const url = response.url.toLowerCase();

    if (status >= 500) return 'Server Error';
    if (status >= 400) return 'Client Error';
    if (status >= 300) return 'Redirect';
    if (status >= 200) {
      if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
        return 'Asset Success';
      }
      if (
        url.includes('/api/') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('/graphql')
      ) {
        return 'API Success';
      }
      return 'Success';
    }

    return 'Unknown Response';
  }

  /**
   * Categorize XHR response for AI analysis
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {string} Response category
   */
  categorizeXHRResponse(xhr, timing) {
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
   */
  categorizeNetworkError(error, _timing) {
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
   */
  calculateResponseSeverity(response, timing) {
    let score = 1; // Default low severity
    const factors = [];

    // Status code severity
    if (response.status >= 500) {
      score = 9;
      factors.push('server-error');
    } else if (response.status >= 400) {
      score = 4; // Changed to 4 for medium level
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

    return {
      score,
      level:
        score >= 8
          ? 'critical'
          : score >= 6
          ? 'high'
          : score >= 4
          ? 'medium'
          : 'low',
      factors,
    };
  }

  /**
   * Calculate XHR response severity for AI analysis
   * @param {XMLHttpRequest} xhr - XMLHttpRequest object
   * @param {Object} timing - Timing information
   * @returns {Object} Severity information
   */
  calculateXHRResponseSeverity(xhr, timing) {
    let score = 1; // Default low severity
    const factors = [];

    // Status code severity
    if (xhr.status >= 500) {
      score = 9;
      factors.push('server-error');
    } else if (xhr.status >= 400) {
      score = 4; // Changed to 4 for medium level
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

    return {
      score,
      level:
        score >= 8
          ? 'critical'
          : score >= 6
          ? 'high'
          : score >= 4
          ? 'medium'
          : 'low',
      factors,
    };
  }

  /**
   * Calculate error severity for AI analysis
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Severity information
   */
  calculateErrorSeverity(error, _timing) {
    let score = 8; // Network errors are generally high severity
    const factors = ['network-failure'];

    const message = error.message.toLowerCase();

    if (message.includes('cors')) {
      score = 7;
      factors.push('cors-issue');
    } else if (message.includes('timeout')) {
      score = 4; // Changed to 4 for medium level
      factors.push('timeout');
    } else if (message.includes('abort')) {
      score = 4;
      factors.push('user-cancelled');
    }

    return {
      score,
      level:
        score >= 8
          ? 'critical'
          : score >= 6
          ? 'high'
          : score >= 4
          ? 'medium'
          : 'low',
      factors,
    };
  }

  /**
   * Generate AI-friendly tags for requests
   * @param {Object} requestData - Request data
   * @returns {Array} Array of tags
   */
  generateRequestTags(requestData) {
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
      url.includes('/graphql')
    ) {
      tags.push('api');
    }
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
   */
  generateResponseTags(response, timing) {
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
   */
  generateXHRResponseTags(xhr, timing) {
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
   */
  generateErrorTags(error, _timing) {
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
   */
  analyzeRequest(requestData) {
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
   */
  analyzeResponse(response, timing) {
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
   */
  analyzeXHRResponse(xhr, timing) {
    return {
      patterns: this._detectXHRResponsePatterns(xhr, timing),
      optimizations: this._suggestXHRResponseOptimizations(xhr, timing),
      performance: this._analyzeXHRResponsePerformance(xhr, timing),
    };
  }

  /**
   * Analyze network error for AI insights
   * @param {Error} error - Error object
   * @param {Object} timing - Timing information
   * @returns {Object} Analysis results
   */
  analyzeNetworkError(error, timing) {
    return {
      cause: this._identifyErrorCause(error, timing),
      recovery: this._suggestErrorRecovery(error, timing),
      prevention: this._suggestErrorPrevention(error, timing),
    };
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
  module.exports = NetworkAnalyzer;
}
