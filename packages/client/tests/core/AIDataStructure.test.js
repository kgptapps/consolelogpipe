/**
 * AIDataStructure.test.js - Tests for AI-friendly data structure implementation
 */

import LogCapture from '../../src/core/LogCapture.js';

describe('AI-Friendly Data Structure', () => {
  let logCapture;
  let listener;

  beforeEach(() => {
    listener = jest.fn();
    logCapture = new LogCapture({ applicationName: 'ai-test-app' });
    logCapture.addListener(listener);
    logCapture.start();
  });

  afterEach(() => {
    if (logCapture) {
      logCapture.stop();
    }
  });

  describe('Structured JSON Format', () => {
    it('should create structured log entry with all AI-friendly fields', () => {
      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          // Core log data
          level: 'log',
          message: 'test message',
          args: ['test message'],
          timestamp: expect.any(String),

          // Application context
          application: expect.objectContaining({
            name: 'ai-test-app',
            sessionId: expect.any(String),
            environment: 'development',
            developer: null,
            branch: null,
            port: expect.any(Number),
          }),

          // AI-friendly categorization
          category: expect.any(String),
          severity: expect.objectContaining({
            level: expect.any(String),
            score: expect.any(Number),
            description: expect.any(String),
          }),
          tags: expect.arrayContaining(['log']),

          // Performance metrics
          performance: expect.objectContaining({
            timing: expect.objectContaining({
              now: expect.any(Number),
              timeOrigin: expect.any(Number),
            }),
          }),

          // Error analysis (null for non-error logs)
          errorAnalysis: null,

          // Enhanced context
          context: expect.objectContaining({
            browser: expect.any(Object),
            timing: expect.any(Object),
            url: expect.any(Object),
          }),
        })
      );
    });

    it('should include error analysis for error logs', () => {
      console.error('TypeError: Cannot read property map of undefined');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          category: 'runtime_error',
          errorAnalysis: expect.objectContaining({
            type: 'TypeError',
            cause: expect.any(String),
            suggestions: expect.arrayContaining([expect.any(String)]),
            recoverable: expect.any(Boolean),
            impact: expect.any(String),
          }),
          severity: expect.objectContaining({
            level: 'critical',
            score: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Error Categorization System', () => {
    it('should categorize TypeError correctly', () => {
      console.error('TypeError: Cannot read property of undefined');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'runtime_error',
          tags: expect.arrayContaining(['error', 'type-error']),
        })
      );
    });

    it('should categorize SyntaxError correctly', () => {
      console.error('SyntaxError: Unexpected token');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'syntax_error',
          tags: expect.arrayContaining(['error', 'syntax-error']),
        })
      );
    });

    it('should categorize network errors correctly', () => {
      console.error('Failed to fetch /api/users');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'network_error',
          tags: expect.arrayContaining(['error', 'api']),
        })
      );
    });

    it('should categorize security errors correctly', () => {
      console.error('CORS policy violation');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'security_error',
          tags: expect.arrayContaining(['error', 'security']),
        })
      );
    });

    it('should categorize performance errors correctly', () => {
      console.error('Memory leak detected');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance_error',
          tags: expect.arrayContaining(['error', 'memory']),
        })
      );
    });
  });

  describe('Severity Levels', () => {
    it('should assign critical severity to uncaught errors', () => {
      console.error('Uncaught TypeError: Fatal error');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: expect.objectContaining({
            level: 'critical',
            score: 10,
            description:
              'Requires immediate attention - may cause application failure',
          }),
        })
      );
    });

    it('should assign high severity to security errors', () => {
      console.error('XSS vulnerability detected');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: expect.objectContaining({
            level: 'critical',
            score: 9,
          }),
        })
      );
    });

    it('should assign medium severity to network errors', () => {
      console.error('Network timeout occurred');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: expect.objectContaining({
            level: 'high',
            score: 7,
          }),
        })
      );
    });

    it('should assign low severity to info logs', () => {
      console.info('User clicked button');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: expect.objectContaining({
            level: 'low',
            score: 2,
            description: 'Informational - no immediate action required',
          }),
        })
      );
    });
  });

  describe('AI-Friendly Tags', () => {
    it('should generate technology tags', () => {
      console.log('React component rendered successfully');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining([
            'log',
            'react',
            'env:development',
            'app:ai-test-app',
          ]),
        })
      );
    });

    it('should generate API tags', () => {
      console.log('API request to /users endpoint');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining([
            'log',
            'api',
            'env:development',
            'app:ai-test-app',
          ]),
        })
      );
    });

    it('should generate authentication tags', () => {
      console.log('User login successful with token');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining([
            'log',
            'authentication',
            'env:development',
            'app:ai-test-app',
          ]),
        })
      );
    });

    it('should generate user interaction tags', () => {
      console.log('Button click event triggered');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining([
            'log',
            'user-interaction',
            'env:development',
            'app:ai-test-app',
          ]),
        })
      );
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect memory metrics when available', () => {
      // Mock performance.memory
      const originalMemory = performance.memory;
      performance.memory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      };

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          performance: expect.objectContaining({
            memory: expect.objectContaining({
              used: 1000000,
              total: 2000000,
              limit: 4000000,
              usage: 50,
            }),
          }),
        })
      );

      // Restore original
      performance.memory = originalMemory;
    });

    it('should collect timing metrics', () => {
      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          performance: expect.objectContaining({
            timing: expect.objectContaining({
              now: expect.any(Number),
              timeOrigin: expect.any(Number),
            }),
          }),
        })
      );
    });

    it('should handle performance metrics collection errors gracefully', () => {
      // Mock performance to throw error
      const originalNow = performance.now;
      performance.now = () => {
        throw new Error('Performance API error');
      };

      console.log('test message');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          performance: expect.objectContaining({
            error: 'Performance metrics collection failed',
          }),
        })
      );

      // Restore original
      performance.now = originalNow;
    });
  });

  describe('Error Analysis', () => {
    it('should provide recovery suggestions for TypeError', () => {
      console.error('TypeError: Cannot read property map of undefined');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorAnalysis: expect.objectContaining({
            type: 'TypeError',
            suggestions: expect.arrayContaining([
              'Check if the variable is defined before using it',
              'Verify the data type matches the expected type',
              'Add null/undefined checks',
              'Use optional chaining (?.) for object properties',
            ]),
            recoverable: true,
            impact: 'high',
          }),
        })
      );
    });

    it('should provide recovery suggestions for ReferenceError', () => {
      console.error('ReferenceError: variable is not defined');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorAnalysis: expect.objectContaining({
            type: 'ReferenceError',
            suggestions: expect.arrayContaining([
              'Check if the variable is declared',
              'Verify the variable scope',
              'Check for typos in variable names',
              'Ensure imports/requires are correct',
            ]),
            recoverable: true,
            impact: 'high',
          }),
        })
      );
    });

    it('should mark SyntaxError as non-recoverable', () => {
      console.error('SyntaxError: Unexpected token');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          errorAnalysis: expect.objectContaining({
            type: 'SyntaxError',
            recoverable: false,
            impact: 'critical',
          }),
        })
      );
    });
  });
});
