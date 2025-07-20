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
 */
async function init(options = {}) {
  const instance = new ConsoleLogPipe(options);
  await instance.init();
  instance.start();
  return instance;
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
