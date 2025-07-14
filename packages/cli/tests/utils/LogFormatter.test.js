/**
 * LogFormatter Tests
 */

// Mock chalk to avoid ANSI codes in tests
jest.mock('chalk', () => ({
  red: Object.assign(
    jest.fn(text => `RED(${text})`),
    {
      bold: jest.fn(text => `RED_BOLD(${text})`),
    }
  ),
  yellow: Object.assign(
    jest.fn(text => `YELLOW(${text})`),
    {
      bold: jest.fn(text => `YELLOW_BOLD(${text})`),
    }
  ),
  blue: Object.assign(
    jest.fn(text => `BLUE(${text})`),
    {
      bold: jest.fn(text => `BLUE_BOLD(${text})`),
    }
  ),
  green: jest.fn(text => `GREEN(${text})`),
  gray: jest.fn(text => `GRAY(${text})`),
  cyan: jest.fn(text => `CYAN(${text})`),
  white: Object.assign(
    jest.fn(text => `WHITE(${text})`),
    {
      bold: jest.fn(text => `WHITE_BOLD(${text})`),
    }
  ),
  bold: jest.fn(text => `BOLD(${text})`),
}));

const chalk = require('chalk');
const LogFormatter = require('../../src/utils/LogFormatter');

describe('LogFormatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatLog', () => {
    const mockLogData = {
      level: 'info',
      message: 'Test message',
      timestamp: '2023-01-01T12:00:00.000Z',
      applicationName: 'test-app',
    };

    it('should format log as text by default', () => {
      const result = LogFormatter.formatLog(mockLogData);

      expect(result).toContain('Test message');
      expect(result).toContain('INFO');
    });

    it('should format log as JSON when requested', () => {
      const result = LogFormatter.formatLog(mockLogData, { format: 'json' });

      expect(result).toBe(JSON.stringify(mockLogData, null, 2));
    });

    it('should format log as table when requested', () => {
      const result = LogFormatter.formatLog(mockLogData, { format: 'table' });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle color option', () => {
      const result = LogFormatter.formatLog(mockLogData, { color: false });

      expect(result).toContain('Test message');
      expect(result).toContain('[INFO]');
    });

    it('should handle timestamp option', () => {
      const result = LogFormatter.formatLog(mockLogData, { timestamp: false });

      expect(result).toContain('Test message');
      expect(result).not.toContain('2023-01-01');
    });
  });

  describe('formatError', () => {
    const mockErrorData = {
      type: 'error',
      message: 'Test error',
      stack: 'Error: Test error\n    at test.js:1:1',
      timestamp: '2023-01-01T12:00:00.000Z',
    };

    it('should format error with stack trace', () => {
      const result = LogFormatter.formatError(mockErrorData);

      expect(result).toContain('Test error');
      expect(result).toContain('Error: Test error');
    });

    it('should format error as JSON when requested', () => {
      const result = LogFormatter.formatError(mockErrorData, {
        format: 'json',
      });

      expect(result).toBe(JSON.stringify(mockErrorData, null, 2));
    });

    it('should handle error without stack trace', () => {
      const errorWithoutStack = { ...mockErrorData };
      delete errorWithoutStack.stack;

      const result = LogFormatter.formatError(errorWithoutStack);

      expect(result).toContain('Test error');
    });
  });

  describe('formatNetwork', () => {
    const mockNetworkData = {
      type: 'network',
      method: 'GET',
      url: 'https://api.example.com/data',
      status: 200,
      duration: 150,
      timestamp: '2023-01-01T12:00:00.000Z',
    };

    it('should format network request', () => {
      const result = LogFormatter.formatNetwork(mockNetworkData);

      expect(result).toContain('GET');
      expect(result).toContain('https://api.example.com/data');
      expect(result).toContain('200');
      expect(result).toContain('150ms');
    });

    it('should format network request as JSON when requested', () => {
      const result = LogFormatter.formatNetwork(mockNetworkData, {
        format: 'json',
      });

      expect(result).toBe(JSON.stringify(mockNetworkData, null, 2));
    });

    it('should handle failed network requests', () => {
      const failedRequest = {
        ...mockNetworkData,
        status: 500,
        error: 'Internal Server Error',
      };

      const result = LogFormatter.formatNetwork(failedRequest);

      expect(result).toContain('500');
      expect(result).toContain('RED_BOLD');
    });
  });

  describe('formatLogAsText', () => {
    it('should format different log levels with appropriate colors', () => {
      const logData = {
        level: 'error',
        message: 'Error message',
        timestamp: '2023-01-01T12:00:00.000Z',
      };

      const result = LogFormatter.formatLogAsText(logData, { color: true });

      expect(result).toContain('RED_BOLD');
    });

    it('should format without colors when disabled', () => {
      const logData = {
        level: 'info',
        message: 'Info message',
        timestamp: '2023-01-01T12:00:00.000Z',
      };

      const result = LogFormatter.formatLogAsText(logData, { color: false });

      expect(result).not.toContain('CYAN');
      expect(result).toContain('Info message');
    });

    it('should handle missing timestamp', () => {
      const logData = {
        level: 'info',
        message: 'Message without timestamp',
      };

      const result = LogFormatter.formatLogAsText(logData, {
        color: true,
        timestamp: true,
      });

      expect(result).toContain('Message without timestamp');
    });

    it('should handle missing level', () => {
      const logData = {
        message: 'Message without level',
        timestamp: '2023-01-01T12:00:00.000Z',
      };

      const result = LogFormatter.formatLogAsText(logData, {
        color: true,
        timestamp: true,
      });

      expect(result).toContain('Message without level');
    });
  });

  describe('formatLogAsTable', () => {
    it('should format log data as table rows', () => {
      const logData = {
        level: 'info',
        message: 'Table message',
        timestamp: '2023-01-01T12:00:00.000Z',
        applicationName: 'test-app',
      };

      const result = LogFormatter.formatLogAsTable(logData, {
        color: true,
        timestamp: true,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[1]).toContain('INFO');
      expect(result[2]).toContain('Table message');
      expect(result[3]).toBe('test-app');
    });

    it('should handle missing fields in table format', () => {
      const logData = {
        message: 'Minimal message',
      };

      const result = LogFormatter.formatLogAsTable(logData, {
        color: true,
        timestamp: true,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result[2]).toContain('Minimal message');
    });
  });

  describe('colorizeLevel', () => {
    it('should colorize log levels appropriately', () => {
      const result = LogFormatter.colorizeLevel('error');
      expect(result).toContain('RED_BOLD');
      expect(result).toContain('[ERROR]');
    });
  });

  describe('colorizeHttpMethod', () => {
    it('should colorize HTTP methods appropriately', () => {
      const result = LogFormatter.colorizeHttpMethod('GET');
      expect(result).toContain('GREEN');
      expect(result).toContain('GET');
    });
  });

  describe('truncate', () => {
    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(200);
      const result = LogFormatter.truncate(longMessage, 50);

      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short messages', () => {
      const shortMessage = 'Short message';
      const result = LogFormatter.truncate(shortMessage, 50);

      expect(result).toBe(shortMessage);
    });
  });

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(LogFormatter.formatDuration(500)).toBe('500ms');
      expect(LogFormatter.formatDuration(1500)).toBe('1.5s');
      expect(LogFormatter.formatDuration(65000)).toBe('1.1m');
    });

    it('should handle zero duration', () => {
      expect(LogFormatter.formatDuration(0)).toBe('0ms');
    });

    it('should handle negative durations', () => {
      expect(LogFormatter.formatDuration(-1000)).toBe('-1000ms');
    });
  });

  describe('formatBytes', () => {
    it('should format byte sizes correctly', () => {
      expect(LogFormatter.formatBytes(0)).toBe('0 B');
      expect(LogFormatter.formatBytes(1024)).toBe('1 KB');
      expect(LogFormatter.formatBytes(1048576)).toBe('1 MB');
      expect(LogFormatter.formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('colorizeStatusCode', () => {
    it('should colorize status codes appropriately', () => {
      const result200 = LogFormatter.colorizeStatusCode(200);
      const result404 = LogFormatter.colorizeStatusCode(404);
      const result500 = LogFormatter.colorizeStatusCode(500);

      expect(result200).toContain('GREEN');
      expect(result404).toContain('RED'); // 404 is treated as error
      expect(result500).toContain('RED');
    });
  });
});
