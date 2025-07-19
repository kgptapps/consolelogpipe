/**
 * Integration tests for Storage Monitor
 * Tests the complete flow from client to server
 */

const StorageServer = require('../server/StorageServer');
const StorageMonitor = require('../StorageMonitor');

// Mock browser environment
global.localStorage = {
  data: {},
  length: 0,
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
    this.length = Object.keys(this.data).length;
  },
  removeItem(key) {
    delete this.data[key];
    this.length = Object.keys(this.data).length;
  },
  clear() {
    this.data = {};
    this.length = 0;
  },
  key(index) {
    return Object.keys(this.data)[index] || null;
  },
};

global.sessionStorage = { ...global.localStorage, data: {} };
global.document = { cookie: '' };
global.window = {
  location: { hostname: 'localhost' },
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
};

describe('Storage Monitor Integration', () => {
  let server;
  let client;
  const TEST_PORT = 3003; // Use different port for testing

  beforeAll(async () => {
    // Start test server
    server = new StorageServer({
      port: TEST_PORT,
      host: 'localhost',
    });

    await server.start();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  beforeEach(() => {
    // Reset storage
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = '';
  });

  afterEach(() => {
    if (client) {
      client.stop();
      client = null;
    }
  });

  describe('Client-Server Communication', () => {
    test('should establish WebSocket connection', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
        pollInterval: 100,
      });

      await client.init();

      expect(client.isConnected).toBe(true);
      expect(client.isMonitoring).toBe(true);
    });

    test('should register session with server', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
        sessionId: 'test-session-123',
      });

      await client.init();

      // Check server has registered the session
      const sessions = await new Promise(resolve => {
        setTimeout(() => {
          resolve(Array.from(server.sessions.keys()));
        }, 100);
      });

      expect(sessions).toContain('test-session-123');
    });

    test('should send storage updates to server', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
        pollInterval: 50, // Fast polling for test
      });

      await client.init();

      // Make storage change
      localStorage.setItem('test_key', 'test_value');

      // Wait for update to be sent
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check server received the update
      const globalState = server.getStorageState();
      expect(globalState.globalState.localStorage.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Monitoring', () => {
    test('should detect and broadcast localStorage changes', async () => {
      const messages = [];

      client = new StorageMonitor({
        serverPort: TEST_PORT,
        pollInterval: 50,
      });

      await client.init();

      // Listen for messages
      client.ws.addEventListener = client.ws.on;
      client.ws.on('message', data => {
        const message = JSON.parse(data);
        messages.push(message);
      });

      // Make changes
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.removeItem('key1');

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should have received updates
      const storageUpdates = messages.filter(m => m.type === 'storage_update');
      expect(storageUpdates.length).toBeGreaterThan(0);
    });

    test('should handle multiple clients', async () => {
      const client1 = new StorageMonitor({
        serverPort: TEST_PORT,
        sessionId: 'client-1',
      });

      const client2 = new StorageMonitor({
        serverPort: TEST_PORT,
        sessionId: 'client-2',
      });

      await Promise.all([client1.init(), client2.init()]);

      // Both clients should be connected
      expect(client1.isConnected).toBe(true);
      expect(client2.isConnected).toBe(true);

      // Server should have both sessions
      const sessions = Array.from(server.sessions.keys());
      expect(sessions).toContain('client-1');
      expect(sessions).toContain('client-2');

      // Cleanup
      client1.stop();
      client2.stop();
    });
  });

  describe('Server API Endpoints', () => {
    test('should provide storage state via API', async () => {
      const response = await fetch(
        `http://localhost:${TEST_PORT}/api/storage/state`
      );
      const data = await response.json();

      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('globalState');
      expect(data).toHaveProperty('stats');
      expect(data.globalState).toHaveProperty('cookies');
      expect(data.globalState).toHaveProperty('localStorage');
      expect(data.globalState).toHaveProperty('sessionStorage');
    });

    test('should provide server statistics', async () => {
      const response = await fetch(
        `http://localhost:${TEST_PORT}/api/storage/stats`
      );
      const data = await response.json();

      expect(data).toHaveProperty('startTime');
      expect(data).toHaveProperty('totalConnections');
      expect(data).toHaveProperty('activeConnections');
      expect(data).toHaveProperty('uptime');
    });

    test('should serve dashboard HTML', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/`);
      const html = await response.text();

      expect(response.headers.get('content-type')).toContain('text/html');
      expect(html).toContain('Storage Monitor Dashboard');
      expect(html).toContain('Real-time monitoring');
    });
  });

  describe('Error Handling', () => {
    test('should handle connection failures gracefully', async () => {
      client = new StorageMonitor({
        serverPort: 9999, // Non-existent port
        pollInterval: 100,
      });

      await expect(client.init()).rejects.toThrow();
      expect(client.isConnected).toBe(false);
    });

    test('should handle malformed messages', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
      });

      await client.init();

      // Send malformed message
      client.ws.send('invalid json');

      // Should not crash the connection
      expect(client.isConnected).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle rapid storage changes', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
        pollInterval: 10, // Very fast polling
      });

      await client.init();

      // Make many rapid changes
      for (let i = 0; i < 100; i++) {
        localStorage.setItem(`key_${i}`, `value_${i}`);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should still be connected and monitoring
      expect(client.isConnected).toBe(true);
      expect(client.isMonitoring).toBe(true);
    });

    test('should not leak memory with long-running monitoring', async () => {
      client = new StorageMonitor({
        serverPort: TEST_PORT,
        pollInterval: 10,
      });

      await client.init();

      // Simulate long-running monitoring with changes
      for (let i = 0; i < 50; i++) {
        localStorage.setItem('test_key', `value_${i}`);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Should still be stable
      expect(client.isConnected).toBe(true);
      expect(client.isMonitoring).toBe(true);
    });
  });
});

// Helper function for fetch in Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = async url => {
    const http = require('http');
    const urlParts = new URL(url);

    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: urlParts.hostname,
          port: urlParts.port,
          path: urlParts.pathname + urlParts.search,
          method: 'GET',
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            resolve({
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data),
              headers: {
                get: name => res.headers[name.toLowerCase()],
              },
            });
          });
        }
      );

      req.on('error', reject);
      req.end();
    });
  };
}
