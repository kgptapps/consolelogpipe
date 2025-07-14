/**
 * NetworkCapture - Main entry point for network capture functionality
 *
 * This file imports the modular NetworkCapture implementation from the network/ directory.
 * The original monolithic file has been split into logical modules for better maintainability.
 */

const { NetworkCapture } = require('./network');

// Export the NetworkCapture class
// eslint-disable-next-line no-undef
module.exports = NetworkCapture;
