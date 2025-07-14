/* eslint-env node */
/**
 * Console Log Pipe Client Library
 *
 * Main entry point for the browser client library that captures console logs,
 * errors, and network requests from web applications.
 */

const ConsoleLogPipe = require('./ConsoleLogPipe');
const { LogCapture } = require('./core/log');
const { NetworkCapture } = require('./core/network');
const ErrorCapture = require('./core/ErrorCapture');
const { HttpTransport } = require('./transport');

// Main API object
const ConsoleLogPipeAPI = {
  /**
   * Initialize Console Log Pipe with configuration
   */
  async init(options = {}) {
    const instance = new ConsoleLogPipe(options);
    await instance.init();
    instance.start();
    return instance;
  },

  /**
   * Create a new Console Log Pipe instance without auto-starting
   */
  create(options = {}) {
    return new ConsoleLogPipe(options);
  },

  // Export individual components for advanced usage
  ConsoleLogPipe,
  LogCapture,
  NetworkCapture,
  ErrorCapture,
  HttpTransport,

  // Version information
  version: '1.1.4',
};

// Export the main API
module.exports = ConsoleLogPipeAPI;

// Also export as default for ES6 imports
module.exports.default = ConsoleLogPipeAPI;
