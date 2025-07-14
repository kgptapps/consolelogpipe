/* eslint-env node */
/**
 * Transport Layer - Console Log Pipe Client
 *
 * Exports all transport implementations for log transmission
 */

const HttpTransport = require('./HttpTransport');

module.exports = {
  HttpTransport,
};
