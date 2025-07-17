/**
 * LogUtils Tests
 */

const LogUtils = require('../../../src/core/log/LogUtils');

describe('LogUtils', () => {
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = LogUtils.generateSessionId();
      const id2 = LogUtils.generateSessionId();

      expect(id1).toMatch(/^clp_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^clp_[a-z0-9]+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should have consistent format', () => {
      const id = LogUtils.generateSessionId();
      const parts = id.split('_');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('clp');
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('getApplicationPort', () => {
    it('should return consistent ports for same application name', () => {
      const port1 = LogUtils.getApplicationPort('test-app');
      const port2 = LogUtils.getApplicationPort('test-app');

      expect(port1).toBe(port2);
      expect(port1).toBeGreaterThanOrEqual(3001);
      expect(port1).toBeLessThanOrEqual(3100);
    });

    it('should return default port for all application names', () => {
      const port1 = LogUtils.getApplicationPort('app1');
      const port2 = LogUtils.getApplicationPort('app2');

      // Since app names are no longer used, all should return default port
      expect(port1).toBe(3001);
      expect(port2).toBe(3001);
    });

    it('should handle empty string', () => {
      const port = LogUtils.getApplicationPort('');
      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3100);
    });

    it('should handle special characters', () => {
      const port = LogUtils.getApplicationPort('app-with-special-chars!@#$%');
      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3100);
    });
  });

  describe('detectEnvironment', () => {
    beforeEach(() => {
      // Clean up global state
      delete global.window;
    });

    it('should return development when window is not available', () => {
      const env = LogUtils.detectEnvironment();
      expect(env).toBe('development');
    });

    it('should detect development environment for localhost', () => {
      global.window = {
        location: { hostname: 'localhost' },
      };

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('development');
    });

    it('should detect development environment for 127.0.0.1', () => {
      global.window = {
        location: { hostname: '127.0.0.1' },
      };

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('development');
    });

    it('should detect staging environment', () => {
      global.window = {
        location: { hostname: 'staging.example.com' },
      };

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('staging');
    });

    it('should detect staging environment for dev subdomain', () => {
      global.window = {
        location: { hostname: 'dev.example.com' },
      };

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('staging');
    });

    it('should detect production environment', () => {
      global.window = {
        location: { hostname: 'example.com' },
      };

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('production');
    });

    it('should handle missing location', () => {
      global.window = {};

      const env = LogUtils.detectEnvironment();
      expect(env).toBe('production'); // When hostname is undefined, it defaults to production
    });
  });

  describe('detectDeveloper', () => {
    beforeEach(() => {
      delete global.window;
      delete global.localStorage;
      delete global.sessionStorage;
    });

    it('should return null when window is not available', () => {
      const developer = LogUtils.detectDeveloper();
      expect(developer).toBeNull();
    });

    it('should return developer from localStorage', () => {
      global.window = {};
      global.localStorage = {
        getItem: jest.fn().mockReturnValue('john-doe'),
      };

      const developer = LogUtils.detectDeveloper();
      expect(developer).toBe('john-doe');
      expect(localStorage.getItem).toHaveBeenCalledWith(
        'console-log-pipe-developer'
      );
    });

    it('should return developer from sessionStorage when localStorage is empty', () => {
      global.window = {};
      global.localStorage = {
        getItem: jest.fn().mockReturnValue(null),
      };
      global.sessionStorage = {
        getItem: jest.fn().mockReturnValue('jane-doe'),
      };

      const developer = LogUtils.detectDeveloper();
      expect(developer).toBe('jane-doe');
      expect(sessionStorage.getItem).toHaveBeenCalledWith(
        'console-log-pipe-developer'
      );
    });

    it('should return null when no storage is available', () => {
      global.window = {};
      global.localStorage = undefined;
      global.sessionStorage = undefined;

      const developer = LogUtils.detectDeveloper();
      expect(developer).toBeNull();
    });
  });

  describe('detectBranch', () => {
    beforeEach(() => {
      delete global.window;
      delete global.process;
    });

    it('should return null when window is not available', () => {
      const branch = LogUtils.detectBranch();
      expect(branch).toBeNull();
    });

    it('should return branch from window.__GIT_BRANCH__', () => {
      global.window = {
        __GIT_BRANCH__: 'feature/test-branch',
      };

      const branch = LogUtils.detectBranch();
      expect(branch).toBe('feature/test-branch');
    });

    it('should return branch from process.env.GIT_BRANCH', () => {
      global.window = {};
      global.process = {
        env: { GIT_BRANCH: 'main' },
      };

      const branch = LogUtils.detectBranch();
      expect(branch).toBe('main');
    });

    it('should return branch from process.env.BRANCH_NAME', () => {
      global.window = {};
      global.process = {
        env: { BRANCH_NAME: 'develop' },
      };

      const branch = LogUtils.detectBranch();
      expect(branch).toBe('develop');
    });

    it('should return null when no branch info is available', () => {
      global.window = {};

      const branch = LogUtils.detectBranch();
      expect(branch).toBeNull();
    });
  });

  describe('argsToString', () => {
    it('should handle string arguments', () => {
      const result = LogUtils.argsToString(['hello', 'world']);
      expect(result).toBe('hello world');
    });

    it('should handle null and undefined', () => {
      const result = LogUtils.argsToString([null, undefined]);
      expect(result).toBe('null undefined');
    });

    it('should handle numbers and booleans', () => {
      const result = LogUtils.argsToString([123, true, false]);
      expect(result).toBe('123 true false');
    });

    it('should handle objects', () => {
      const result = LogUtils.argsToString([{ key: 'value' }]);
      expect(result).toBe('{"key":"value"}');
    });

    it('should handle arrays', () => {
      const result = LogUtils.argsToString([[1, 2, 3]]);
      expect(result).toBe('[1,2,3]');
    });

    it('should handle circular references', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      const result = LogUtils.argsToString([circular]);
      expect(result).toContain('[Circular Reference]');
    });

    it('should handle unserializable objects', () => {
      const unserializable = {
        toJSON: () => {
          throw new Error('Cannot serialize');
        },
        toString: () => 'custom string',
      };

      const result = LogUtils.argsToString([unserializable]);
      expect(result).toBe('custom string');
    });

    it('should handle mixed argument types', () => {
      const result = LogUtils.argsToString([
        'text',
        123,
        { key: 'value' },
        null,
      ]);
      expect(result).toBe('text 123 {"key":"value"} null');
    });
  });

  describe('serializeArgs', () => {
    it('should handle primitive types', () => {
      const result = LogUtils.serializeArgs([
        'string',
        123,
        true,
        null,
        undefined,
      ]);
      expect(result).toEqual(['string', 123, true, null, undefined]);
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const result = LogUtils.serializeArgs([error]);

      expect(result[0]).toEqual({
        name: 'TestError',
        message: 'Test error',
        stack: error.stack,
        __type: 'Error',
      });
    });

    it('should handle regular objects', () => {
      const obj = { key: 'value', number: 123 };
      const result = LogUtils.serializeArgs([obj]);

      expect(result[0]).toEqual({ key: 'value', number: 123 });
    });

    it('should handle circular references', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      const result = LogUtils.serializeArgs([circular]);
      expect(result[0]).toEqual({ name: 'test', self: '[Circular Reference]' });
    });

    it('should handle unserializable objects', () => {
      const unserializable = {
        toJSON: () => {
          throw new Error('Cannot serialize');
        },
      };

      const result = LogUtils.serializeArgs([unserializable]);
      expect(result[0]).toBe('[Unserializable: object]');
    });
  });

  describe('circularReplacer', () => {
    it('should handle circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj;

      const replacer = LogUtils.circularReplacer();
      const result = JSON.stringify(obj, replacer);

      expect(result).toContain('[Circular Reference]');
    });

    it('should handle nested objects without circular references', () => {
      const obj = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      };

      const replacer = LogUtils.circularReplacer();
      const result = JSON.stringify(obj, replacer);

      expect(result).toBe('{"level1":{"level2":{"value":"deep"}}}');
    });

    it('should handle primitive values', () => {
      const replacer = LogUtils.circularReplacer();

      expect(replacer('key', 'string')).toBe('string');
      expect(replacer('key', 123)).toBe(123);
      expect(replacer('key', true)).toBe(true);
      expect(replacer('key', null)).toBe(null);
    });
  });

  describe('getLogSize', () => {
    it('should return size of simple object', () => {
      const logEntry = { message: 'test', level: 'info' };
      const size = LogUtils.getLogSize(logEntry);

      expect(size).toBe(JSON.stringify(logEntry).length);
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for unserializable objects', () => {
      const unserializable = {
        toJSON: () => {
          throw new Error('Cannot serialize');
        },
      };

      const size = LogUtils.getLogSize(unserializable);
      expect(size).toBe(0);
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: 'x'.repeat(1000),
        nested: { value: 'test' },
      };

      const size = LogUtils.getLogSize(largeObject);
      expect(size).toBeGreaterThan(1000);
    });
  });

  describe('collectEnhancedMetadata', () => {
    beforeEach(() => {
      delete global.window;
      delete global.navigator;
      delete global.document;
      delete global.performance;
    });

    it('should collect basic metadata when no globals are available', () => {
      // Mock performance to avoid the error
      global.performance = {
        timeOrigin: Date.now(),
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata).toHaveProperty('timing');
      expect(metadata.timing).toHaveProperty('timestamp');
      expect(metadata.timing).toHaveProperty('timeOrigin');
      expect(metadata).toHaveProperty('stackTrace');
    });

    it('should collect URL information when window.location is available', () => {
      global.window = {
        location: {
          href: 'https://example.com/path?query=value#hash',
          pathname: '/path',
          search: '?query=value',
          hash: '#hash',
        },
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.url).toEqual({
        href: 'https://example.com/path?query=value#hash',
        pathname: '/path',
        search: '?query=value',
        hash: '#hash',
      });
    });

    it('should collect browser information when navigator is available', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 Test Browser',
        language: 'en-US',
        platform: 'MacIntel',
        cookieEnabled: true,
        onLine: true,
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.browser).toEqual({
        userAgent: 'Mozilla/5.0 Test Browser',
        language: 'en-US',
        platform: 'MacIntel',
        cookieEnabled: true,
        onLine: true,
      });
    });

    it('should collect viewport information when window is available', () => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        devicePixelRatio: 2,
        screen: {
          width: 2560,
          height: 1440,
        },
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.viewport).toEqual({
        width: 1920,
        height: 1080,
        screenWidth: 2560,
        screenHeight: 1440,
        devicePixelRatio: 2,
      });
    });

    it('should collect document information when document is available', () => {
      global.document = {
        readyState: 'complete',
        title: 'Test Page',
        referrer: 'https://referrer.com',
      };
      global.performance = {
        timeOrigin: Date.now(),
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.document).toEqual({
        readyState: 'complete',
        title: 'Test Page',
        referrer: 'https://referrer.com',
      });
    });

    it('should handle errors gracefully', () => {
      global.window = {
        get location() {
          throw new Error('Location access denied');
        },
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata).toHaveProperty('metadataError');
      expect(metadata.metadataError).toBe('Location access denied');
    });

    it('should collect performance timeOrigin when available', () => {
      global.performance = {
        timeOrigin: 1234567890000,
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.timing.timeOrigin).toBe(1234567890000);
    });

    it('should handle missing screen information', () => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        devicePixelRatio: 2,
        // No screen property
      };

      const metadata = LogUtils.collectEnhancedMetadata();

      expect(metadata.viewport.width).toBe(1920);
      expect(metadata.viewport.height).toBe(1080);
      expect(metadata.viewport.screenWidth).toBeUndefined();
      expect(metadata.viewport.screenHeight).toBeUndefined();
    });
  });

  describe('collectPerformanceMetrics', () => {
    beforeEach(() => {
      delete global.performance;
    });

    it('should return empty metrics when performance is not available', () => {
      const metrics = LogUtils.collectPerformanceMetrics();
      expect(metrics).toEqual({
        error: 'Performance metrics collection failed',
      });
    });

    it('should collect memory information when available', () => {
      global.performance = {
        memory: {
          usedJSHeapSize: 10000000,
          totalJSHeapSize: 20000000,
          jsHeapSizeLimit: 100000000,
        },
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.memory).toEqual({
        used: 10000000,
        total: 20000000,
        limit: 100000000,
        usage: 50,
      });
    });

    it('should collect timing information when performance.now is available', () => {
      global.performance = {
        now: jest.fn().mockReturnValue(1234.567),
        timeOrigin: 1234567890000,
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.timing).toEqual({
        now: 1234.567,
        timeOrigin: 1234567890000,
      });
    });

    it('should collect navigation timing when available', () => {
      global.performance = {
        getEntriesByType: jest.fn().mockImplementation(type => {
          if (type === 'navigation') {
            return [
              {
                domContentLoadedEventStart: 1000,
                domContentLoadedEventEnd: 1100,
                loadEventStart: 1200,
                loadEventEnd: 1300,
                domInteractive: 800,
                fetchStart: 500,
              },
            ];
          }
          return [];
        }),
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.navigation).toEqual({
        domContentLoaded: 100,
        loadComplete: 100,
        domInteractive: 300,
      });
    });

    it('should collect resource timing summary when available', () => {
      global.performance = {
        getEntriesByType: jest.fn().mockImplementation(type => {
          if (type === 'resource') {
            return [{ duration: 100 }, { duration: 200 }, { duration: 300 }];
          }
          return [];
        }),
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.resources).toEqual({
        count: 3,
        averageDuration: 200,
        totalDuration: 600,
      });
    });

    it('should handle errors gracefully', () => {
      global.performance = {
        get memory() {
          throw new Error('Memory access denied');
        },
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.error).toBe('Performance metrics collection failed');
    });

    it('should handle empty resource list', () => {
      global.performance = {
        getEntriesByType: jest.fn().mockReturnValue([]),
      };

      const metrics = LogUtils.collectPerformanceMetrics();

      expect(metrics.resources).toBeUndefined();
    });
  });

  describe('parseStackTrace', () => {
    it('should return null for empty stack', () => {
      expect(LogUtils.parseStackTrace('')).toBeNull();
      expect(LogUtils.parseStackTrace(null)).toBeNull();
      expect(LogUtils.parseStackTrace(undefined)).toBeNull();
    });

    it('should parse standard stack trace format', () => {
      const stack = `Error: Test error
    at testFunction (file.js:10:5)
    at anotherFunction (another.js:20:10)
    at Object.method (object.js:30:15)`;

      const result = LogUtils.parseStackTrace(stack);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        function: 'testFunction',
        file: 'file.js',
        line: 10,
        column: 5,
      });
      expect(result[1]).toEqual({
        function: 'anotherFunction',
        file: 'another.js',
        line: 20,
        column: 10,
      });
      expect(result[2]).toEqual({
        function: 'Object.method',
        file: 'object.js',
        line: 30,
        column: 15,
      });
    });

    it('should handle malformed stack trace lines', () => {
      const stack = `Error: Test error
    at testFunction (file.js:10:5)
    malformed line without proper format
    at anotherFunction (another.js:20:10)`;

      const result = LogUtils.parseStackTrace(stack);

      expect(result).toHaveLength(2);
      expect(result[0].function).toBe('testFunction');
      expect(result[1].function).toBe('anotherFunction');
    });

    it('should limit to 10 frames', () => {
      const lines = [];
      for (let i = 1; i <= 15; i++) {
        lines.push(`    at function${i} (file${i}.js:${i}:${i})`);
      }
      const stack = `Error: Test error\n${lines.join('\n')}`;

      const result = LogUtils.parseStackTrace(stack);

      expect(result).toHaveLength(10);
      expect(result[0].function).toBe('function1');
      expect(result[9].function).toBe('function10');
    });

    it('should handle parsing errors gracefully', () => {
      // Mock a scenario where parsing fails
      const originalSplit = String.prototype.split;
      String.prototype.split = jest.fn().mockImplementation(() => {
        throw new Error('Split failed');
      });

      const result = LogUtils.parseStackTrace('some stack trace');

      expect(result).toBeNull();

      // Restore original method
      String.prototype.split = originalSplit;
    });

    it('should handle stack traces without parentheses', () => {
      const stack = `Error: Test error
    at testFunction
    at anotherFunction (file.js:10:5)`;

      const result = LogUtils.parseStackTrace(stack);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        function: 'anotherFunction',
        file: 'file.js',
        line: 10,
        column: 5,
      });
    });
  });
});
