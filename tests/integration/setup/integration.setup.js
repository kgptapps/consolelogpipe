// Integration test setup

const { spawn } = require('child_process');
const path = require('path');

// Global test timeout for integration tests
jest.setTimeout(30000);

// Integration test utilities
global.integrationTestUtils = {
  // Start a test server
  startTestServer: (port = 3001) => {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(
        __dirname,
        '../../../packages/cli/src/cli.js'
      );
      const server = spawn(
        'node',
        [serverPath, 'start', '--port', port.toString()],
        {
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'test' },
        }
      );

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          server.kill();
          reject(new Error('Server start timeout'));
        }
      }, 10000);

      server.stdout.on('data', data => {
        const output = data.toString();
        if (output.includes('Server started') || output.includes('listening')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            resolve({
              server,
              port,
              stop: () => {
                return new Promise(resolve => {
                  server.on('close', resolve);
                  server.kill();
                });
              },
            });
          }
        }
      });

      server.stderr.on('data', data => {
        console.error('Server error:', data.toString());
      });

      server.on('error', error => {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  },

  // Make HTTP request to test server
  makeRequest: async (url, options = {}) => {
    const fetch = require('node-fetch');
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        timeout: 5000,
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        json: async () => response.json(),
        text: async () => response.text(),
      };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  },

  // Create WebSocket connection
  createWebSocketConnection: url => {
    const WebSocket = require('ws');
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        resolve({
          ws,
          send: data => ws.send(JSON.stringify(data)),
          close: () => ws.close(),
          onMessage: callback =>
            ws.on('message', data => {
              try {
                callback(JSON.parse(data.toString()));
              } catch (error) {
                callback(data.toString());
              }
            }),
          onClose: callback => ws.on('close', callback),
          onError: callback => ws.on('error', callback),
        });
      });

      ws.on('error', error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  },

  // Wait for condition
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Condition not met within timeout');
  },

  // Generate test data
  generateTestLogs: (count = 10) => {
    const logs = [];
    const levels = ['log', 'error', 'warn', 'info', 'debug'];

    for (let i = 0; i < count; i++) {
      logs.push({
        id: `test-log-${i}`,
        timestamp: Date.now() + i,
        level: levels[i % levels.length],
        message: `Test log message ${i}`,
        args: [`arg${i}`, { data: `value${i}` }],
        metadata: {
          url: 'http://localhost:3000/test',
          userAgent: 'Test Browser',
          sessionId: 'test-session',
        },
      });
    }

    return logs;
  },

  // Clean up test data
  cleanup: async () => {
    // Clean up any test files, databases, etc.
    // This will be implemented as needed
  },
};

// Global cleanup after all tests
afterAll(async () => {
  await global.integrationTestUtils.cleanup();
});
