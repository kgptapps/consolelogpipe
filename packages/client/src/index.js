/**
 * Console Log Pipe Client Library
 *
 * Main entry point for the browser client library that captures console logs,
 * errors, and network requests from web applications.
 */

import LogCapture from './core/LogCapture.js';

// Export the main LogCapture class
export { LogCapture };

// Export as default for easier importing
export default LogCapture;

// Version information
export const version = '1.0.0';

// Convenience function to create and start a LogCapture instance
export function createLogCapture(options = {}) {
  const logCapture = new LogCapture(options);
  return logCapture;
}

// Auto-start functionality for simple use cases
export function autoStart(options = {}) {
  const logCapture = createLogCapture(options);
  logCapture.start();
  return logCapture;
}
