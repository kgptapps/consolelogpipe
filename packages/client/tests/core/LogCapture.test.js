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

    // Create fresh LogCapture instance
    logCapture = new LogCapture();
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
      logCapture.start();

      expect(console.log).not.toBe(originalLog);

      logCapture.stop();
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
          metadata: expect.objectContaining({
            url: expect.any(String),
            pathname: expect.any(String),
            userAgent: expect.any(String),
            timestamp: expect.any(Number),
          }),
        })
      );
    });

    it('should not include metadata when disabled', () => {
      const noMetadataCapture = new LogCapture({ captureMetadata: false });
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
      const smallSizeCapture = new LogCapture({ maxLogSize: 50 });
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
        const safeCapture = new LogCapture();
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
      expect(logCapture.isCapturing).toBe(false);

      logCapture.start();
      expect(logCapture.isCapturing).toBe(true);

      logCapture.stop();
      expect(logCapture.isCapturing).toBe(false);
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

      logCapture.stop(); // Should not throw
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
          metadata: expect.any(Object),
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
          metadata: expect.any(Object),
        })
      );

      global.Error = originalError;
      logCapture.stop();
    });
  });
});
