/**
 * ErrorCapture.test.js - Comprehensive tests for error capture functionality
 */

const ErrorCapture = require('../../src/core/ErrorCapture');

// Mock browser environment
global.window = {
  onerror: null,
  onunhandledrejection: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { href: 'http://localhost:3000/test' },
};

global.document = {
  referrer: 'http://localhost:3000',
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
};

global.performance = {
  now: jest.fn(() => 123.456),
  timeOrigin: 1234567890000,
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

describe('ErrorCapture', () => {
  let errorCapture;
  let mockListener;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset window mocks
    global.window.addEventListener = jest.fn();
    global.window.removeEventListener = jest.fn();
    global.window.onerror = null;
    global.window.onunhandledrejection = null;

    // Reset performance mock
    global.performance.now = jest.fn(() => 123.456);

    // Create fresh instance
    errorCapture = new ErrorCapture({
      applicationName: 'test-app',
      sessionId: 'test-session-123',
      environment: 'test',
      developer: 'test-dev',
      branch: 'test-branch',
    });

    mockListener = jest.fn();
  });

  afterEach(() => {
    if (errorCapture && errorCapture.isCapturing) {
      errorCapture.stop();
    }
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default options', () => {
      const capture = new ErrorCapture({
        applicationName: 'test-app',
      });

      expect(capture.options.captureUnhandledErrors).toBe(true);
      expect(capture.options.capturePromiseRejections).toBe(true);
      expect(capture.options.captureStackTraces).toBe(true);
      expect(capture.options.maxStackDepth).toBe(50);
      expect(capture.options.applicationName).toBe('test-app');
    });

    test('should override default options', () => {
      const capture = new ErrorCapture({
        applicationName: 'test-app',
        captureUnhandledErrors: false,
        maxStackDepth: 10,
        serverPort: 3005,
      });

      expect(capture.options.captureUnhandledErrors).toBe(false);
      expect(capture.options.maxStackDepth).toBe(10);
      expect(capture.options.serverPort).toBe(3005);
    });

    test('should initialize empty listeners and error queue', () => {
      expect(errorCapture.listeners.size).toBe(0);
      expect(errorCapture.errorQueue).toEqual([]);
      expect(errorCapture.isCapturing).toBe(false);
    });
  });

  describe('Error Handler Setup', () => {
    test('should start capturing and setup error handlers', () => {
      const originalOnerror = global.window.onerror;

      errorCapture.start();

      expect(errorCapture.isCapturing).toBe(true);
      expect(global.window.onerror).not.toBe(originalOnerror);
      expect(global.window.addEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    test('should not setup handlers if already capturing', () => {
      errorCapture.start();
      const onerrorAfterStart = global.window.onerror;

      errorCapture.start(); // Call again

      expect(global.window.onerror).toBe(onerrorAfterStart);
    });

    test('should stop capturing and restore handlers', () => {
      const originalOnerror = global.window.onerror;

      errorCapture.start();
      errorCapture.stop();

      expect(errorCapture.isCapturing).toBe(false);
      expect(global.window.onerror).toBe(originalOnerror);
    });

    test('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(() => {
        const capture = new ErrorCapture({ applicationName: 'test' });
        capture.start();
        capture.stop();
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('JavaScript Error Handling', () => {
    test('should capture JavaScript errors via window.onerror', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      // Simulate JavaScript error
      const error = new Error('Test error message');
      global.window.onerror('Test error message', 'test.js', 10, 5, error);

      expect(mockListener).toHaveBeenCalledTimes(1);
      const capturedError = mockListener.mock.calls[0][0];

      expect(capturedError.type).toBe('error');
      expect(capturedError.subtype).toBe('javascript');
      expect(capturedError.message).toBe('Test error message');
      expect(capturedError.error.source).toBe('test.js');
      expect(capturedError.error.line).toBe(10);
      expect(capturedError.error.column).toBe(5);
    });

    test('should call original onerror handler if exists', () => {
      const originalHandler = jest.fn();
      global.window.onerror = originalHandler;

      errorCapture.start();
      global.window.onerror('Test error', 'test.js', 1, 1, new Error('Test'));

      expect(originalHandler).toHaveBeenCalledWith(
        'Test error',
        'test.js',
        1,
        1,
        expect.any(Error)
      );
    });

    test('should handle errors without error object', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      global.window.onerror('Test error message', 'test.js', 10, 5, null);

      expect(mockListener).toHaveBeenCalledTimes(1);
      const capturedError = mockListener.mock.calls[0][0];
      expect(capturedError.message).toBe('Test error message');
    });
  });

  describe('Promise Rejection Handling', () => {
    test('should capture unhandled promise rejections', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      // Simulate promise rejection event
      const rejectionEvent = {
        reason: new Error('Promise rejection test'),
        promise: {}, // Mock promise object instead of real rejected promise
      };

      // Get the event listener that was added
      const addEventListenerCalls = global.window.addEventListener.mock.calls;
      const rejectionListener = addEventListenerCalls.find(
        call => call[0] === 'unhandledrejection'
      )[1];

      rejectionListener(rejectionEvent);

      expect(mockListener).toHaveBeenCalledTimes(1);
      const capturedError = mockListener.mock.calls[0][0];

      expect(capturedError.type).toBe('error');
      expect(capturedError.subtype).toBe('promise');
      expect(capturedError.message).toBe('Promise rejection test');
    });

    test('should handle promise rejections with non-Error reasons', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      const rejectionEvent = {
        reason: 'String rejection reason',
        promise: {}, // Mock promise object
      };

      const rejectionListener = global.window.addEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )[1];

      rejectionListener(rejectionEvent);

      expect(mockListener).toHaveBeenCalledTimes(1);
      const capturedError = mockListener.mock.calls[0][0];
      expect(capturedError.message).toBe('String rejection reason');
    });
  });

  describe('Error Categorization', () => {
    test('should categorize network errors correctly', () => {
      const networkMessages = [
        'fetch failed',
        'network request failed',
        'cors error',
        'xhr error',
      ];

      networkMessages.forEach(message => {
        const category = errorCapture._categorizeError(
          'javascript',
          message,
          {}
        );
        expect(category).toBe('Network Error');
      });
    });

    test('should categorize syntax errors correctly', () => {
      const syntaxMessages = ['Unexpected token', 'Syntax error in module'];

      syntaxMessages.forEach(message => {
        const category = errorCapture._categorizeError(
          'javascript',
          message,
          {}
        );
        expect(category).toBe('Syntax Error');
      });
    });

    test('should categorize reference errors correctly', () => {
      const referenceMessages = [
        'variable is not defined',
        'undefined variable access',
      ];

      referenceMessages.forEach(message => {
        const category = errorCapture._categorizeError(
          'javascript',
          message,
          {}
        );
        expect(category).toBe('Reference Error');
      });
    });

    test('should categorize type errors correctly', () => {
      const typeMessages = [
        'Cannot read property of undefined',
        'someFunction is not a function',
      ];

      typeMessages.forEach(message => {
        const category = errorCapture._categorizeError(
          'javascript',
          message,
          {}
        );
        expect(category).toBe('Type Error');
      });
    });

    test('should categorize promise rejections', () => {
      const category = errorCapture._categorizeError(
        'promise',
        'Any message',
        {}
      );
      expect(category).toBe('Promise Rejection');
    });

    test('should default to runtime error for unknown types', () => {
      const category = errorCapture._categorizeError(
        'javascript',
        'Unknown error',
        {}
      );
      expect(category).toBe('Runtime Error');
    });
  });

  describe('Severity Calculation', () => {
    test('should assign critical severity to security errors', () => {
      const severity = errorCapture._calculateErrorSeverity(
        'javascript',
        'Security violation detected',
        {}
      );

      expect(severity.level).toBe('critical');
      expect(severity.score).toBe(9);
    });

    test('should assign high severity to network errors', () => {
      const severity = errorCapture._calculateErrorSeverity(
        'javascript',
        'Network request failed',
        {}
      );

      expect(severity.level).toBe('high');
      expect(severity.score).toBe(8);
    });

    test('should assign medium severity by default', () => {
      const severity = errorCapture._calculateErrorSeverity(
        'javascript',
        'Generic error message',
        {}
      );

      expect(severity.level).toBe('medium');
      expect(severity.score).toBe(5);
    });

    test('should include severity factors', () => {
      const severity = errorCapture._calculateErrorSeverity(
        'promise',
        'Network security error',
        {}
      );

      expect(severity.factors).toContain('security-related');
      expect(severity.factors).toContain('network-failure');
      expect(severity.factors).toContain('async-operation');
    });
  });

  describe('AI-Friendly Tags Generation', () => {
    test('should generate basic error tags', () => {
      const tags = errorCapture._generateErrorTags(
        'javascript',
        'Test error',
        {}
      );

      expect(tags).toContain('error');
      expect(tags).toContain('javascript');
      expect(tags).toContain('test'); // environment
    });

    test('should detect technology tags', () => {
      const reactTags = errorCapture._generateErrorTags(
        'javascript',
        'React component error',
        {}
      );
      expect(reactTags).toContain('react');

      const fetchTags = errorCapture._generateErrorTags(
        'javascript',
        'fetch request failed',
        {}
      );
      expect(fetchTags).toContain('http');
    });

    test('should include environment and branch tags', () => {
      const tags = errorCapture._generateErrorTags(
        'javascript',
        'Test error',
        {}
      );

      expect(tags).toContain('test'); // environment
      expect(tags).toContain('branch:test-branch');
    });

    test('should remove duplicate tags', () => {
      const tags = errorCapture._generateErrorTags(
        'javascript',
        'error error',
        {}
      );
      const errorCount = tags.filter(tag => tag === 'error').length;
      expect(errorCount).toBe(1);
    });
  });

  describe('Stack Trace Processing', () => {
    test('should process stack traces correctly', () => {
      const mockError = new Error('Test error');
      mockError.stack = `Error: Test error
    at testFunction (test.js:10:5)
    at anotherFunction (another.js:20:10)
    at anonymous (script.js:30:15)`;

      const errorData = { error: mockError };
      const stackTrace = errorCapture._processStackTrace(errorData);

      expect(stackTrace.formatted).toBe(mockError.stack);
      expect(stackTrace.parsed).toHaveLength(3);
      expect(stackTrace.parsed[0]).toEqual({
        function: 'testFunction',
        file: 'test.js',
        line: 10,
        column: 5,
      });
    });

    test('should handle missing stack traces', () => {
      const errorData = { error: null };
      const stackTrace = errorCapture._processStackTrace(errorData);

      expect(stackTrace.formatted).toBeNull();
      expect(stackTrace.parsed).toEqual([]);
    });

    test('should respect max stack depth', () => {
      const capture = new ErrorCapture({
        applicationName: 'test',
        maxStackDepth: 2,
      });

      const mockError = new Error('Test error');
      mockError.stack = `Error: Test error
    at function1 (file1.js:1:1)
    at function2 (file2.js:2:2)
    at function3 (file3.js:3:3)
    at function4 (file4.js:4:4)
    at function5 (file5.js:5:5)`;

      const errorData = { error: mockError };
      const stackTrace = capture._processStackTrace(errorData);

      expect(stackTrace.parsed.length).toBeLessThanOrEqual(2);
      expect(stackTrace.parsed.length).toBeGreaterThan(0);
    });

    test('should parse alternative stack frame formats', () => {
      const frame1 = errorCapture._parseStackFrame(
        'at testFunction (test.js:10:5)'
      );
      expect(frame1).toEqual({
        function: 'testFunction',
        file: 'test.js',
        line: 10,
        column: 5,
      });

      const frame2 = errorCapture._parseStackFrame('at test.js:10:5');
      expect(frame2).toEqual({
        function: 'anonymous',
        file: 'test.js',
        line: 10,
        column: 5,
      });

      const invalidFrame = errorCapture._parseStackFrame('invalid stack frame');
      expect(invalidFrame).toBeNull();
    });
  });

  describe('Error Serialization', () => {
    test('should serialize Error objects correctly', () => {
      const error = new Error('Test error');
      error.code = 'TEST_CODE';
      error.customProperty = 'custom value';

      const serialized = errorCapture._serializeError(error);

      expect(serialized.name).toBe('Error');
      expect(serialized.message).toBe('Test error');
      expect(serialized.stack).toBe(error.stack);
      expect(serialized.code).toBe('TEST_CODE');
      expect(serialized.customProperty).toBe('custom value');
    });

    test('should serialize non-Error objects', () => {
      const obj = { message: 'test', code: 123 };
      const serialized = errorCapture._serializeError(obj);

      expect(serialized).toEqual(obj);
    });

    test('should handle non-serializable objects', () => {
      const circular = {};
      circular.self = circular;

      const serialized = errorCapture._serializeError(circular);
      expect(typeof serialized).toBe('string');
    });

    test('should handle null/undefined errors', () => {
      expect(errorCapture._serializeError(null)).toBeNull();
      expect(errorCapture._serializeError(undefined)).toBeNull();
    });
  });

  describe('Recovery Analysis', () => {
    test('should identify recoverable errors', () => {
      expect(
        errorCapture._isRecoverable('javascript', 'network error', {})
      ).toBe(true);
      expect(errorCapture._isRecoverable('promise', 'fetch failed', {})).toBe(
        true
      );
      expect(
        errorCapture._isRecoverable('javascript', 'generic error', {})
      ).toBe(true);
    });

    test('should identify non-recoverable errors', () => {
      expect(
        errorCapture._isRecoverable('javascript', 'syntax error', {})
      ).toBe(false);
      expect(
        errorCapture._isRecoverable('javascript', 'security violation', {})
      ).toBe(false);
    });

    test('should assess error impact correctly', () => {
      expect(
        errorCapture._assessImpact('javascript', 'security error', {})
      ).toBe('critical');
      expect(
        errorCapture._assessImpact('javascript', 'network api error', {})
      ).toBe('high');
      expect(
        errorCapture._assessImpact('javascript', 'ui render error', {})
      ).toBe('medium');
      expect(errorCapture._assessImpact('javascript', 'minor error', {})).toBe(
        'low'
      );
    });

    test('should generate appropriate recovery suggestions', () => {
      const undefinedSuggestions = errorCapture._generateRecoverySuggestions(
        'javascript',
        'variable is not defined',
        {}
      );
      expect(undefinedSuggestions).toContain(
        'Check variable declaration and scope'
      );

      const propertySuggestions = errorCapture._generateRecoverySuggestions(
        'javascript',
        'cannot read property of undefined',
        {}
      );
      expect(propertySuggestions).toContain('Add null/undefined checks');

      const networkSuggestions = errorCapture._generateRecoverySuggestions(
        'javascript',
        'network request failed',
        {}
      );
      expect(networkSuggestions).toContain('Implement retry logic');

      const promiseSuggestions = errorCapture._generateRecoverySuggestions(
        'promise',
        'promise rejected',
        {}
      );
      expect(promiseSuggestions).toContain('Add .catch() handler');
    });
  });

  describe('Performance Metrics', () => {
    test('should collect performance metrics when available', () => {
      const metrics = errorCapture._collectPerformanceMetrics();

      expect(metrics).toMatchObject({
        timing: {
          now: expect.any(Number),
          timeOrigin: expect.any(Number),
        },
      });

      // Memory might be null in test environment
      if (metrics.memory) {
        expect(metrics.memory).toMatchObject({
          used: expect.any(Number),
          total: expect.any(Number),
          limit: expect.any(Number),
        });
      }
    });

    test('should handle missing performance API', () => {
      const originalPerformance = global.performance;
      delete global.performance;

      const metrics = errorCapture._collectPerformanceMetrics();
      expect(metrics).toBeNull();

      global.performance = originalPerformance;
    });

    test('should handle missing memory API', () => {
      const originalMemory = global.performance.memory;
      delete global.performance.memory;

      const metrics = errorCapture._collectPerformanceMetrics();
      expect(metrics.memory).toBeNull();
      expect(metrics.timing).toBeDefined();

      global.performance.memory = originalMemory;
    });
  });

  describe('Listener Management', () => {
    test('should add and remove listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      errorCapture.addListener(listener1);
      errorCapture.addListener(listener2);

      expect(errorCapture.listeners.size).toBe(2);

      errorCapture.removeListener(listener1);
      expect(errorCapture.listeners.size).toBe(1);
    });

    test('should ignore non-function listeners', () => {
      errorCapture.addListener('not a function');
      errorCapture.addListener(null);
      errorCapture.addListener(undefined);

      expect(errorCapture.listeners.size).toBe(0);
    });

    test('should notify all listeners of errors', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      errorCapture.addListener(listener1);
      errorCapture.addListener(listener2);
      errorCapture.start();

      global.window.onerror('Test error', 'test.js', 1, 1, new Error('Test'));

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    test('should handle listener errors gracefully', () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      errorCapture.addListener(faultyListener);
      errorCapture.addListener(goodListener);
      errorCapture.start();

      // Mock console.error to avoid test output noise
      const originalConsoleError = console.error;
      console.error = jest.fn();

      global.window.onerror('Test error', 'test.js', 1, 1, new Error('Test'));

      expect(faultyListener).toHaveBeenCalledTimes(1);
      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'ErrorCapture: Listener error',
        expect.any(Error)
      );

      console.error = originalConsoleError;
    });
  });

  describe('Error Queue Management', () => {
    test('should maintain error queue', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      global.window.onerror('Error 1', 'test.js', 1, 1, new Error('Error 1'));
      global.window.onerror('Error 2', 'test.js', 2, 2, new Error('Error 2'));

      expect(errorCapture.getErrors()).toHaveLength(2);
      expect(errorCapture.getErrors()[0].message).toBe('Error 1');
      expect(errorCapture.getErrors()[1].message).toBe('Error 2');
    });

    test('should clear error queue', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      global.window.onerror('Test error', 'test.js', 1, 1, new Error('Test'));
      expect(errorCapture.getErrors()).toHaveLength(1);

      errorCapture.clearErrors();
      expect(errorCapture.getErrors()).toHaveLength(0);
    });
  });

  describe('Error ID Generation', () => {
    test('should generate unique error IDs', () => {
      const id1 = errorCapture._generateErrorId();
      const id2 = errorCapture._generateErrorId();

      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Error Processing Edge Cases', () => {
    test('should handle processing errors gracefully', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Mock a method to throw during error processing
      const originalCreateErrorEntry = errorCapture._createErrorEntry;
      errorCapture._createErrorEntry = jest.fn(() => {
        throw new Error('Processing error');
      });

      errorCapture.start();
      global.window.onerror('Test error', 'test.js', 1, 1, new Error('Test'));

      expect(console.error).toHaveBeenCalledWith(
        'ErrorCapture: Failed to process error',
        expect.any(Error)
      );

      // Restore
      errorCapture._createErrorEntry = originalCreateErrorEntry;
      console.error = originalConsoleError;
    });
  });

  describe('Complete Error Entry Structure', () => {
    test('should create complete AI-friendly error entry', () => {
      errorCapture.addListener(mockListener);
      errorCapture.start();

      const testError = new Error('Complete test error');
      testError.stack =
        'Error: Complete test error\n    at test (test.js:10:5)';

      global.window.onerror('Complete test error', 'test.js', 10, 5, testError);

      expect(mockListener).toHaveBeenCalledTimes(1);
      const errorEntry = mockListener.mock.calls[0][0];

      // Verify complete structure
      expect(errorEntry).toMatchObject({
        id: expect.stringMatching(/^err_\d+_[a-z0-9]+$/),
        timestamp: expect.any(String),
        type: 'error',
        subtype: 'javascript',
        level: 'error',
        message: 'Complete test error',
        application: {
          name: 'test-app',
          sessionId: 'test-session-123',
          environment: 'test',
          developer: 'test-dev',
          branch: 'test-branch',
          port: expect.any(Number),
        },
        error: {
          name: 'Error',
          message: 'Complete test error',
          stack: expect.any(String),
          source: 'test.js',
          line: 10,
          column: 5,
          originalError: expect.any(Object),
        },
        category: expect.any(String),
        severity: {
          level: expect.any(String),
          score: expect.any(Number),
          factors: expect.any(Array),
        },
        tags: expect.any(Array),
        performance: expect.any(Object),
        analysis: {
          recoverable: expect.any(Boolean),
          impact: expect.any(String),
          suggestions: expect.any(Array),
        },
        stackTrace: expect.any(Array),
        metadata: {
          userAgent: expect.any(String),
          url: expect.any(String),
          referrer: expect.any(String),
          timestamp: expect.any(Number),
        },
      });
    });
  });
});
