/**
 * Unit tests for StorageMonitor class
 */

// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.sentMessages = []; // Initialize immediately

    // Simulate connection after a short delay
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data) {
    this.lastSentMessage = JSON.parse(data);
    // Store all sent messages for testing
    this.sentMessages.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
};

// Add WebSocket constants
global.WebSocket.OPEN = 1;
global.WebSocket.CLOSED = 3;

// Mock browser storage APIs
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

global.sessionStorage = {
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

global.document = {
  cookie: '',
};

global.window = {
  location: {
    hostname: 'localhost',
  },
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
};

const StorageMonitor = require('../StorageMonitor');

describe('StorageMonitor', () => {
  let monitor;

  beforeEach(() => {
    // Reset storage
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = '';

    // Create new monitor instance
    monitor = new StorageMonitor({
      serverHost: 'localhost',
      serverPort: 3002,
      pollInterval: 100, // Fast polling for tests
    });
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }
  });

  describe('Constructor', () => {
    test('should create instance with default config', () => {
      const defaultMonitor = new StorageMonitor();

      expect(defaultMonitor.config.serverHost).toBe('localhost');
      expect(defaultMonitor.config.serverPort).toBe(3002);
      expect(defaultMonitor.config.enableCookies).toBe(true);
      expect(defaultMonitor.config.enableLocalStorage).toBe(true);
      expect(defaultMonitor.config.enableSessionStorage).toBe(true);
      expect(defaultMonitor.config.enableIndexedDB).toBe(true);
    });

    test('should merge custom config with defaults', () => {
      const customMonitor = new StorageMonitor({
        serverPort: 4000,
        enableCookies: false,
        pollInterval: 2000,
      });

      expect(customMonitor.config.serverPort).toBe(4000);
      expect(customMonitor.config.enableCookies).toBe(false);
      expect(customMonitor.config.pollInterval).toBe(2000);
      expect(customMonitor.config.serverHost).toBe('localhost'); // default
    });

    test('should generate session ID', () => {
      expect(monitor.config.sessionId).toMatch(/^clp_storage_\d+_[a-z0-9]+$/);
    });
  });

  describe('Initialization', () => {
    test('should initialize and connect to WebSocket', async () => {
      const result = await monitor.init();

      expect(result).toBe(monitor);
      expect(monitor.isConnected).toBe(true);
      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.ws).toBeDefined();
      expect(monitor.ws.url).toBe('ws://localhost:3002');
    });

    test('should send connection message on init', async () => {
      await monitor.init();

      // Wait a bit for the message to be sent
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(monitor.ws.sentMessages).toBeDefined();
      expect(monitor.ws.sentMessages.length).toBeGreaterThan(0);

      const connectMessage = monitor.ws.sentMessages.find(
        msg => msg.type === 'storage_connect'
      );
      expect(connectMessage).toEqual({
        type: 'storage_connect',
        sessionId: monitor.config.sessionId,
        timestamp: expect.any(String),
        config: {
          enableCookies: true,
          enableLocalStorage: true,
          enableSessionStorage: true,
          enableIndexedDB: true,
        },
      });
    });
  });

  describe('Storage Detection', () => {
    beforeEach(async () => {
      await monitor.init();
    });

    test('should detect localStorage changes', () => {
      localStorage.setItem('test_key', 'test_value');

      const currentStorage = monitor._getCurrentLocalStorage();
      expect(currentStorage.has('test_key')).toBe(true);
      expect(currentStorage.get('test_key')).toEqual({
        key: 'test_key',
        value: 'test_value',
        timestamp: expect.any(String),
      });
    });

    test('should detect sessionStorage changes', () => {
      sessionStorage.setItem('session_key', 'session_value');

      const currentStorage = monitor._getCurrentSessionStorage();
      expect(currentStorage.has('session_key')).toBe(true);
      expect(currentStorage.get('session_key')).toEqual({
        key: 'session_key',
        value: 'session_value',
        timestamp: expect.any(String),
      });
    });

    test('should detect cookie changes', () => {
      document.cookie = 'test_cookie=cookie_value';

      const currentCookies = monitor._getCurrentCookies();
      expect(currentCookies.has('test_cookie')).toBe(true);
      expect(currentCookies.get('test_cookie')).toEqual({
        name: 'test_cookie',
        value: 'cookie_value',
        domain: 'localhost',
        path: '/',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Change Detection', () => {
    beforeEach(async () => {
      await monitor.init();
    });

    test('should detect localStorage additions', () => {
      // Set initial state
      localStorage.setItem('existing_key', 'existing_value');
      const initialStorage = monitor._getCurrentLocalStorage();
      monitor.previousState.localStorage = new Map(initialStorage);

      // Add new item
      localStorage.setItem('new_key', 'new_value');
      const currentStorage = monitor._getCurrentLocalStorage();
      const changes = monitor._detectStorageChanges(
        'localStorage',
        currentStorage
      );

      expect(changes.hasChanges).toBe(true);
      expect(changes.added).toHaveLength(1);
      expect(changes.added[0]).toEqual({
        key: 'new_key',
        value: 'new_value',
        timestamp: expect.any(String),
      });
    });

    test('should detect localStorage modifications', () => {
      // Set initial state
      localStorage.setItem('test_key', 'old_value');
      const initialStorage = monitor._getCurrentLocalStorage();
      monitor.previousState.localStorage = new Map(initialStorage);

      // Modify existing item
      localStorage.setItem('test_key', 'new_value');
      const currentStorage = monitor._getCurrentLocalStorage();
      const changes = monitor._detectStorageChanges(
        'localStorage',
        currentStorage
      );

      expect(changes.hasChanges).toBe(true);
      expect(changes.modified).toHaveLength(1);
      expect(changes.modified[0]).toEqual({
        key: 'test_key',
        value: 'new_value',
        oldValue: 'old_value',
        timestamp: expect.any(String),
      });
    });

    test('should detect localStorage deletions', () => {
      // Set initial state
      localStorage.setItem('test_key', 'test_value');
      const initialStorage = monitor._getCurrentLocalStorage();
      monitor.previousState.localStorage = new Map(initialStorage);

      // Remove item
      localStorage.removeItem('test_key');
      const currentStorage = monitor._getCurrentLocalStorage();
      const changes = monitor._detectStorageChanges(
        'localStorage',
        currentStorage
      );

      expect(changes.hasChanges).toBe(true);
      expect(changes.deleted).toHaveLength(1);
      expect(changes.deleted[0]).toEqual({
        key: 'test_key',
        value: 'test_value',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Method Interception', () => {
    beforeEach(async () => {
      await monitor.init();
    });

    test('should intercept localStorage.setItem', () => {
      // Get the original method from the monitor's stored reference
      const originalSetItem = monitor.originalMethods['localStorage_setItem'];

      // Verify interception is active (method should be different from original)
      expect(localStorage.setItem).not.toBe(originalSetItem);
      expect(originalSetItem).toBeDefined();

      // Test that original functionality still works
      localStorage.setItem('intercepted_key', 'intercepted_value');
      expect(localStorage.getItem('intercepted_key')).toBe('intercepted_value');
    });

    test('should restore original methods on stop', () => {
      // Get the original method from the monitor's stored reference
      const originalSetItem = monitor.originalMethods['localStorage_setItem'];

      // Verify interception is active
      expect(localStorage.setItem).not.toBe(originalSetItem);
      expect(originalSetItem).toBeDefined();

      // Stop monitoring
      monitor.stop();

      // Verify restoration - the method should be restored to original
      expect(localStorage.setItem).toBe(originalSetItem);
    });
  });

  describe('WebSocket Communication', () => {
    beforeEach(async () => {
      await monitor.init();
    });

    test('should send storage updates via WebSocket', () => {
      const testData = {
        hasChanges: true,
        added: [
          { key: 'test', value: 'value', timestamp: new Date().toISOString() },
        ],
        modified: [],
        deleted: [],
        current: [],
      };

      monitor._sendStorageUpdate('localStorage', testData);

      // Check the most recent message
      const messages = monitor.ws.sentMessages || [];
      const lastMessage = messages[messages.length - 1];

      expect(lastMessage).toEqual({
        type: 'storage_update',
        subType: 'localStorage',
        sessionId: monitor.config.sessionId,
        timestamp: expect.any(String),
        data: testData,
      });
    });
  });

  describe('Cleanup', () => {
    test('should stop monitoring and cleanup resources', async () => {
      await monitor.init();

      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.isConnected).toBe(true);

      monitor.stop();

      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.isConnected).toBe(false);
      expect(monitor.ws).toBe(null);
    });
  });
});
