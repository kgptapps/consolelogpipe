/**
 * Console Log Pipe Client Library - Simple Working Version with Network Capture
 */

/* eslint-env node */
/* eslint-disable no-console */

// Get version from package.json
const { version } = require('../package.json');

// Simple Console Log Pipe implementation
const ConsoleLogPipeAPI = {
  ws: null,
  isConnected: false,
  originalConsole: {},
  originalFetch: null,
  originalXHR: null,

  /**
   * Initialize Console Log Pipe
   */
  async init(options = {}) {
    const { serverPort = 3001, serverHost = 'localhost' } = options;

    console.log('Initializing Console Log Pipe...');

    // Connect to WebSocket
    const wsUrl = `ws://${serverHost}:${serverPort}`;
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('✅ Connected to Console Log Pipe CLI');

        // Intercept console methods
        this.interceptConsole();

        // Intercept network requests
        this.interceptNetwork();

        resolve(this);
      };

      this.ws.onerror = error => {
        console.error('❌ Console Log Pipe connection failed:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('Console Log Pipe disconnected');
      };
    });
  },

  /**
   * Intercept console methods
   */
  interceptConsole() {
    const levels = ['log', 'warn', 'error', 'info', 'debug'];

    levels.forEach(level => {
      if (typeof console[level] === 'function') {
        // Store original
        this.originalConsole[level] = console[level];

        // Replace with intercepted version
        console[level] = (...args) => {
          // Call original console method
          this.originalConsole[level].apply(console, args);

          // Send to CLI
          this.sendLog(level, args);
        };
      }
    });

    console.log('✅ Console methods intercepted');
  },

  /**
   * Intercept network requests
   */
  interceptNetwork() {
    // Skip network interception in Node.js environment
    if (typeof window === 'undefined') {
      console.log('✅ Network interception skipped (Node.js environment)');
      return;
    }

    // Intercept fetch
    if (typeof window.fetch === 'function') {
      this.originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = args[0];
        const options = args[1] || {};

        try {
          const response = await this.originalFetch.apply(window, args);
          const duration = Date.now() - startTime;

          this.sendNetworkLog({
            type: 'fetch',
            url,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            duration,
            success: response.ok,
          });

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;

          this.sendNetworkLog({
            type: 'fetch',
            url,
            method: options.method || 'GET',
            error: error.message,
            duration,
            success: false,
          });

          throw error;
        }
      };
    }

    // Intercept XMLHttpRequest
    if (typeof window.XMLHttpRequest === 'function') {
      this.originalXHR = window.XMLHttpRequest;

      window.XMLHttpRequest = function () {
        const xhr = new ConsoleLogPipeAPI.originalXHR();
        const startTime = Date.now();
        let url = '';
        let method = '';

        const originalOpen = xhr.open;
        xhr.open = function (m, u, ...args) {
          method = m;
          url = u;
          return originalOpen.apply(this, [m, u, ...args]);
        };

        const originalSend = xhr.send;
        xhr.send = function (...args) {
          const onLoad = () => {
            const duration = Date.now() - startTime;
            ConsoleLogPipeAPI.sendNetworkLog({
              type: 'xhr',
              url,
              method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration,
              success: xhr.status >= 200 && xhr.status < 300,
            });
          };

          const onError = () => {
            const duration = Date.now() - startTime;
            ConsoleLogPipeAPI.sendNetworkLog({
              type: 'xhr',
              url,
              method,
              error: 'Network error',
              duration,
              success: false,
            });
          };

          xhr.addEventListener('load', onLoad);
          xhr.addEventListener('error', onError);

          return originalSend.apply(this, args);
        };

        return xhr;
      };
    }

    console.log('✅ Network requests intercepted');
  },

  /**
   * Send log to CLI
   */
  sendLog(level, args) {
    if (
      !this.ws ||
      !this.isConnected ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const logData = {
      type: 'log',
      data: {
        level,
        message,
        timestamp: new Date().toISOString(),
        source: 'browser',
      },
    };

    this.ws.send(JSON.stringify(logData));
  },

  /**
   * Send network log to CLI
   */
  sendNetworkLog(networkData) {
    if (
      !this.ws ||
      !this.isConnected ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const logData = {
      type: 'network',
      data: {
        ...networkData,
        timestamp: new Date().toISOString(),
        source: 'browser',
      },
    };

    this.ws.send(JSON.stringify(logData));
  },

  /**
   * Restore original console methods and network functions
   */
  restore() {
    // Restore console methods
    Object.keys(this.originalConsole).forEach(level => {
      if (this.originalConsole[level]) {
        console[level] = this.originalConsole[level];
      }
    });

    // Restore network functions
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR;
    }

    if (this.ws) {
      this.ws.close();
    }
  },

  // Version information
  version,
};

// Export the API object directly for UMD
module.exports = ConsoleLogPipeAPI;
