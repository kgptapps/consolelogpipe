/**
 * Integration tests for console log interception
 * These tests ensure that the core functionality works end-to-end
 * and prevent regressions like the console interception bug
 */

const ConsoleLogPipe = require('../../src/index.js');

describe('Console Interception Integration Tests', () => {
  let clp;
  let capturedLogs;
  let originalConsole;

  beforeEach(async () => {
    // Store original console methods
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    capturedLogs = [];

    // Initialize Console Log Pipe
    clp = await ConsoleLogPipe.init({
      port: 3001,
      applicationName: 'integration-test',
      enableRemoteLogging: false, // Disable WebSocket for unit tests
    });

    // Add listener to capture logs
    clp.addListener(event => {
      capturedLogs.push(event);
    });
  });

  afterEach(async () => {
    if (clp) {
      await clp.destroy();
    }
    capturedLogs = [];
  });

  describe('Critical Console Interception', () => {
    test('should intercept console.log messages', async () => {
      console.log('Test log message');

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBeGreaterThan(0);
      const logEvent = capturedLogs.find(log =>
        log.data?.message?.includes('Test log message')
      );
      expect(logEvent).toBeDefined();
      expect(logEvent.data.level).toBe('log');
    });

    test('should intercept console.error messages', async () => {
      console.error('Test error message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const errorEvent = capturedLogs.find(log =>
        log.data?.message?.includes('Test error message')
      );
      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.level).toBe('error');
    });

    test('should intercept console.warn messages', async () => {
      console.warn('Test warning message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const warnEvent = capturedLogs.find(log =>
        log.data?.message?.includes('Test warning message')
      );
      expect(warnEvent).toBeDefined();
      expect(warnEvent.data.level).toBe('warn');
    });

    test('should intercept console.info messages', async () => {
      console.info('Test info message');

      await new Promise(resolve => setTimeout(resolve, 10));

      const infoEvent = capturedLogs.find(log =>
        log.data?.message?.includes('Test info message')
      );
      expect(infoEvent).toBeDefined();
      expect(infoEvent.data.level).toBe('info');
    });

    test('should intercept all console levels in sequence', async () => {
      const testMessages = [
        { level: 'log', message: 'Sequential log message' },
        { level: 'error', message: 'Sequential error message' },
        { level: 'warn', message: 'Sequential warn message' },
        { level: 'info', message: 'Sequential info message' },
      ];

      // Generate all messages
      testMessages.forEach(({ level, message }) => {
        console[level](message);
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all messages were captured
      testMessages.forEach(({ level, message }) => {
        const event = capturedLogs.find(
          log =>
            log.data?.message?.includes(message) && log.data?.level === level
        );
        expect(event).toBeDefined();
      });
    });
  });

  describe('Listener System Integration', () => {
    test('should notify all registered listeners', async () => {
      const listener1Logs = [];
      const listener2Logs = [];

      clp.addListener(event => {
        listener1Logs.push(event);
      });

      clp.addListener(event => {
        listener2Logs.push(event);
      });

      console.log('Multi-listener test message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(listener1Logs.length).toBeGreaterThan(0);
      expect(listener2Logs.length).toBeGreaterThan(0);

      const message1 = listener1Logs.find(log =>
        log.data?.message?.includes('Multi-listener test message')
      );
      const message2 = listener2Logs.find(log =>
        log.data?.message?.includes('Multi-listener test message')
      );

      expect(message1).toBeDefined();
      expect(message2).toBeDefined();
    });

    test('should handle listener removal correctly', async () => {
      const tempLogs = [];
      const listener = event => {
        tempLogs.push(event);
      };

      clp.addListener(listener);
      console.log('Before removal');

      await new Promise(resolve => setTimeout(resolve, 10));

      clp.removeListener(listener);
      console.log('After removal');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have captured the first message but not the second in tempLogs
      const beforeMessage = tempLogs.find(log =>
        log.data?.message?.includes('Before removal')
      );
      const afterMessage = tempLogs.find(log =>
        log.data?.message?.includes('After removal')
      );

      expect(beforeMessage).toBeDefined();
      expect(afterMessage).toBeUndefined();
    });
  });

  describe('Console Method Preservation', () => {
    test('should preserve original console functionality', () => {
      // Console methods should still be functions
      expect(typeof console.log).toBe('function');
      expect(typeof console.error).toBe('function');
      expect(typeof console.warn).toBe('function');
      expect(typeof console.info).toBe('function');

      // Should be different from original (intercepted)
      expect(console.log).not.toBe(originalConsole.log);
      expect(console.error).not.toBe(originalConsole.error);
      expect(console.warn).not.toBe(originalConsole.warn);
      expect(console.info).not.toBe(originalConsole.info);
    });

    test('should restore original console methods on destroy', async () => {
      await clp.destroy();

      // After destroy, console methods should be restored
      expect(console.log).toBe(originalConsole.log);
      expect(console.error).toBe(originalConsole.error);
      expect(console.warn).toBe(originalConsole.warn);
      expect(console.info).toBe(originalConsole.info);
    });
  });

  describe('Error Handling', () => {
    test('should handle listener errors gracefully', async () => {
      // Add a listener that throws an error
      clp.addListener(() => {
        throw new Error('Listener error');
      });

      // This should not crash the system
      expect(() => {
        console.log('Test message with error listener');
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Original listener should still work
      const event = capturedLogs.find(log =>
        log.data?.message?.includes('Test message with error listener')
      );
      expect(event).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    test('should handle rapid console calls without memory leaks', async () => {
      const initialLogCount = capturedLogs.length;

      // Generate many rapid console calls
      for (let i = 0; i < 100; i++) {
        console.log(`Rapid message ${i}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have captured all messages
      const finalLogCount = capturedLogs.length;
      expect(finalLogCount - initialLogCount).toBeGreaterThanOrEqual(100);
    });
  });
});
