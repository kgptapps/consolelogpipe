const LogInterceptor = require('../../../src/core/log/LogInterceptor');
const LogFormatter = require('../../../src/core/log/LogFormatter');

describe('LogInterceptor', () => {
  let interceptor;
  let formatter;
  let mockOnLogData;
  let mockCreateLogEntry;
  let originalConsole;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    const options = {
      applicationName: 'test-app',
      sessionId: 'test-session-123',
      serverPort: 3087,
    };

    formatter = new LogFormatter(options);
    mockOnLogData = jest.fn();
    mockCreateLogEntry = jest.fn().mockReturnValue({
      level: 'info',
      message: 'test message',
      timestamp: new Date().toISOString(),
    });

    interceptor = new LogInterceptor(
      options,
      formatter,
      mockOnLogData,
      mockCreateLogEntry
    );
  });

  afterEach(() => {
    // Restore original console methods
    if (interceptor && interceptor.isActive()) {
      interceptor.stopInterception();
    }
    Object.assign(console, originalConsole);
  });

  describe('Filter Management', () => {
    describe('addFilter', () => {
      it('should add exclude pattern', () => {
        interceptor.addFilter('exclude', 'password');

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toContain('password');
      });

      it('should add include pattern', () => {
        interceptor.addFilter('include', 'important');

        const filters = interceptor.getFilters();
        expect(filters.includePatterns).toContain('important');
      });

      it('should handle regex patterns', () => {
        const regexPattern = /test.*/;
        interceptor.addFilter('exclude', regexPattern);

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toContain(regexPattern);
      });

      it('should ignore invalid filter types', () => {
        const initialFilters = interceptor.getFilters();
        interceptor.addFilter('invalid', 'pattern');

        const newFilters = interceptor.getFilters();
        expect(newFilters).toEqual(initialFilters);
      });
    });

    describe('removeFilter', () => {
      beforeEach(() => {
        interceptor.addFilter('exclude', 'password');
        interceptor.addFilter('exclude', 'secret');
        interceptor.addFilter('include', 'important');
        interceptor.addFilter('include', 'debug');
      });

      it('should remove exclude pattern', () => {
        interceptor.removeFilter('exclude', 'password');

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).not.toContain('password');
        expect(filters.excludePatterns).toContain('secret');
      });

      it('should remove include pattern', () => {
        interceptor.removeFilter('include', 'important');

        const filters = interceptor.getFilters();
        expect(filters.includePatterns).not.toContain('important');
        expect(filters.includePatterns).toContain('debug');
      });

      it('should handle non-existent patterns gracefully', () => {
        const initialFilters = interceptor.getFilters();
        interceptor.removeFilter('exclude', 'nonexistent');

        const newFilters = interceptor.getFilters();
        expect(newFilters.excludePatterns).toEqual(
          initialFilters.excludePatterns
        );
      });

      it('should ignore invalid filter types', () => {
        const initialFilters = interceptor.getFilters();
        interceptor.removeFilter('invalid', 'password');

        const newFilters = interceptor.getFilters();
        expect(newFilters).toEqual(initialFilters);
      });
    });

    describe('clearFilters', () => {
      beforeEach(() => {
        interceptor.addFilter('exclude', 'password');
        interceptor.addFilter('include', 'important');
        interceptor.setLevelFilter(['error', 'warn']);
      });

      it('should clear exclude filters only', () => {
        interceptor.clearFilters('exclude');

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toEqual([]);
        expect(filters.includePatterns).toContain('important');
        expect(filters.levels).toEqual(['error', 'warn']);
      });

      it('should clear include filters only', () => {
        interceptor.clearFilters('include');

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toContain('password');
        expect(filters.includePatterns).toEqual([]);
        expect(filters.levels).toEqual(['error', 'warn']);
      });

      it('should clear all filters', () => {
        interceptor.clearFilters('all');

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toEqual([]);
        expect(filters.includePatterns).toEqual([]);
        expect(filters.levels).toBeNull();
      });

      it('should clear all filters by default', () => {
        interceptor.clearFilters();

        const filters = interceptor.getFilters();
        expect(filters.excludePatterns).toEqual([]);
        expect(filters.includePatterns).toEqual([]);
        expect(filters.levels).toBeNull();
      });
    });

    describe('setLevelFilter', () => {
      it('should set level filter', () => {
        interceptor.setLevelFilter(['error', 'warn']);

        const filters = interceptor.getFilters();
        expect(filters.levels).toEqual(['error', 'warn']);
      });

      it('should clear level filter when set to null', () => {
        interceptor.setLevelFilter(['error']);
        interceptor.setLevelFilter(null);

        const filters = interceptor.getFilters();
        expect(filters.levels).toBeNull();
      });
    });

    describe('getFilters', () => {
      it('should return copy of current filters', () => {
        interceptor.addFilter('exclude', 'password');
        interceptor.addFilter('include', 'important');
        interceptor.setLevelFilter(['error', 'warn']);

        const filters = interceptor.getFilters();

        expect(filters.excludePatterns).toEqual(['password']);
        expect(filters.includePatterns).toEqual(['important']);
        expect(filters.levels).toEqual(['error', 'warn']);

        // Verify it's a copy, not reference
        filters.excludePatterns.push('test');
        const newFilters = interceptor.getFilters();
        expect(newFilters.excludePatterns).not.toContain('test');
      });

      it('should handle null levels', () => {
        const filters = interceptor.getFilters();
        expect(filters.levels).toBeNull();
      });
    });
  });

  describe('Status Methods', () => {
    describe('isActive', () => {
      it('should return false when not intercepting', () => {
        expect(interceptor.isActive()).toBe(false);
      });

      it('should return true when intercepting', () => {
        interceptor.startInterception();
        expect(interceptor.isActive()).toBe(true);
      });

      it('should return false after stopping', () => {
        interceptor.startInterception();
        interceptor.stopInterception();
        expect(interceptor.isActive()).toBe(false);
      });
    });

    describe('getOriginalConsole', () => {
      it('should return copy of original console methods after interception starts', () => {
        interceptor.startInterception();
        const original = interceptor.getOriginalConsole();

        expect(original).toHaveProperty('log');
        expect(original).toHaveProperty('error');
        expect(original).toHaveProperty('warn');
        expect(original).toHaveProperty('info');
        expect(original).toHaveProperty('debug');

        // Verify it's a copy
        original.log = jest.fn();
        const newOriginal = interceptor.getOriginalConsole();
        expect(newOriginal.log).not.toBe(original.log);
      });

      it('should return console methods when not intercepting', () => {
        const original = interceptor.getOriginalConsole();
        // After our fix, original console methods are captured immediately in constructor
        expect(original).toHaveProperty('log');
        expect(original).toHaveProperty('error');
        expect(original).toHaveProperty('warn');
        expect(original).toHaveProperty('info');
        expect(original).toHaveProperty('debug');
      });
    });
  });

  describe('Integration with Filtering', () => {
    beforeEach(() => {
      interceptor.startInterception();
    });

    it('should respect exclude patterns during interception', () => {
      interceptor.addFilter('exclude', 'password');

      console.log('normal message');
      console.log('password: 123456');

      expect(mockOnLogData).toHaveBeenCalledTimes(1);
    });

    it('should respect include patterns during interception', () => {
      interceptor.addFilter('include', 'important');

      console.log('normal message');
      console.log('important information');

      expect(mockOnLogData).toHaveBeenCalledTimes(1);
    });

    it('should respect level filters during interception', () => {
      interceptor.setLevelFilter(['error']);

      console.log('log message');
      console.error('error message');
      console.warn('warn message');

      expect(mockOnLogData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in createLogEntry gracefully', () => {
      mockCreateLogEntry.mockImplementation(() => {
        throw new Error('Test error');
      });

      interceptor.startInterception();

      // Should not throw
      expect(() => {
        console.log('test message');
      }).not.toThrow();

      expect(mockOnLogData).not.toHaveBeenCalled();
    });
  });
});
