/**
 * Log Module - Modular log capture system
 *
 * This module provides a comprehensive log capture system split into
 * logical components for better maintainability and testing.
 */

const LogCapture = require('./LogCapture');
const LogUtils = require('./LogUtils');
const LogAnalyzer = require('./LogAnalyzer');
const LogFormatter = require('./LogFormatter');
const LogInterceptor = require('./LogInterceptor');

// eslint-disable-next-line no-undef
module.exports = {
  LogCapture,
  LogUtils,
  LogAnalyzer,
  LogFormatter,
  LogInterceptor,
};
