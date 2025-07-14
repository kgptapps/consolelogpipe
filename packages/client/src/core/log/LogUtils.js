/**
 * LogUtils - Utility functions for log capture
 */

class LogUtils {
  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  static generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}`;
  }

  /**
   * Get application-specific port (3001-3100 range)
   * @param {string} applicationName - Application name
   * @returns {number} Port number
   */
  static getApplicationPort(applicationName) {
    // Simple hash function to assign consistent ports
    let hash = 0;
    for (let i = 0; i < applicationName.length; i++) {
      const char = applicationName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    // Map to port range 3001-3100
    return 3001 + (Math.abs(hash) % 100);
  }

  /**
   * Detect current environment
   * @returns {string} Environment name
   */
  static detectEnvironment() {
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      if (hostname?.includes('staging') || hostname?.includes('dev')) {
        return 'staging';
      }
    }
    return 'production';
  }

  /**
   * Detect developer name from various sources
   * @returns {string|null} Developer name
   */
  static detectDeveloper() {
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
   */
  static detectBranch() {
    // In browser environment, we can't access git directly
    // This would be enhanced in a Node.js environment or with build-time injection
    if (typeof window !== 'undefined') {
      // Try to get from build-time environment variables
      const branch =
        window.__GIT_BRANCH__ ||
        // eslint-disable-next-line no-undef
        (typeof process !== 'undefined' && process?.env?.GIT_BRANCH) ||
        // eslint-disable-next-line no-undef
        (typeof process !== 'undefined' && process?.env?.BRANCH_NAME);
      if (branch) return branch;
    }
    return null;
  }

  /**
   * Convert arguments to string representation
   * @param {Array} args - Arguments array
   * @returns {string} String representation
   */
  static argsToString(args) {
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
          return JSON.stringify(arg);
        } catch (error) {
          return arg.toString();
        }
      })
      .join(' ');
  }

  /**
   * Serialize arguments with circular reference handling
   * @param {Array} args - Arguments array
   * @returns {Array} Serialized arguments
   */
  static serializeArgs(args) {
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
            type: 'Error',
          };
        }

        // Handle other objects with circular reference protection
        return JSON.parse(JSON.stringify(arg, LogUtils.circularReplacer()));
      } catch (error) {
        return `[Unserializable: ${error.message}]`;
      }
    });
  }

  /**
   * Circular reference replacer for JSON.stringify
   * @returns {Function} Replacer function
   */
  static circularReplacer() {
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
   * Get approximate size of log entry in bytes
   * @param {Object} logEntry - Log entry object
   * @returns {number} Size in bytes
   */
  static getLogSize(logEntry) {
    try {
      return JSON.stringify(logEntry).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Collect enhanced metadata about the current context for AI analysis
   * @returns {Object} Enhanced metadata object
   */
  static collectEnhancedMetadata() {
    const metadata = {};

    try {
      // URL and navigation information
      if (typeof window !== 'undefined' && window.location) {
        metadata.url = {
          href: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
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
        timeOrigin: performance?.timeOrigin || Date.now(),
      };

      // Stack trace for debugging
      if (Error.captureStackTrace) {
        const stack = {};
        Error.captureStackTrace(stack, LogUtils.collectEnhancedMetadata);
        metadata.stackTrace = stack.stack;
      } else {
        metadata.stackTrace = new Error().stack;
      }

      // Document state
      if (typeof document !== 'undefined') {
        metadata.document = {
          readyState: document.readyState,
          title: document.title,
          referrer: document.referrer,
        };
      }
    } catch (error) {
      // Fail silently but log the error
      metadata.metadataError = error.message;
    }

    return metadata;
  }

  /**
   * Collect performance metrics for AI analysis
   * @returns {Object} Performance metrics
   */
  static collectPerformanceMetrics() {
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
          timeOrigin: performance.timeOrigin || Date.now(),
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
   * @returns {Array|null} Parsed stack frames
   */
  static parseStackTrace(stack) {
    if (!stack) return null;

    try {
      return stack
        .split('\n')
        .slice(1) // Remove the error message line
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
          return null;
        })
        .filter(Boolean)
        .slice(0, 10); // Limit to 10 frames
    } catch (error) {
      return null;
    }
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = LogUtils;
}
