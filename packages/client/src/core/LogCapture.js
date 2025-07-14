/**
 * LogCapture - Main entry point for log capture functionality
 *
 * This file imports the modular LogCapture implementation from the log/ directory.
 * The original monolithic file has been split into logical modules for better maintainability.
 */

const { LogCapture } = require('./log');

// Export the LogCapture class
// eslint-disable-next-line no-undef
module.exports = LogCapture;
