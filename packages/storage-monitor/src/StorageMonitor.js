/**
 * StorageMonitor - Real-time browser storage and cookies monitoring
 *
 * Monitors and streams changes to:
 * - Cookies
 * - localStorage
 * - sessionStorage
 * - IndexedDB operations
 */

class StorageMonitor {
  constructor(options = {}) {
    this.config = {
      serverHost: options.serverHost || 'localhost',
      serverPort: options.serverPort || 3002,
      sessionId: options.sessionId || this._generateSessionId(),
      enableCookies: options.enableCookies !== false,
      enableLocalStorage: options.enableLocalStorage !== false,
      enableSessionStorage: options.enableSessionStorage !== false,
      enableIndexedDB: options.enableIndexedDB !== false,
      pollInterval: options.pollInterval || 1000, // ms
      ...options,
    };

    this.ws = null;
    this.isConnected = false;
    this.isMonitoring = false;

    // Storage state tracking
    this.previousState = {
      cookies: new Map(),
      localStorage: new Map(),
      sessionStorage: new Map(),
      indexedDB: new Map(),
    };

    // Monitoring intervals
    this.intervals = new Map();

    // Original storage methods (for restoration)
    this.originalMethods = {};
  }

  /**
   * Initialize storage monitoring
   */
  async init() {
    // Initialize Storage Monitor

    try {
      // Connect to WebSocket
      await this._connectWebSocket();

      // Start monitoring
      this._startMonitoring();

      // Storage Monitor connected and monitoring
      return this;
    } catch (error) {
      // Storage Monitor initialization failed
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.error('❌ Storage Monitor initialization failed:', error);
      }
      throw error;
    }
  }

  /**
   * Stop monitoring and cleanup
   */
  stop() {
    // Stopping Storage Monitor

    this.isMonitoring = false;

    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Restore original methods
    this._restoreOriginalMethods();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    // Storage Monitor stopped
  }

  /**
   * Get current storage state
   */
  getCurrentState() {
    return {
      cookies: this._getCurrentCookies(),
      localStorage: this._getCurrentLocalStorage(),
      sessionStorage: this._getCurrentSessionStorage(),
      indexedDB: this._getCurrentIndexedDBInfo(),
    };
  }

  /**
   * Connect to WebSocket server
   */
  _connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.config.serverHost}:${this.config.serverPort}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;

        // Send initial connection message
        this._sendMessage({
          type: 'storage_connect',
          sessionId: this.config.sessionId,
          timestamp: new Date().toISOString(),
          config: {
            enableCookies: this.config.enableCookies,
            enableLocalStorage: this.config.enableLocalStorage,
            enableSessionStorage: this.config.enableSessionStorage,
            enableIndexedDB: this.config.enableIndexedDB,
          },
        });

        resolve();
      };

      this.ws.onerror = error => {
        if (this.config.debug) {
          // eslint-disable-next-line no-console
          console.error('❌ Storage Monitor WebSocket error:', error);
        }
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Storage Monitor disconnected
      };

      this.ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this._handleServerMessage(message);
        } catch (error) {
          if (this.config.debug) {
            // eslint-disable-next-line no-console
            console.error('Error parsing server message:', error);
          }
        }
      };
    });
  }

  /**
   * Start monitoring all enabled storage types
   */
  _startMonitoring() {
    this.isMonitoring = true;

    // Initialize previous state with current state to properly detect changes
    if (this.config.enableCookies) {
      this.previousState.cookies = this._getCurrentCookies();
    }

    if (this.config.enableLocalStorage) {
      this.previousState.localStorage = this._getCurrentLocalStorage();
    }

    if (this.config.enableSessionStorage) {
      this.previousState.sessionStorage = this._getCurrentSessionStorage();
    }

    if (this.config.enableIndexedDB) {
      this.previousState.indexedDB = new Map(); // IndexedDB state is more complex
    }

    // Send initial state
    this._sendStorageUpdate('initial_state', this.getCurrentState());

    if (this.config.enableCookies) {
      this._startCookieMonitoring();
    }

    if (this.config.enableLocalStorage) {
      this._startLocalStorageMonitoring();
    }

    if (this.config.enableSessionStorage) {
      this._startSessionStorageMonitoring();
    }

    if (this.config.enableIndexedDB) {
      this._startIndexedDBMonitoring();
    }
  }

  /**
   * Start cookie monitoring
   */
  _startCookieMonitoring() {
    // Poll for cookie changes
    const interval = setInterval(() => {
      if (!this.isMonitoring) return;

      const currentCookies = this._getCurrentCookies();
      const changes = this._detectCookieChanges(currentCookies);

      if (changes.hasChanges) {
        this._sendStorageUpdate('cookies', changes);
      }
    }, this.config.pollInterval);

    this.intervals.set('cookies', interval);
  }

  /**
   * Start localStorage monitoring
   */
  _startLocalStorageMonitoring() {
    // Intercept localStorage methods
    this._interceptStorageMethod('localStorage', 'setItem');
    this._interceptStorageMethod('localStorage', 'removeItem');
    this._interceptStorageMethod('localStorage', 'clear');

    // Also poll for external changes
    const interval = setInterval(() => {
      if (!this.isMonitoring) return;

      const currentStorage = this._getCurrentLocalStorage();
      const changes = this._detectStorageChanges(
        'localStorage',
        currentStorage
      );

      if (changes.hasChanges) {
        this._sendStorageUpdate('localStorage', changes);
      }
    }, this.config.pollInterval);

    this.intervals.set('localStorage', interval);
  }

  /**
   * Start sessionStorage monitoring
   */
  _startSessionStorageMonitoring() {
    // Intercept sessionStorage methods
    this._interceptStorageMethod('sessionStorage', 'setItem');
    this._interceptStorageMethod('sessionStorage', 'removeItem');
    this._interceptStorageMethod('sessionStorage', 'clear');

    // Also poll for external changes
    const interval = setInterval(() => {
      if (!this.isMonitoring) return;

      const currentStorage = this._getCurrentSessionStorage();
      const changes = this._detectStorageChanges(
        'sessionStorage',
        currentStorage
      );

      if (changes.hasChanges) {
        this._sendStorageUpdate('sessionStorage', changes);
      }
    }, this.config.pollInterval);

    this.intervals.set('sessionStorage', interval);
  }

  /**
   * Start IndexedDB monitoring
   */
  _startIndexedDBMonitoring() {
    // This is more complex and will be implemented in the next iteration
    // For now, just detect database existence
    const interval = setInterval(() => {
      if (!this.isMonitoring) return;

      // const currentDB = this._getCurrentIndexedDBInfo();
      // TODO: Implement IndexedDB change detection
    }, this.config.pollInterval * 2); // Less frequent polling for IndexedDB

    this.intervals.set('indexedDB', interval);
  }

  /**
   * Generate unique session ID
   */
  _generateSessionId() {
    return `clp_storage_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Send message to server
   */
  _sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send storage update to server
   */
  _sendStorageUpdate(type, data) {
    this._sendMessage({
      type: 'storage_update',
      subType: type,
      sessionId: this.config.sessionId,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Handle messages from server
   */
  _handleServerMessage(message) {
    switch (message.type) {
      case 'storage_info':
        // Storage Monitor server info received
        break;
      case 'storage_command':
        this._handleServerCommand(message.data);
        break;
      default:
        // Storage Monitor message received
        break;
    }
  }

  /**
   * Handle commands from server
   */
  _handleServerCommand(command) {
    switch (command.action) {
      case 'get_current_state':
        this._sendStorageUpdate('current_state', this.getCurrentState());
        break;
      case 'clear_storage':
        this._clearStorage(command.storageType);
        break;
    }
  }

  /**
   * Get current cookies
   */
  _getCurrentCookies() {
    const cookies = new Map();

    if (typeof document !== 'undefined' && document.cookie) {
      document.cookie.split(';').forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name) {
          cookies.set(name, {
            name,
            value: valueParts.join('=') || '',
            domain: window.location.hostname,
            path: '/',
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    return cookies;
  }

  /**
   * Get current localStorage
   */
  _getCurrentLocalStorage() {
    const storage = new Map();

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage.set(key, {
            key,
            value: localStorage.getItem(key),
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return storage;
  }

  /**
   * Get current sessionStorage
   */
  _getCurrentSessionStorage() {
    const storage = new Map();

    if (typeof sessionStorage !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          storage.set(key, {
            key,
            value: sessionStorage.getItem(key),
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return storage;
  }

  /**
   * Get current IndexedDB info
   */
  _getCurrentIndexedDBInfo() {
    // Basic IndexedDB detection - full implementation would be more complex
    const info = {
      available: typeof indexedDB !== 'undefined',
      databases: [],
      timestamp: new Date().toISOString(),
    };

    return info;
  }

  /**
   * Detect cookie changes
   */
  _detectCookieChanges(currentCookies) {
    const changes = {
      hasChanges: false,
      added: [],
      modified: [],
      deleted: [],
      current: Array.from(currentCookies.values()),
    };

    const previousCookies = this.previousState.cookies;

    // Check for added and modified cookies
    currentCookies.forEach((cookie, name) => {
      if (!previousCookies.has(name)) {
        changes.added.push(cookie);
        changes.hasChanges = true;
      } else if (previousCookies.get(name).value !== cookie.value) {
        changes.modified.push({
          ...cookie,
          oldValue: previousCookies.get(name).value,
        });
        changes.hasChanges = true;
      }
    });

    // Check for deleted cookies
    previousCookies.forEach((cookie, name) => {
      if (!currentCookies.has(name)) {
        changes.deleted.push(cookie);
        changes.hasChanges = true;
      }
    });

    // Update previous state
    this.previousState.cookies = new Map(currentCookies);

    return changes;
  }

  /**
   * Detect storage changes (localStorage/sessionStorage)
   */
  _detectStorageChanges(storageType, currentStorage) {
    const changes = {
      hasChanges: false,
      added: [],
      modified: [],
      deleted: [],
      current: Array.from(currentStorage.values()),
    };

    const previousStorage = this.previousState[storageType];

    // Check for added and modified items
    currentStorage.forEach((item, key) => {
      if (!previousStorage.has(key)) {
        changes.added.push(item);
        changes.hasChanges = true;
      } else if (previousStorage.get(key).value !== item.value) {
        changes.modified.push({
          ...item,
          oldValue: previousStorage.get(key).value,
        });
        changes.hasChanges = true;
      }
    });

    // Check for deleted items
    previousStorage.forEach((item, key) => {
      if (!currentStorage.has(key)) {
        changes.deleted.push(item);
        changes.hasChanges = true;
      }
    });

    // Update previous state
    this.previousState[storageType] = new Map(currentStorage);

    return changes;
  }

  /**
   * Intercept storage methods for real-time monitoring
   */
  _interceptStorageMethod(storageType, methodName) {
    const storage = window[storageType];
    if (!storage) return;

    const originalMethod = storage[methodName];
    this.originalMethods[`${storageType}_${methodName}`] = originalMethod;

    storage[methodName] = (...args) => {
      // Call original method
      const result = originalMethod.apply(storage, args);

      // Send immediate update
      setTimeout(() => {
        const currentStorage =
          storageType === 'localStorage'
            ? this._getCurrentLocalStorage()
            : this._getCurrentSessionStorage();
        const changes = this._detectStorageChanges(storageType, currentStorage);

        if (changes.hasChanges) {
          this._sendStorageUpdate(storageType, {
            ...changes,
            operation: methodName,
            args,
          });
        }
      }, 0);

      return result;
    };
  }

  /**
   * Restore original storage methods
   */
  _restoreOriginalMethods() {
    Object.keys(this.originalMethods).forEach(key => {
      const [storageType, methodName] = key.split('_');
      const storage = window[storageType];
      if (storage && this.originalMethods[key]) {
        storage[methodName] = this.originalMethods[key];
      }
    });
    this.originalMethods = {};
  }

  /**
   * Clear storage (for server commands)
   */
  _clearStorage(storageType) {
    switch (storageType) {
      case 'localStorage':
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        break;
      case 'sessionStorage':
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        break;
      case 'cookies':
        this._clearAllCookies();
        break;
    }
  }

  /**
   * Clear all cookies
   */
  _clearAllCookies() {
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageMonitor;
} else if (typeof window !== 'undefined') {
  window.StorageMonitor = StorageMonitor;
}
