/**
 * Console Log Pipe Client Library v1.1.24
 * Browser client library for Console Log Pipe - Real-time log streaming
 * https://github.com/kgptapps/consolelogpipe/tree/main/packages/client#readme
 *
 * Copyright (c) 2025 kgptapps
 * Licensed under MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ConsoleLogPipe = factory());
})(this, (function () { 'use strict';

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var require$$0 = {name:"@kansnpms/console-log-pipe-client",version:"1.1.24",description:"Browser client library for Console Log Pipe - Real-time log streaming",main:"dist/console-log-pipe.cjs.js",module:"dist/console-log-pipe.esm.js",browser:"dist/console-log-pipe.umd.js",types:"src/index.d.ts",files:["dist/*.js","dist/*.js.map","src/index.d.ts","README.md"],repository:{type:"git",url:"git+https://github.com/kgptapps/consolelogpipe.git",directory:"packages/client"},author:"kgptapps",license:"MIT",homepage:"https://github.com/kgptapps/consolelogpipe/tree/main/packages/client#readme",bugs:{url:"https://github.com/kgptapps/consolelogpipe/issues"},keywords:["console","logging","browser","client","real-time","debugging"],scripts:{build:"rollup -c --environment NODE_ENV:production","build:dev":"rollup -c --environment NODE_ENV:development","build:prod":"rollup -c --environment NODE_ENV:production",prepublishOnly:"npm run build",clean:"rimraf dist types",dev:"rollup -c --watch",test:"jest","test:watch":"jest --watch","test:coverage":"jest --coverage",lint:"eslint src --ext .js,.ts","lint:fix":"eslint src --ext .js,.ts --fix","type-check":"tsc --noEmit"},devDependencies:{"@babel/core":"^7.22.5","@babel/preset-env":"^7.22.5","@rollup/plugin-babel":"^6.0.3","@rollup/plugin-commonjs":"^25.0.2","@rollup/plugin-json":"^6.1.0","@rollup/plugin-node-resolve":"^15.1.0","@rollup/plugin-terser":"^0.4.3","@rollup/plugin-typescript":"^11.1.2","@types/jest":"^29.5.2",eslint:"^8.43.0",jest:"^29.5.0","jest-environment-jsdom":"^29.5.0",rimraf:"^5.0.1",rollup:"^3.25.3",typescript:"^5.1.6"},engines:{node:">=16.0.0"},publishConfig:{access:"public"}};

  /**
   * Console Log Pipe Client Library - Simple Working Version with Network Capture
   */

  /* eslint-env node */
  /* eslint-disable no-console */

  // Get version from package.json
  const { version } = require$$0;

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
  var browser = ConsoleLogPipeAPI;

  var browser$1 = /*@__PURE__*/getDefaultExportFromCjs(browser);

  return browser$1;

}));
//# sourceMappingURL=console-log-pipe.umd.js.map
