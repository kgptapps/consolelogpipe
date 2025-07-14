/**
 * LogFormatter - Formats log entries for CLI display
 */

const chalk = require('chalk');

class LogFormatter {
  /**
   * Format a log entry for display
   */
  static formatLog(logData, options = {}) {
    const { format = 'text', color = true, timestamp = true } = options;

    switch (format) {
      case 'json':
        return JSON.stringify(logData, null, 2);
      case 'table':
        return this.formatLogAsTable(logData, { color, timestamp });
      case 'text':
      default:
        return this.formatLogAsText(logData, { color, timestamp });
    }
  }

  /**
   * Format an error entry for display
   */
  static formatError(errorData, options = {}) {
    const { format = 'text', color = true, timestamp = true } = options;

    switch (format) {
      case 'json':
        return JSON.stringify(errorData, null, 2);
      case 'text':
      default:
        return this.formatErrorAsText(errorData, { color, timestamp });
    }
  }

  /**
   * Format a network entry for display
   */
  static formatNetwork(networkData, options = {}) {
    const { format = 'text', color = true, timestamp = true } = options;

    switch (format) {
      case 'json':
        return JSON.stringify(networkData, null, 2);
      case 'text':
      default:
        return this.formatNetworkAsText(networkData, { color, timestamp });
    }
  }

  /**
   * Format log as text
   */
  static formatLogAsText(logData, options) {
    const { color, timestamp } = options;
    const parts = [];

    // Timestamp
    if (timestamp && logData.timestamp) {
      const time = new Date(logData.timestamp).toLocaleTimeString();
      parts.push(color ? chalk.gray(time) : time);
    }

    // Log level
    const level = (logData.level || 'log').toUpperCase();
    const levelFormatted = color ? this.colorizeLevel(level) : `[${level}]`;
    parts.push(levelFormatted);

    // Application name
    if (logData.appName) {
      const appName = color
        ? chalk.cyan(`[${logData.appName}]`)
        : `[${logData.appName}]`;
      parts.push(appName);
    }

    // Message
    let message = logData.message || '';
    if (logData.args && logData.args.length > 0) {
      const argsStr = logData.args
        .map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ');
      message = message ? `${message} ${argsStr}` : argsStr;
    }

    parts.push(message);

    // Stack trace for errors
    if (logData.stack && logData.level === 'error') {
      parts.push(`\n${color ? chalk.gray(logData.stack) : logData.stack}`);
    }

    return parts.join(' ');
  }

  /**
   * Format error as text
   */
  static formatErrorAsText(errorData, options) {
    const { color, timestamp } = options;
    const parts = [];

    // Timestamp
    if (timestamp && errorData.timestamp) {
      const time = new Date(errorData.timestamp).toLocaleTimeString();
      parts.push(color ? chalk.gray(time) : time);
    }

    // Error indicator
    const errorLabel = color ? chalk.red.bold('[ERROR]') : '[ERROR]';
    parts.push(errorLabel);

    // Application name
    if (errorData.appName) {
      const appName = color
        ? chalk.cyan(`[${errorData.appName}]`)
        : `[${errorData.appName}]`;
      parts.push(appName);
    }

    // Error message
    const message = errorData.message || errorData.error || 'Unknown error';
    parts.push(color ? chalk.red(message) : message);

    // Error details
    if (errorData.filename) {
      parts.push(
        color
          ? chalk.gray(
              `at ${errorData.filename}:${errorData.lineno}:${errorData.colno}`
            )
          : `at ${errorData.filename}:${errorData.lineno}:${errorData.colno}`
      );
    }

    // Stack trace
    if (errorData.stack) {
      parts.push(`\n${color ? chalk.gray(errorData.stack) : errorData.stack}`);
    }

    // Error category (AI-friendly)
    if (errorData.category) {
      parts.push(
        color
          ? chalk.yellow(`[${errorData.category}]`)
          : `[${errorData.category}]`
      );
    }

    return parts.join(' ');
  }

  /**
   * Format network request as text
   */
  static formatNetworkAsText(networkData, options) {
    const { color, timestamp } = options;
    const parts = [];

    // Timestamp
    if (timestamp && networkData.timestamp) {
      const time = new Date(networkData.timestamp).toLocaleTimeString();
      parts.push(color ? chalk.gray(time) : time);
    }

    // Network indicator
    const networkLabel = color ? chalk.blue.bold('[NET]') : '[NET]';
    parts.push(networkLabel);

    // Application name
    if (networkData.appName) {
      const appName = color
        ? chalk.cyan(`[${networkData.appName}]`)
        : `[${networkData.appName}]`;
      parts.push(appName);
    }

    // HTTP method and URL
    const method = networkData.method || 'GET';
    const url = networkData.url || 'unknown';
    const methodFormatted = color ? this.colorizeHttpMethod(method) : method;
    parts.push(`${methodFormatted} ${url}`);

    // Status code
    if (networkData.status) {
      const statusFormatted = color
        ? this.colorizeStatusCode(networkData.status)
        : networkData.status;
      parts.push(statusFormatted);
    }

    // Duration
    if (networkData.duration !== undefined) {
      const duration = `${networkData.duration}ms`;
      parts.push(color ? chalk.gray(duration) : duration);
    }

    // Size
    if (networkData.size !== undefined) {
      const size = this.formatBytes(networkData.size);
      parts.push(color ? chalk.gray(size) : size);
    }

    return parts.join(' ');
  }

  /**
   * Format log as table row
   */
  static formatLogAsTable(logData, options) {
    const { color, timestamp } = options;

    return [
      timestamp && logData.timestamp
        ? new Date(logData.timestamp).toLocaleTimeString()
        : '',
      color
        ? this.colorizeLevel(logData.level || 'log')
        : (logData.level || 'log').toUpperCase(),
      logData.appName || '',
      logData.message || '',
    ];
  }

  /**
   * Colorize log level
   */
  static colorizeLevel(level) {
    const levelUpper = level.toUpperCase();

    switch (levelUpper) {
      case 'ERROR':
        return chalk.red.bold(`[${levelUpper}]`);
      case 'WARN':
        return chalk.yellow.bold(`[${levelUpper}]`);
      case 'INFO':
        return chalk.blue.bold(`[${levelUpper}]`);
      case 'DEBUG':
        return chalk.gray.bold(`[${levelUpper}]`);
      case 'LOG':
      default:
        return chalk.white.bold(`[${levelUpper}]`);
    }
  }

  /**
   * Colorize HTTP method
   */
  static colorizeHttpMethod(method) {
    const methodUpper = method.toUpperCase();

    switch (methodUpper) {
      case 'GET':
        return chalk.green(methodUpper);
      case 'POST':
        return chalk.blue(methodUpper);
      case 'PUT':
        return chalk.yellow(methodUpper);
      case 'DELETE':
        return chalk.red(methodUpper);
      case 'PATCH':
        return chalk.magenta(methodUpper);
      default:
        return chalk.white(methodUpper);
    }
  }

  /**
   * Colorize HTTP status code
   */
  static colorizeStatusCode(status) {
    const statusNum = parseInt(status, 10);

    if (statusNum >= 200 && statusNum < 300) {
      return chalk.green(status);
    } else if (statusNum >= 300 && statusNum < 400) {
      return chalk.yellow(status);
    } else if (statusNum >= 400 && statusNum < 500) {
      return chalk.red(status);
    } else if (statusNum >= 500) {
      return chalk.red.bold(status);
    } else {
      return chalk.white(status);
    }
  }

  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Truncate text to specified length
   */
  static truncate(text, maxLength = 100) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - 3)}...`;
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  static formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else if (ms < 3600000) {
      return `${(ms / 60000).toFixed(1)}m`;
    } else {
      return `${(ms / 3600000).toFixed(1)}h`;
    }
  }
}

module.exports = LogFormatter;
