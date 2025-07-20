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

const { version } = require('../package.json');

/**
 * Initialize Console Log Pipe with configuration
 * @param {Object} options - Configuration options
 * @param {number} options.port - Required port number for CLI server
 * @param {function} [options.onReady] - Callback when initialization is complete
 * @param {function} [options.onError] - Callback when initialization fails
 * @returns {Promise<ConsoleLogPipe>} Promise that resolves when ready
 */
async function init(options = {}) {
  // Enforce port parameter
  if (!options.port || typeof options.port !== 'number') {
    const error = new Error(
      'Port number is required. Usage: ConsoleLogPipe.init({ port: 3001 })'
    );
    if (typeof options.onError === 'function') {
      try {
        options.onError(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
    throw error;
  }

  // Validate port range
  if (options.port < 1024 || options.port > 65535) {
    const error = new Error(
      `Port must be between 1024 and 65535, got: ${options.port}`
    );
    if (typeof options.onError === 'function') {
      try {
        options.onError(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
    throw error;
  }

  const { onReady, onError, ...config } = options;

  try {
    const instance = new ConsoleLogPipe(config);
    await instance.init();
    instance.start();

    // Mark as ready and call callback if provided
    instance.isReady = true;
    if (typeof onReady === 'function') {
      try {
        onReady(instance);
      } catch (callbackError) {
        console.error('Error in onReady callback:', callbackError);
      }
    }

    return instance;
  } catch (error) {
    // Call error callback if provided
    if (typeof onError === 'function') {
      try {
        onError(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
    throw error;
  }
}

/**
 * Create a new Console Log Pipe instance without auto-starting
 */
function create(options = {}) {
  return new ConsoleLogPipe(options);
}

// Main API - single default export following npm standards
const ConsoleLogPipeAPI = init;

// Attach additional methods and classes to the main function
ConsoleLogPipeAPI.init = init;
ConsoleLogPipeAPI.create = create;
ConsoleLogPipeAPI.version = version;

// Attach classes for advanced usage
ConsoleLogPipeAPI.ConsoleLogPipe = ConsoleLogPipe;
ConsoleLogPipeAPI.LogCapture = LogCapture;
ConsoleLogPipeAPI.NetworkCapture = NetworkCapture;
ConsoleLogPipeAPI.ErrorCapture = ErrorCapture;

// Single export following npm publishing standards
module.exports = ConsoleLogPipeAPI;
