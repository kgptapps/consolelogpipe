/**
 * Network Module - Modular network capture system
 *
 * This module provides a comprehensive network capture system split into
 * logical components for better maintainability and testing.
 */

const NetworkCapture = require('./NetworkCapture');
const NetworkUtils = require('./NetworkUtils');
const NetworkSanitizer = require('./NetworkSanitizer');
const NetworkAnalyzer = require('./NetworkAnalyzer');
const NetworkFormatter = require('./NetworkFormatter');
const NetworkInterceptor = require('./NetworkInterceptor');

// eslint-disable-next-line no-undef
module.exports = {
  NetworkCapture,
  NetworkUtils,
  NetworkSanitizer,
  NetworkAnalyzer,
  NetworkFormatter,
  NetworkInterceptor,
};
