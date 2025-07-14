/**
 * LogAnalyzer - AI-friendly analysis and categorization for logs
 */

class LogAnalyzer {
  constructor(options = {}) {
    this.options = {
      environment: options.environment || 'development',
      applicationName: options.applicationName,
      enableErrorCategorization: options.enableErrorCategorization !== false,
      ...options,
    };
  }

  /**
   * Categorize log entry for AI analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Original arguments
   * @returns {string} Log category
   */
  categorizeLog(level, message, _args) {
    const lowerMessage = message.toLowerCase();

    // Error categorization
    if (level === 'error') {
      if (
        lowerMessage.includes('syntaxerror') ||
        lowerMessage.includes('unexpected token')
      ) {
        return 'Syntax Error';
      }
      if (
        lowerMessage.includes('typeerror') ||
        lowerMessage.includes('referenceerror')
      ) {
        return 'Runtime Error';
      }
      if (
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('network') ||
        lowerMessage.includes('xhr') ||
        lowerMessage.includes('ajax')
      ) {
        return 'Network Error';
      }
      if (
        lowerMessage.includes('permission') ||
        lowerMessage.includes('security') ||
        lowerMessage.includes('cors')
      ) {
        return 'Security Error';
      }
      if (
        lowerMessage.includes('performance') ||
        lowerMessage.includes('memory') ||
        lowerMessage.includes('timeout')
      ) {
        return 'Performance Error';
      }
      return 'Application Error';
    }

    // Warning categorization
    if (level === 'warn') {
      if (
        lowerMessage.includes('deprecated') ||
        lowerMessage.includes('obsolete')
      ) {
        return 'Deprecation Warning';
      }
      if (
        lowerMessage.includes('performance') ||
        lowerMessage.includes('slow')
      ) {
        return 'Performance Warning';
      }
      return 'General Warning';
    }

    // Info and debug categorization
    if (level === 'info') {
      if (
        lowerMessage.includes('api') ||
        lowerMessage.includes('request') ||
        lowerMessage.includes('response')
      ) {
        return 'API Information';
      }
      if (
        lowerMessage.includes('user') ||
        lowerMessage.includes('click') ||
        lowerMessage.includes('interaction')
      ) {
        return 'User Interaction';
      }
      return 'Application Information';
    }

    return 'General Log';
  }

  /**
   * Calculate severity level for AI analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Original arguments
   * @returns {Object} Severity information
   */
  calculateSeverity(level, message, _args) {
    const lowerMessage = message.toLowerCase();

    // Base severity by log level
    const baseSeverity = {
      error: { level: 'high', score: 8 },
      warn: { level: 'medium', score: 5 },
      info: { level: 'low', score: 2 },
      debug: { level: 'low', score: 1 },
      log: { level: 'low', score: 2 },
    };

    const base = baseSeverity[level] || { level: 'low', score: 1 };

    // Adjust severity based on content
    let adjustedScore = base.score;

    if (level === 'error') {
      // Critical errors
      if (
        lowerMessage.includes('uncaught') ||
        lowerMessage.includes('fatal') ||
        lowerMessage.includes('crash')
      ) {
        adjustedScore = 10;
      }
      // Security errors
      else if (
        lowerMessage.includes('security') ||
        lowerMessage.includes('xss') ||
        lowerMessage.includes('csrf')
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
      description: this.getSeverityDescription(finalLevel),
      factors: this.getSeverityFactors(level, message),
    };
  }

  /**
   * Get severity description for AI understanding
   * @param {string} level - Severity level
   * @returns {string} Description
   */
  getSeverityDescription(level) {
    const descriptions = {
      critical: 'Requires immediate attention - may cause application failure',
      high: 'Significant issue that should be addressed soon',
      medium: 'Moderate issue that should be investigated',
      low: 'Informational - no immediate action required',
    };
    return descriptions[level] || descriptions.low;
  }

  /**
   * Get severity factors for AI analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @returns {Array} Array of severity factors
   */
  getSeverityFactors(level, message) {
    const factors = [];
    const lowerMessage = message.toLowerCase();

    if (level === 'error') factors.push('error-level');
    if (lowerMessage.includes('uncaught')) factors.push('uncaught-exception');
    if (lowerMessage.includes('security')) factors.push('security-related');
    if (lowerMessage.includes('network')) factors.push('network-related');
    if (lowerMessage.includes('performance'))
      factors.push('performance-related');
    if (lowerMessage.includes('memory')) factors.push('memory-related');

    return factors;
  }

  /**
   * Generate AI-friendly tags for log analysis
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Original arguments
   * @returns {Array} Array of tags
   */
  generateAITags(level, message, _args) {
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
      lowerMessage.includes('xhr')
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
      lowerMessage.includes('logout')
    )
      tags.push('authentication');
    if (lowerMessage.includes('permission') || lowerMessage.includes('access'))
      tags.push('authorization');
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid'))
      tags.push('validation');
    if (
      lowerMessage.includes('performance') ||
      lowerMessage.includes('slow') ||
      lowerMessage.includes('optimization')
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
   * @param {Array} args - Original arguments
   * @returns {Object} Error analysis
   */
  analyzeError(message, _args) {
    const lowerMessage = message.toLowerCase();
    const analysis = {
      type: 'Unknown',
      cause: 'Unknown cause',
      suggestions: [],
      recoverable: true,
      impact: 'medium',
    };

    // Analyze error type and provide suggestions
    if (lowerMessage.includes('typeerror')) {
      analysis.type = 'TypeError';
      analysis.cause =
        'Attempting to use a value in a way that is not compatible with its type';
      analysis.suggestions = [
        'Check variable types before operations',
        'Add type validation',
        'Use typeof checks',
      ];
    } else if (lowerMessage.includes('referenceerror')) {
      analysis.type = 'ReferenceError';
      analysis.cause = 'Attempting to access a variable that is not defined';
      analysis.suggestions = [
        'Check variable declarations',
        'Verify variable scope',
        'Check for typos in variable names',
      ];
    } else if (lowerMessage.includes('syntaxerror')) {
      analysis.type = 'SyntaxError';
      analysis.cause = 'Invalid JavaScript syntax';
      analysis.suggestions = [
        'Check for missing brackets or parentheses',
        'Verify proper string quoting',
        'Check for reserved keyword usage',
      ];
      analysis.recoverable = false;
    } else if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch')
    ) {
      analysis.type = 'NetworkError';
      analysis.cause = 'Network request failed';
      analysis.suggestions = [
        'Check network connectivity',
        'Verify API endpoint',
        'Add retry logic',
        'Handle offline scenarios',
      ];
    } else if (lowerMessage.includes('cors')) {
      analysis.type = 'CORSError';
      analysis.cause = 'Cross-Origin Resource Sharing policy violation';
      analysis.suggestions = [
        'Configure CORS headers on server',
        'Use proxy for development',
        'Check request headers',
      ];
      analysis.impact = 'high';
    }

    return analysis;
  }

  /**
   * Initialize error categorization system
   * @returns {Object} Error categories
   */
  initializeErrorCategories() {
    return {
      syntax_error: 'Code syntax issues',
      runtime_error: 'Runtime execution errors',
      network_error: 'API/network connectivity issues',
      security_error: 'Security or permission errors',
      performance_error: 'Performance degradation issues',
      user_error: 'User input or interaction errors',
      system_error: 'Browser/system level errors',
    };
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = LogAnalyzer;
}
