/**
 * LogFormatter - Format log data into AI-friendly structures
 */

const LogUtils = require('./LogUtils');
const LogAnalyzer = require('./LogAnalyzer');

class LogFormatter {
  constructor(options = {}) {
    this.options = {
      applicationName: options.applicationName,
      sessionId: options.sessionId,
      environment: options.environment || 'development',
      developer: options.developer,
      branch: options.branch,
      captureMetadata: options.captureMetadata !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      enableErrorCategorization: options.enableErrorCategorization !== false,
      maxLogSize: options.maxLogSize || 10 * 1024,
      ...options,
    };

    this.analyzer = new LogAnalyzer(options);
  }

  /**
   * Create structured log entry with AI-friendly format
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Object} Formatted log entry
   */
  createLogEntry(level, args) {
    const timestamp = new Date().toISOString();
    const message = LogUtils.argsToString(args);

    // Create structured log entry with AI-friendly format
    const logEntry = {
      // Core log data
      level,
      message,
      args: LogUtils.serializeArgs(args),
      timestamp,

      // Application context
      application: {
        name: this.options.applicationName,
        sessionId: this.options.sessionId,
        environment: this.options.environment,
        developer: this.options.developer,
        branch: this.options.branch,
      },

      // AI-friendly categorization
      category: this.analyzer.categorizeLog(level, message, args),
      severity: this.analyzer.calculateSeverity(level, message, args),
      tags: this.analyzer.generateAITags(level, message, args),

      // Performance metrics (if enabled)
      performance: this.options.enablePerformanceTracking
        ? LogUtils.collectPerformanceMetrics()
        : null,

      // Error analysis (for error logs)
      errorAnalysis:
        level === 'error' ? this.analyzer.analyzeError(message, args) : null,

      // Contextual metadata
      context: this.options.captureMetadata
        ? LogUtils.collectEnhancedMetadata()
        : null,
    };

    return logEntry;
  }

  /**
   * Check if log entry exceeds size limit and truncate if necessary
   * @param {Object} logEntry - Log entry to check
   * @returns {Object} Potentially truncated log entry
   */
  checkAndTruncateLogEntry(logEntry) {
    const logSize = LogUtils.getLogSize(logEntry);

    if (logSize > this.options.maxLogSize) {
      // Create a truncated version
      const truncatedEntry = {
        ...logEntry,
        message: '[Log too large - truncated]',
        truncated: true,
        originalSize: logSize,
        maxSize: this.options.maxLogSize,
      };

      // Remove heavy metadata to reduce size
      if (truncatedEntry.context) {
        truncatedEntry.context = {
          url: truncatedEntry.context.url,
          timing: truncatedEntry.context.timing,
          metadataError: 'Truncated due to size limit',
        };
      }

      // Simplify args
      if (truncatedEntry.args && truncatedEntry.args.length > 0) {
        truncatedEntry.args = ['[Arguments truncated due to size limit]'];
      }

      return truncatedEntry;
    }

    return logEntry;
  }

  /**
   * Format log entry for console output
   * @param {Object} logEntry - Log entry to format
   * @returns {string} Formatted string for console
   */
  formatForConsole(logEntry) {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const level = logEntry.level.toUpperCase().padEnd(5);
    const app = logEntry.application.name;
    const category = logEntry.category;
    const severity = logEntry.severity.level.toUpperCase();

    return `[${timestamp}] ${level} [${app}] [${category}] [${severity}] ${logEntry.message}`;
  }

  /**
   * Format log entry for JSON output
   * @param {Object} logEntry - Log entry to format
   * @returns {string} JSON string
   */
  formatForJSON(logEntry) {
    try {
      return JSON.stringify(logEntry, null, 2);
    } catch (error) {
      return JSON.stringify(
        {
          error: 'Failed to serialize log entry',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );
    }
  }

  /**
   * Format log entry for remote transmission
   * @param {Object} logEntry - Log entry to format
   * @returns {Object} Formatted entry for transmission
   */
  formatForTransmission(logEntry) {
    // Create a clean copy for transmission
    const transmissionEntry = {
      ...logEntry,
      // Add transmission metadata
      transmission: {
        timestamp: Date.now(),
        version: '1.0.0',
        format: 'console-log-pipe',
      },
    };

    // Remove circular references and non-serializable data
    try {
      return JSON.parse(
        JSON.stringify(transmissionEntry, LogUtils.circularReplacer())
      );
    } catch (error) {
      return {
        error: 'Failed to prepare log for transmission',
        message: error.message,
        originalLevel: logEntry.level,
        originalMessage: logEntry.message,
        timestamp: logEntry.timestamp,
        application: logEntry.application,
      };
    }
  }

  /**
   * Create a summary of multiple log entries
   * @param {Array} logEntries - Array of log entries
   * @returns {Object} Summary object
   */
  createLogSummary(logEntries) {
    const summary = {
      total: logEntries.length,
      byLevel: {},
      byCategory: {},
      bySeverity: {},
      timeRange: {
        start: null,
        end: null,
      },
      applications: new Set(),
      errors: 0,
      warnings: 0,
    };

    logEntries.forEach(entry => {
      // Count by level
      summary.byLevel[entry.level] = (summary.byLevel[entry.level] || 0) + 1;

      // Count by category
      summary.byCategory[entry.category] =
        (summary.byCategory[entry.category] || 0) + 1;

      // Count by severity
      const severityLevel = entry.severity?.level || 'unknown';
      summary.bySeverity[severityLevel] =
        (summary.bySeverity[severityLevel] || 0) + 1;

      // Track time range
      const timestamp = new Date(entry.timestamp);
      if (!summary.timeRange.start || timestamp < summary.timeRange.start) {
        summary.timeRange.start = timestamp;
      }
      if (!summary.timeRange.end || timestamp > summary.timeRange.end) {
        summary.timeRange.end = timestamp;
      }

      // Track applications
      if (entry.application?.name) {
        summary.applications.add(entry.application.name);
      }

      // Count errors and warnings
      if (entry.level === 'error') summary.errors++;
      if (entry.level === 'warn') summary.warnings++;
    });

    // Convert Set to Array
    summary.applications = Array.from(summary.applications);

    return summary;
  }

  /**
   * Filter log entries based on criteria
   * @param {Array} logEntries - Array of log entries
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered log entries
   */
  filterLogEntries(logEntries, filters = {}) {
    return logEntries.filter(entry => {
      // Level filter
      if (filters.levels && !filters.levels.includes(entry.level)) {
        return false;
      }

      // Application filter
      if (
        filters.applications &&
        !filters.applications.includes(entry.application?.name)
      ) {
        return false;
      }

      // Severity filter
      if (
        filters.severities &&
        !filters.severities.includes(entry.severity?.level)
      ) {
        return false;
      }

      // Time range filter
      if (filters.timeRange) {
        const timestamp = new Date(entry.timestamp);
        if (filters.timeRange.start && timestamp < filters.timeRange.start) {
          return false;
        }
        if (filters.timeRange.end && timestamp > filters.timeRange.end) {
          return false;
        }
      }

      // Message pattern filter
      if (filters.messagePattern) {
        const pattern = filters.messagePattern;
        if (pattern instanceof RegExp) {
          if (!pattern.test(entry.message)) return false;
        } else if (typeof pattern === 'string') {
          if (!entry.message.toLowerCase().includes(pattern.toLowerCase()))
            return false;
        }
      }

      return true;
    });
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = LogFormatter;
}
