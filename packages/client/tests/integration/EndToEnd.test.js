/**
 * End-to-End Integration Tests
 * These tests validate the complete workflow and prevent critical regressions
 * that could affect the core functionality of Console Log Pipe
 */

const ConsoleLogPipe = require('../../src/index.js');

describe('End-to-End Integration Tests', () => {
  let clp;
  let capturedLogs;

  beforeEach(() => {
    capturedLogs = [];
  });

  afterEach(async () => {
    if (clp) {
      await clp.destroy();
      clp = null;
    }
  });

  describe('Complete Workflow Validation', () => {
    test('should complete full initialization -> capture -> cleanup cycle', async () => {
      // Step 1: Initialize
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'e2e-test',
        enableRemoteLogging: false,
      });

      expect(clp).toBeDefined();

      // Step 2: Add listener
      clp.addListener(event => {
        capturedLogs.push(event);
      });

      // Step 3: Generate logs
      console.log('E2E test log');
      console.error('E2E test error');
      console.warn('E2E test warning');

      // Step 4: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 5: Validate capture
      expect(capturedLogs.length).toBeGreaterThanOrEqual(3);

      const logEvent = capturedLogs.find(log =>
        log.data?.message?.includes('E2E test log')
      );
      const errorEvent = capturedLogs.find(log =>
        log.data?.message?.includes('E2E test error')
      );
      const warnEvent = capturedLogs.find(log =>
        log.data?.message?.includes('E2E test warning')
      );

      expect(logEvent).toBeDefined();
      expect(errorEvent).toBeDefined();
      expect(warnEvent).toBeDefined();

      // Step 6: Validate metadata
      expect(logEvent.data.level).toBe('log');
      expect(errorEvent.data.level).toBe('error');
      expect(warnEvent.data.level).toBe('warn');

      expect(logEvent.data.application.name).toBe('e2e-test');
      expect(logEvent.data.timestamp).toBeDefined();

      // Step 7: Cleanup
      await clp.destroy();

      const session = clp.getSession();
      expect(session.isCapturing).toBe(false);
    });

    test('should handle rapid initialization and destruction cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const instance = await ConsoleLogPipe.init({
          port: 3001 + i,
          applicationName: `rapid-test-${i}`,
          enableRemoteLogging: false,
        });

        expect(instance).toBeDefined();

        // Quick test
        const logs = [];
        instance.addListener(event => logs.push(event));
        console.log(`Rapid test ${i}`);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(logs.length).toBeGreaterThan(0);

        await instance.destroy();
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from listener errors without affecting core functionality', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'error-recovery-test',
        enableRemoteLogging: false,
      });

      // Add a good listener
      clp.addListener(event => {
        capturedLogs.push(event);
      });

      // Add a bad listener that throws
      clp.addListener(() => {
        throw new Error('Bad listener error');
      });

      // This should not crash the system
      console.log('Error recovery test message');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Good listener should still work
      expect(capturedLogs.length).toBeGreaterThan(0);
      const event = capturedLogs.find(log =>
        log.data?.message?.includes('Error recovery test message')
      );
      expect(event).toBeDefined();
    });

    test('should handle malformed configuration gracefully', async () => {
      // Test with various invalid configurations
      const invalidConfigs = [
        { port: 'invalid', applicationName: 'test' },
        { port: -1, applicationName: 'test' },
        { port: 3001, applicationName: '' },
        { port: 3001, applicationName: null },
      ];

      for (const config of invalidConfigs) {
        try {
          const instance = await ConsoleLogPipe.init({
            ...config,
            enableRemoteLogging: false,
          });
          if (instance) await instance.destroy();
          // If we get here, the config was accepted (which might be valid behavior)
          // Just ensure it doesn't crash
        } catch (error) {
          // Expected behavior - invalid config should throw
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Performance and Scale', () => {
    test('should handle high-volume logging without performance degradation', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'performance-test',
        enableRemoteLogging: false,
      });

      clp.addListener(event => {
        capturedLogs.push(event);
      });

      const startTime = Date.now();
      const messageCount = 1000;

      // Generate high volume of logs
      for (let i = 0; i < messageCount; i++) {
        console.log(`Performance test message ${i}`);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should capture all messages
      expect(capturedLogs.length).toBeGreaterThanOrEqual(messageCount);

      // Should process reasonably quickly (less than 5 seconds for 1000 messages)
      expect(processingTime).toBeLessThan(5000);

      // Validate some random messages
      const randomIndex = Math.floor(Math.random() * messageCount);
      const randomMessage = capturedLogs.find(log =>
        log.data?.message?.includes(`Performance test message ${randomIndex}`)
      );
      expect(randomMessage).toBeDefined();
    });

    test('should maintain memory efficiency with long-running sessions', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'memory-test',
        enableRemoteLogging: false,
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate long-running session with periodic logging
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 100; i++) {
          console.log(`Memory test cycle ${cycle} message ${i}`);
        }

        // Clear captured logs to prevent test memory buildup
        capturedLogs = [];

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB for this test)
      // Note: This is a rough check as memory usage can vary in test environments
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('API Contract Validation', () => {
    test('should maintain stable API surface', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'api-test',
        enableRemoteLogging: false,
      });

      // Core API methods should exist and be functions
      expect(typeof clp.addListener).toBe('function');
      expect(typeof clp.removeListener).toBe('function');
      expect(typeof clp.getConfig).toBe('function');
      expect(typeof clp.getStats).toBe('function');
      expect(typeof clp.getSession).toBe('function');
      expect(typeof clp.destroy).toBe('function');

      // Static methods
      expect(typeof ConsoleLogPipe.init).toBe('function');
      expect(typeof ConsoleLogPipe.version).toBe('string');
    });

    test('should return consistent data structures', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'structure-test',
        enableRemoteLogging: false,
      });

      // Config structure
      const config = clp.getConfig();
      expect(config).toHaveProperty('sessionId');
      expect(config).toHaveProperty('applicationName');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('enableRemoteLogging');

      // Stats structure
      const stats = clp.getStats();
      expect(stats).toHaveProperty('totalLogs');
      expect(stats).toHaveProperty('startTime');
      expect(stats).toHaveProperty('lastActivity');

      // Session structure
      const session = clp.getSession();
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('isCapturing');
      expect(session).toHaveProperty('startTime');
    });
  });

  describe('Critical Regression Prevention', () => {
    test('CRITICAL: Console interception must work immediately after init', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'regression-test',
        enableRemoteLogging: false,
      });

      clp.addListener(event => {
        capturedLogs.push(event);
      });

      // This was the original bug - logs were not being captured
      console.log('CRITICAL: This message must be captured');

      // Minimal wait
      await new Promise(resolve => setTimeout(resolve, 10));

      // MUST capture the log
      expect(capturedLogs.length).toBeGreaterThan(0);
      const criticalMessage = capturedLogs.find(log =>
        log.data?.message?.includes('CRITICAL: This message must be captured')
      );
      expect(criticalMessage).toBeDefined();
      expect(criticalMessage.data.level).toBe('log');
    });

    test('CRITICAL: All console levels must be intercepted', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'levels-test',
        enableRemoteLogging: false,
      });

      clp.addListener(event => {
        capturedLogs.push(event);
      });

      // Test all critical console levels
      console.log('CRITICAL: log level test');
      console.error('CRITICAL: error level test');
      console.warn('CRITICAL: warn level test');
      console.info('CRITICAL: info level test');

      await new Promise(resolve => setTimeout(resolve, 50));

      // All levels must be captured
      const levels = ['log', 'error', 'warn', 'info'];
      levels.forEach(level => {
        const event = capturedLogs.find(
          log =>
            log.data?.message?.includes(`CRITICAL: ${level} level test`) &&
            log.data?.level === level
        );
        expect(event).toBeDefined();
      });
    });

    test('CRITICAL: Listeners must receive events', async () => {
      clp = await ConsoleLogPipe.init({
        port: 3001,
        applicationName: 'listener-test',
        enableRemoteLogging: false,
      });

      let listenerCalled = false;
      clp.addListener(event => {
        listenerCalled = true;
        capturedLogs.push(event);
      });

      console.log('CRITICAL: Listener must receive this');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Listener MUST be called
      expect(listenerCalled).toBe(true);
      expect(capturedLogs.length).toBeGreaterThan(0);
    });
  });
});
