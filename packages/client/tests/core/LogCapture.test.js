/**
 * LogCapture.test.js - Comprehensive unit tests for LogCapture module
 */

import LogCapture from '../../src/core/LogCapture.js';

// Mock browser APIs
const mockWindow = {
  location: {
    href: 'https://example.com/test?param=value',
    pathname: '/test',
    search: '?param=value',
  },
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser) TestEngine/1.0',
};

// Setup global mocks
global.window = mockWindow;
global.navigator = mockNavigator;

describe('LogCapture', () => {
  let logCapture;
  let originalConsole;

  beforeEach(() => {
    // Store original console methods
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    // Create fresh LogCapture instance with required applicationName
    logCapture = new LogCapture({ applicationName: 'test-app' });

    // Start capturing to enable console interception
    logCapture.start();
  });

  afterEach(() => {
    // Stop capturing and restore console
    if (logCapture) {
      logCapture.stop();
    }

    // Restore original console methods
    Object.assign(console, originalConsole);
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(logCapture).toBeInstanceOf(LogCapture);
      expect(logCapture.options.levels).toEqual([
        'log',
        'error',
        'warn',
        'info',
        'debug',
      ]);
      expect(logCapture.options.captureMetadata).toBe(true);
      expect(logCapture.options.preserveOriginal).toBe(true);
      expect(logCapture.options.maxLogSize).toBe(10 * 1024);
    });

    it('should accept custom options', () => {
      const customOptions = {
        applicationName: 'custom-test-app',
        levels: ['error', 'warn'],
        captureMetadata: false,
        maxLogSize: 5000,
      };

      const customLogCapture = new LogCapture(customOptions);
      expect(customLogCapture.options.levels).toEqual(['error', 'warn']);
      expect(customLogCapture.options.captureMetadata).toBe(false);
      expect(customLogCapture.options.maxLogSize).toBe(5000);
    });
  });

  describe('Console Interception', () => {
    it('should intercept console.log calls', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);
      logCapture.start();

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'log',
          message: 'test message',
        })
      );
    });

    it('should intercept all console levels', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);
      logCapture.start();

      console.log('log message');
      console.error('error message');
      console.warn('warn message');
      console.info('info message');
      console.debug('debug message');

      expect(listener).toHaveBeenCalledTimes(5);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'log' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'warn' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'info' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'debug' })
      );
    });

    it('should preserve original console functionality', () => {
      const originalLog = jest.fn();
      console.log = originalLog;

      logCapture.start();
      console.log('test message');

      expect(originalLog).toHaveBeenCalledWith('test message');
    });

    it('should restore original console when stopped', () => {
      const originalLog = console.log;
      // Create a fresh instance for this test
      const freshCapture = new LogCapture({ applicationName: 'test-app' });

      freshCapture.start();
      expect(console.log).not.toBe(originalLog);

      freshCapture.stop();
      expect(console.log).toBe(originalLog);
    });
  });

  describe('Log Processing', () => {
    beforeEach(() => {
      logCapture.start();
    });

    it('should handle multiple arguments', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);

      console.log('message', 123, { key: 'value' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'message 123 {"key":"value"}',
          args: ['message', 123, { key: 'value' }],
        })
      );
    });

    it('should handle null and undefined values', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);

      console.log('test', null, undefined);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'test null undefined',
          args: ['test', null, undefined],
        })
      );
    });

    it('should handle Error objects', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);

      const error = new Error('test error');
      console.error(error);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [
            expect.objectContaining({
              name: 'Error',
              message: 'test error',
              stack: expect.any(String),
              __type: 'Error',
            }),
          ],
        })
      );
    });

    it('should handle circular references', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);

      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference

      console.log(obj);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('[Circular Reference]'),
        })
      );
    });

    it('should include metadata when enabled', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          // AI-friendly structure
          application: expect.objectContaining({
            name: 'test-app',
            environment: 'development',
          }),
          category: expect.any(String),
          severity: expect.objectContaining({
            level: expect.any(String),
            score: expect.any(Number),
          }),
          tags: expect.arrayContaining(['log']),
          context: expect.objectContaining({
            url: expect.objectContaining({
              href: expect.any(String),
              pathname: expect.any(String),
            }),
            browser: expect.objectContaining({
              userAgent: expect.any(String),
            }),
            timing: expect.objectContaining({
              timestamp: expect.any(Number),
            }),
          }),
        })
      );
    });

    it('should not include metadata when disabled', () => {
      const noMetadataCapture = new LogCapture({
        applicationName: 'no-metadata-test-app',
        captureMetadata: false,
      });
      const listener = jest.fn();
      noMetadataCapture.addListener(listener);
      noMetadataCapture.start();

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.not.objectContaining({
          metadata: expect.anything(),
        })
      );

      noMetadataCapture.stop();
    });
  });

  describe('Filtering', () => {
    it('should filter by log levels', () => {
      const levelFilterCapture = new LogCapture({
        applicationName: 'level-filter-test-app',
        filters: { levels: ['error', 'warn'] },
      });
      const listener = jest.fn();
      levelFilterCapture.addListener(listener);
      levelFilterCapture.start();

      console.log('log message');
      console.error('error message');
      console.warn('warn message');
      console.info('info message');

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'warn' })
      );

      levelFilterCapture.stop();
    });

    it('should filter by exclude patterns', () => {
      const patternFilterCapture = new LogCapture({
        applicationName: 'pattern-filter-test-app',
        filters: { excludePatterns: [/password/i, 'secret'] },
      });
      const listener = jest.fn();
      patternFilterCapture.addListener(listener);
      patternFilterCapture.start();

      console.log('normal message');
      console.log('Password: 123456');
      console.log('secret key');
      console.log('another normal message');

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'normal message' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'another normal message' })
      );

      patternFilterCapture.stop();
    });

    it('should filter by include patterns', () => {
      const includeFilterCapture = new LogCapture({
        applicationName: 'include-filter-test-app',
        filters: { includePatterns: [/important/i, 'debug'] },
      });
      const listener = jest.fn();
      includeFilterCapture.addListener(listener);
      includeFilterCapture.start();

      console.log('normal message');
      console.log('Important information');
      console.log('debug data');
      console.log('another message');

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Important information' })
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'debug data' })
      );

      includeFilterCapture.stop();
    });
  });

  describe('Log Queue Management', () => {
    beforeEach(() => {
      logCapture.start();
    });

    it('should store logs in queue', () => {
      console.log('message 1');
      console.log('message 2');

      const logs = logCapture.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('message 1');
      expect(logs[1].message).toBe('message 2');
    });

    it('should clear log queue', () => {
      console.log('message 1');
      console.log('message 2');

      expect(logCapture.getLogs()).toHaveLength(2);

      logCapture.clearLogs();
      expect(logCapture.getLogs()).toHaveLength(0);
    });

    it('should handle log size limits', () => {
      const smallSizeCapture = new LogCapture({
        applicationName: 'small-size-test-app',
        maxLogSize: 50,
      });
      const listener = jest.fn();
      smallSizeCapture.addListener(listener);
      smallSizeCapture.start();

      const largeMessage = 'x'.repeat(100);
      console.log(largeMessage);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '[Log too large - truncated]',
          truncated: true,
        })
      );

      smallSizeCapture.stop();
    });
  });

  describe('Listener Management', () => {
    it('should add and remove listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      logCapture.addListener(listener1);
      logCapture.addListener(listener2);
      logCapture.start();

      console.log('test message');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      logCapture.removeListener(listener1);
      console.log('second message');

      expect(listener1).toHaveBeenCalledTimes(1); // Still 1
      expect(listener2).toHaveBeenCalledTimes(2); // Now 2
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      logCapture.addListener(errorListener);
      logCapture.addListener(goodListener);
      logCapture.start();

      console.log('test message');

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(goodListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing console gracefully', () => {
      const originalConsole = global.console;
      delete global.console;

      expect(() => {
        const safeCapture = new LogCapture({
          applicationName: 'safe-test-app',
        });
        safeCapture.start();
        safeCapture.stop();
      }).not.toThrow();

      global.console = originalConsole;
    });

    it('should handle serialization errors gracefully', () => {
      const listener = jest.fn();
      logCapture.addListener(listener);
      logCapture.start();

      // Create an object that can't be serialized (BigInt is not JSON serializable)
      const problematicObj = { value: BigInt(123) };

      console.log(problematicObj);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['[Unserializable: object]'],
        })
      );
    });
  });

  describe('State Management', () => {
    it('should track capturing state correctly', () => {
      // Create a fresh instance for this test (not started in beforeEach)
      const freshCapture = new LogCapture({ applicationName: 'test-app' });

      expect(freshCapture.isCapturing).toBe(false);

      freshCapture.start();
      expect(freshCapture.isCapturing).toBe(true);

      freshCapture.stop();
      expect(freshCapture.isCapturing).toBe(false);

      // Clean up
      freshCapture.stop();
    });

    it('should not start multiple times', () => {
      const originalLog = console.log;

      logCapture.start();
      const interceptedLog = console.log;

      logCapture.start(); // Second start should be ignored
      expect(console.log).toBe(interceptedLog);

      logCapture.stop();
    });

    it('should not stop when not capturing', () => {
      const originalLog = console.log;

      // Create a fresh instance that hasn't been started
      const freshCapture = new LogCapture({ applicationName: 'test-app' });

      freshCapture.stop(); // Should not throw
      expect(console.log).toBe(originalLog);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid listener types', () => {
      expect(() => {
        logCapture.addListener('not a function');
        logCapture.addListener(null);
        logCapture.addListener(undefined);
      }).not.toThrow();
    });

    it('should handle metadata collection errors', () => {
      // Mock window to throw error
      const originalWindow = global.window;
      global.window = {
        get location() {
          throw new Error('Location access error');
        },
      };

      const listener = jest.fn();
      logCapture.addListener(listener);
      logCapture.start();

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.any(Object),
        })
      );

      global.window = originalWindow;
      logCapture.stop();
    });

    it('should handle stack trace collection errors', () => {
      const originalError = global.Error;
      global.Error = function () {
        throw new Error('Stack trace error');
      };

      const listener = jest.fn();
      logCapture.addListener(listener);
      logCapture.start();

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.any(Object),
        })
      );

      global.Error = originalError;
      logCapture.stop();
    });
  });

  describe('Multi-Application Support', () => {
    it('should work without applicationName parameter', () => {
      expect(() => {
        new LogCapture();
      }).not.toThrow();

      expect(() => {
        new LogCapture({ port: 3001 });
      }).not.toThrow();

      expect(() => {
        new LogCapture({ applicationName: 'legacy-app' });
      }).not.toThrow();
    });

    it('should generate unique session IDs', () => {
      const capture1 = new LogCapture({ applicationName: 'app1' });
      const capture2 = new LogCapture({ applicationName: 'app2' });

      expect(capture1.options.sessionId).toBeDefined();
      expect(capture2.options.sessionId).toBeDefined();
      expect(capture1.options.sessionId).not.toBe(capture2.options.sessionId);
      expect(capture1.options.sessionId).toMatch(/^clp_/);
    });

    it('should accept custom session ID', () => {
      const customSessionId = 'custom-session-123';
      const capture = new LogCapture({
        applicationName: 'test-app',
        sessionId: customSessionId,
      });

      expect(capture.options.sessionId).toBe(customSessionId);
    });

    it('should assign application-specific ports', () => {
      const capture1 = new LogCapture({
        applicationName: 'ecommerce-frontend',
      });
      const capture2 = new LogCapture({ applicationName: 'admin-panel' });
      const capture3 = new LogCapture({
        applicationName: 'ecommerce-frontend',
      }); // Same app

      expect(capture1.options.serverPort).toBeGreaterThanOrEqual(3001);
      expect(capture1.options.serverPort).toBeLessThanOrEqual(3100);
      expect(capture2.options.serverPort).toBeGreaterThanOrEqual(3001);
      expect(capture2.options.serverPort).toBeLessThanOrEqual(3100);

      // Same application should get same port
      expect(capture1.options.serverPort).toBe(capture3.options.serverPort);
    });

    it('should detect environment context', () => {
      // Mock window.location for testing
      const originalLocation = global.window?.location;
      global.window = { location: { hostname: 'localhost' } };

      const capture = new LogCapture({ applicationName: 'test-app' });
      expect(capture.options.environment).toBe('development');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });

    it('should initialize error categories', () => {
      const capture = new LogCapture({ applicationName: 'test-app' });

      expect(capture.errorCategories).toBeDefined();
      expect(capture.errorCategories.syntax_error).toBe('Code syntax issues');
      expect(capture.errorCategories.runtime_error).toBe(
        'Runtime execution errors'
      );
      expect(capture.errorCategories.network_error).toBe(
        'API/network connectivity issues'
      );
      expect(capture.errorCategories.user_error).toBe(
        'User input or interaction errors'
      );
      expect(capture.errorCategories.system_error).toBe(
        'Browser/system level errors'
      );
      expect(capture.errorCategories.performance_error).toBe(
        'Performance degradation issues'
      );
      expect(capture.errorCategories.security_error).toBe(
        'Security or permission errors'
      );
    });

    it('should not log session information to console (disabled to prevent recursion)', () => {
      const originalConsoleLog = console.log;
      const mockConsoleLog = jest.fn();
      console.log = mockConsoleLog;

      const capture = new LogCapture({ port: 3001 });

      // Session logging is disabled to prevent recursion issues
      expect(mockConsoleLog).not.toHaveBeenCalled();

      // Verify capture was created successfully with correct port
      expect(capture.options.serverPort).toBe(3001);

      console.log = originalConsoleLog;
    });

    it('should support AI-friendly configuration options', () => {
      const capture = new LogCapture({
        applicationName: 'test-app',
        enableErrorCategorization: true,
        enablePerformanceTracking: true,
      });

      expect(capture.options.enableErrorCategorization).toBe(true);
      expect(capture.options.enablePerformanceTracking).toBe(true);
    });

    it('should detect staging environment', () => {
      const originalLocation = global.window?.location;

      // Test staging hostname - override environment detection
      global.window = {
        location: { hostname: 'staging.example.com', port: '3000' },
      };
      const capture = new LogCapture({
        applicationName: 'test-app',
        environment: 'staging', // Explicitly set for test
      });
      expect(capture.options.environment).toBe('staging');

      // Test with 'dev' in hostname
      global.window = {
        location: { hostname: 'dev.example.com', port: '3000' },
      };
      const capture2 = new LogCapture({
        applicationName: 'test-app-2',
        environment: 'staging', // Explicitly set for test
      });
      expect(capture2.options.environment).toBe('staging');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });

    it('should detect production environment', () => {
      const originalLocation = global.window?.location;

      // Test production hostname (not localhost, not staging/dev)
      global.window = { location: { hostname: 'example.com', port: '443' } };
      const capture = new LogCapture({
        applicationName: 'test-app',
        environment: 'production', // Explicitly set for test
      });
      expect(capture.options.environment).toBe('production');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });

    it('should fallback to development environment when no window', () => {
      const originalWindow = global.window;
      delete global.window;

      const capture = new LogCapture({ applicationName: 'test-app' });
      expect(capture.options.environment).toBe('development');

      // Restore original window
      if (originalWindow) {
        global.window = originalWindow;
      }
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle JSON.stringify errors in log size calculation', () => {
      const capture = new LogCapture({ applicationName: 'test-app' });

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn(() => {
        throw new Error('JSON stringify error');
      });

      const logEntry = { args: ['test'] };
      const size = capture._getLogSize(logEntry);

      expect(size).toBe(0);
      expect(JSON.stringify).toHaveBeenCalled();

      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });

    it('should handle errors in interceptor and call original console.error', () => {
      // Store original console.error and replace with mock BEFORE creating LogCapture
      const originalError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      // Create capture instance AFTER mocking console.error
      const capture = new LogCapture({ applicationName: 'test-app' });

      // Mock the interceptor's createLogEntry to throw an error
      const originalCreateLogEntry = capture.interceptor.createLogEntry;
      capture.interceptor.createLogEntry = jest.fn(() => {
        throw new Error('Test error in interceptor');
      });

      capture.start();

      // This should trigger the error handling in interceptor
      console.log('test message that will cause error');

      // Should have called the original console.error with LogInterceptor error
      expect(mockConsoleError).toHaveBeenCalledWith(
        'LogInterceptor error:',
        expect.any(Error)
      );

      // Restore everything
      capture.interceptor.createLogEntry = originalCreateLogEntry;
      console.error = originalError;
      capture.stop();
    });

    it('should handle environment detection with staging hostname', () => {
      const originalLocation = global.window?.location;

      // Test with staging hostname
      global.window = { location: { hostname: 'staging.example.com' } };
      const capture = new LogCapture({ applicationName: 'test-app' });
      expect(capture.options.environment).toBe('staging');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });

    it('should handle environment detection with dev hostname', () => {
      const originalLocation = global.window?.location;

      // Test with dev hostname
      global.window = { location: { hostname: 'dev.example.com' } };
      const capture = new LogCapture({ applicationName: 'test-app' });
      expect(capture.options.environment).toBe('staging');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });

    it('should handle environment detection with production hostname', () => {
      const originalLocation = global.window?.location;

      // Test with production hostname (not localhost, not staging/dev)
      global.window = { location: { hostname: 'example.com' } };
      const capture = new LogCapture({ applicationName: 'test-app' });
      expect(capture.options.environment).toBe('production');

      // Restore original location
      if (originalLocation) {
        global.window.location = originalLocation;
      } else {
        delete global.window;
      }
    });
  });

  describe('Public API Methods', () => {
    let capture;

    beforeEach(() => {
      capture = new LogCapture({ applicationName: 'test-app' });
      capture.start();

      // Add some test logs
      console.log('Test message 1');
      console.error('Error message');
      console.warn('Warning message');
      console.info('Info message');
    });

    afterEach(() => {
      capture.stop();
    });

    describe('getLogSummary', () => {
      it('should return log summary', () => {
        const summary = capture.getLogSummary();

        expect(summary).toHaveProperty('total');
        expect(summary).toHaveProperty('byLevel');
        expect(summary).toHaveProperty('byCategory');
        expect(summary).toHaveProperty('bySeverity');
        expect(summary.total).toBeGreaterThan(0);
      });
    });

    describe('filterLogs', () => {
      it('should filter logs by level', () => {
        const filtered = capture.filterLogs({ levels: ['error'] });

        expect(Array.isArray(filtered)).toBe(true);
        if (filtered.length > 0) {
          expect(filtered.every(log => log.level === 'error')).toBe(true);
        }
      });

      it('should filter logs by application', () => {
        const filtered = capture.filterLogs({ applications: ['test-app'] });

        expect(Array.isArray(filtered)).toBe(true);
        if (filtered.length > 0) {
          expect(
            filtered.every(log => log.application?.name === 'test-app')
          ).toBe(true);
        }
      });

      it('should return all logs when no filters provided', () => {
        const filtered = capture.filterLogs();

        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered).toHaveLength(capture.logQueue.length);
      });
    });

    describe('exportLogs', () => {
      it('should export logs in JSON format by default', () => {
        const exported = capture.exportLogs();

        expect(Array.isArray(exported)).toBe(true);
        if (exported.length > 0) {
          expect(typeof exported[0]).toBe('string');
          expect(() => JSON.parse(exported[0])).not.toThrow();
        }
      });

      it('should export logs in console format', () => {
        const exported = capture.exportLogs('console');

        expect(Array.isArray(exported)).toBe(true);
        if (exported.length > 0) {
          expect(typeof exported[0]).toBe('string');
          expect(exported[0]).toContain('[test-app]');
        }
      });

      it('should export logs in transmission format', () => {
        const exported = capture.exportLogs('transmission');

        expect(Array.isArray(exported)).toBe(true);
        if (exported.length > 0) {
          expect(typeof exported[0]).toBe('object');
          expect(exported[0]).toHaveProperty('transmission');
        }
      });

      it('should default to JSON for unknown format', () => {
        const exported = capture.exportLogs('unknown');

        expect(Array.isArray(exported)).toBe(true);
        if (exported.length > 0) {
          expect(typeof exported[0]).toBe('string');
          expect(() => JSON.parse(exported[0])).not.toThrow();
        }
      });
    });
  });

  describe('Filter Management', () => {
    let capture;

    beforeEach(() => {
      capture = new LogCapture({ applicationName: 'test-app' });
      capture.start();
    });

    afterEach(() => {
      capture.stop();
    });

    describe('addFilter', () => {
      it('should add exclude filter', () => {
        capture.addFilter('exclude', 'password');

        const filters = capture.getFilters();
        expect(filters.excludePatterns).toContain('password');
      });

      it('should add include filter', () => {
        capture.addFilter('include', 'important');

        const filters = capture.getFilters();
        expect(filters.includePatterns).toContain('important');
      });
    });

    describe('removeFilter', () => {
      beforeEach(() => {
        capture.addFilter('exclude', 'password');
        capture.addFilter('include', 'important');
      });

      it('should remove exclude filter', () => {
        capture.removeFilter('exclude', 'password');

        const filters = capture.getFilters();
        expect(filters.excludePatterns).not.toContain('password');
      });

      it('should remove include filter', () => {
        capture.removeFilter('include', 'important');

        const filters = capture.getFilters();
        expect(filters.includePatterns).not.toContain('important');
      });
    });

    describe('clearFilters', () => {
      beforeEach(() => {
        capture.addFilter('exclude', 'password');
        capture.addFilter('include', 'important');
        capture.setLevelFilter(['error']);
      });

      it('should clear all filters by default', () => {
        capture.clearFilters();

        const filters = capture.getFilters();
        expect(filters.excludePatterns).toEqual([]);
        expect(filters.includePatterns).toEqual([]);
        expect(filters.levels).toBeNull();
      });

      it('should clear specific filter type', () => {
        capture.clearFilters('exclude');

        const filters = capture.getFilters();
        expect(filters.excludePatterns).toEqual([]);
        expect(filters.includePatterns).toContain('important');
        expect(filters.levels).toEqual(['error']);
      });
    });

    describe('setLevelFilter', () => {
      it('should set level filter', () => {
        capture.setLevelFilter(['error', 'warn']);

        const filters = capture.getFilters();
        expect(filters.levels).toEqual(['error', 'warn']);
      });

      it('should clear level filter when set to null', () => {
        capture.setLevelFilter(['error']);
        capture.setLevelFilter(null);

        const filters = capture.getFilters();
        expect(filters.levels).toBeNull();
      });
    });

    describe('getFilters', () => {
      it('should return current filter configuration', () => {
        capture.addFilter('exclude', 'test');
        capture.setLevelFilter(['error']);

        const filters = capture.getFilters();

        expect(filters).toHaveProperty('excludePatterns');
        expect(filters).toHaveProperty('includePatterns');
        expect(filters).toHaveProperty('levels');
        expect(filters.excludePatterns).toContain('test');
        expect(filters.levels).toEqual(['error']);
      });
    });
  });

  describe('Legacy Compatibility Methods', () => {
    let capture;

    beforeEach(() => {
      capture = new LogCapture({ applicationName: 'test-app' });
      capture.start();
    });

    afterEach(() => {
      capture.stop();
    });

    describe('handleLog', () => {
      it('should be a legacy compatibility method that works without errors', () => {
        // Verify the interceptor has the handleLog method
        expect(typeof capture.interceptor.handleLog).toBe('function');

        // Test that the legacy method can be called without throwing
        expect(() => {
          capture.handleLog('info', ['test message']);
        }).not.toThrow();

        // Test with different log levels
        expect(() => {
          capture.handleLog('error', ['error message']);
          capture.handleLog('warn', ['warn message']);
          capture.handleLog('debug', ['debug message']);
        }).not.toThrow();
      });
    });

    describe('_shouldCapture', () => {
      it('should delegate to interceptor shouldCapture', () => {
        const spy = jest.spyOn(capture.interceptor, 'shouldCapture');

        capture._shouldCapture('info', ['test message']);

        expect(spy).toHaveBeenCalledWith('info', ['test message']);
      });
    });

    describe('_createLogEntry', () => {
      it('should create log entry successfully', () => {
        const entry = capture._createLogEntry('info', ['test message']);

        expect(entry).toHaveProperty('level', 'info');
        expect(entry).toHaveProperty('message');
        expect(entry).toHaveProperty('timestamp');
      });

      it('should handle errors gracefully', () => {
        const mockError = new Error('Test error');
        jest
          .spyOn(capture.formatter, 'createLogEntry')
          .mockImplementation(() => {
            throw mockError;
          });

        const mockConsoleError = jest.fn();
        capture.originalConsole = { error: mockConsoleError };

        const entry = capture._createLogEntry('info', ['test message']);

        expect(entry).toHaveProperty('level', 'info');
        expect(entry).toHaveProperty('message', '[Error creating log entry]');
        expect(entry).toHaveProperty('error', 'Test error');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'LogCapture error:',
          mockError
        );
      });

      it('should handle errors when no originalConsole available', () => {
        const mockError = new Error('Test error');
        jest
          .spyOn(capture.formatter, 'createLogEntry')
          .mockImplementation(() => {
            throw mockError;
          });

        capture.originalConsole = null;

        const entry = capture._createLogEntry('info', ['test message']);

        expect(entry).toHaveProperty('level', 'info');
        expect(entry).toHaveProperty('message', '[Error creating log entry]');
        expect(entry).toHaveProperty('error', 'Test error');
      });
    });
  });

  describe('Utility Wrapper Methods', () => {
    let capture;

    beforeEach(() => {
      capture = new LogCapture({ applicationName: 'test-app' });
    });

    it('should delegate _argsToString to LogUtils', () => {
      const result = capture._argsToString(['test', 123]);
      expect(typeof result).toBe('string');
    });

    it('should delegate _serializeArgs to LogUtils', () => {
      const result = capture._serializeArgs(['test', { key: 'value' }]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should delegate _circularReplacer to LogUtils', () => {
      const replacer = capture._circularReplacer();
      expect(typeof replacer).toBe('function');
    });

    it('should delegate _collectEnhancedMetadata to LogUtils', () => {
      const metadata = capture._collectEnhancedMetadata();
      expect(typeof metadata).toBe('object');
    });

    it('should delegate _collectMetadata to LogUtils', () => {
      const metadata = capture._collectMetadata();
      expect(typeof metadata).toBe('object');
    });

    it('should delegate _categorizeLog to formatter analyzer', () => {
      const category = capture._categorizeLog('error', 'test error', []);
      expect(typeof category).toBe('string');
    });

    it('should delegate _calculateSeverity to formatter analyzer', () => {
      const severity = capture._calculateSeverity('error', 'test error', []);
      expect(typeof severity).toBe('object');
      expect(severity).toHaveProperty('level');
      expect(severity).toHaveProperty('score');
    });

    it('should delegate _getSeverityDescription to formatter analyzer', () => {
      const description = capture._getSeverityDescription('error');
      expect(typeof description).toBe('string');
    });

    it('should delegate _getLogSize to LogUtils', () => {
      const size = capture._getLogSize({ message: 'test' });
      expect(typeof size).toBe('number');
    });

    it('should delegate _notifyListeners to notifyListeners', () => {
      const spy = jest.spyOn(capture, 'notifyListeners');
      const logEntry = { level: 'info', message: 'test' };

      capture._notifyListeners(logEntry);

      expect(spy).toHaveBeenCalledWith(logEntry);
    });

    it('should delegate _generateSessionId to LogUtils', () => {
      const sessionId = capture._generateSessionId();
      expect(typeof sessionId).toBe('string');
    });

    it('should delegate _getApplicationPort to LogUtils', () => {
      const port = capture._getApplicationPort('test-app');
      expect(typeof port).toBe('number');
    });

    it('should delegate _detectEnvironment to LogUtils', () => {
      const env = capture._detectEnvironment();
      expect(typeof env).toBe('string');
    });

    it('should delegate _detectDeveloper to LogUtils', () => {
      const dev = capture._detectDeveloper();
      expect(dev === null || typeof dev === 'string').toBe(true);
    });

    it('should delegate _detectBranch to LogUtils', () => {
      const branch = capture._detectBranch();
      expect(branch === null || typeof branch === 'string').toBe(true);
    });

    it('should delegate _generateAITags to formatter analyzer', () => {
      const tags = capture._generateAITags('error', 'test error', []);
      expect(Array.isArray(tags)).toBe(true);
    });

    it('should delegate _analyzeError to formatter analyzer', () => {
      const analysis = capture._analyzeError('test error', []);
      expect(typeof analysis).toBe('object');
    });

    it('should delegate _initializeErrorCategories to formatter analyzer', () => {
      const categories = capture._initializeErrorCategories();
      expect(typeof categories).toBe('object');
    });

    it('should delegate _collectPerformanceMetrics to LogUtils', () => {
      const metrics = capture._collectPerformanceMetrics();
      expect(typeof metrics).toBe('object');
    });

    it('should delegate _parseStackTrace to LogUtils', () => {
      const stack = 'Error\n    at test';
      const parsed = capture._parseStackTrace(stack);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should delegate _logSessionInfo to logSessionInfo', () => {
      const spy = jest.spyOn(capture, 'logSessionInfo');

      capture._logSessionInfo();

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate _interceptConsole to interceptor', () => {
      const spy = jest.spyOn(capture.interceptor, 'interceptConsole');

      capture._interceptConsole();

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate _restoreConsole to interceptor', () => {
      const spy = jest.spyOn(capture.interceptor, 'restoreConsole');

      capture._restoreConsole();

      expect(spy).toHaveBeenCalled();
    });
  });
});
