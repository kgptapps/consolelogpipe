const LogFormatter = require('../../../src/core/log/LogFormatter');
const LogAnalyzer = require('../../../src/core/log/LogAnalyzer');

describe('LogFormatter', () => {
  let formatter;
  let mockLogEntry;

  beforeEach(() => {
    const options = {
      applicationName: 'test-app',
      sessionId: 'test-session-123',
      serverPort: 3087,
    };
    formatter = new LogFormatter(options);

    mockLogEntry = {
      level: 'info',
      message: 'Test message',
      args: ['Test message'],
      timestamp: '2023-01-01T12:00:00.000Z',
      application: {
        name: 'test-app',
        sessionId: 'test-session-123',
        environment: 'development',
        serverPort: 3087,
      },
      category: 'general',
      severity: {
        level: 'low',
        score: 2,
        factors: ['general'],
      },
      metadata: {
        userAgent: 'test-agent',
        url: 'http://localhost:3000',
        timestamp: Date.now(),
      },
    };
  });

  describe('formatForConsole', () => {
    it('should format log entry for console output', () => {
      const result = formatter.formatForConsole(mockLogEntry);

      expect(result).toContain('INFO ');
      expect(result).toContain('[test-app]');
      expect(result).toContain('[general]');
      expect(result).toContain('[LOW]');
      expect(result).toContain('Test message');
    });

    it('should handle different log levels', () => {
      mockLogEntry.level = 'error';
      const result = formatter.formatForConsole(mockLogEntry);

      expect(result).toContain('ERROR');
    });

    it('should pad log level to 5 characters', () => {
      mockLogEntry.level = 'log';
      const result = formatter.formatForConsole(mockLogEntry);

      expect(result).toContain('LOG  '); // padded to 5 chars
    });
  });

  describe('formatForJSON', () => {
    it('should format log entry as JSON string', () => {
      const result = formatter.formatForJSON(mockLogEntry);

      expect(result).toContain('"level": "info"');
      expect(result).toContain('"message": "Test message"');
      expect(result).toContain('"application"');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle serialization errors gracefully', () => {
      // Create an object with circular reference
      const circularEntry = { ...mockLogEntry };
      circularEntry.circular = circularEntry;

      const result = formatter.formatForJSON(circularEntry);

      expect(result).toContain('"error": "Failed to serialize log entry"');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('formatForTransmission', () => {
    it('should format log entry for remote transmission', () => {
      const result = formatter.formatForTransmission(mockLogEntry);

      expect(result).toHaveProperty('transmission');
      expect(result.transmission).toHaveProperty('timestamp');
      expect(result.transmission).toHaveProperty('version', '1.0.0');
      expect(result.transmission).toHaveProperty('format', 'console-log-pipe');
      expect(result.level).toBe('info');
      expect(result.message).toBe('Test message');
    });

    it('should handle circular references in transmission', () => {
      const circularEntry = { ...mockLogEntry };
      circularEntry.circular = circularEntry;

      const result = formatter.formatForTransmission(circularEntry);

      expect(result).toHaveProperty('transmission');
      // The circular reference should be handled and the result should be serializable
      expect(() => JSON.stringify(result)).not.toThrow();
      expect(result.circular).toBeDefined();
    });

    it('should handle serialization errors gracefully', () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Serialization failed');
      });

      const result = formatter.formatForTransmission(mockLogEntry);

      expect(result).toHaveProperty(
        'error',
        'Failed to prepare log for transmission'
      );
      expect(result).toHaveProperty('message', 'Serialization failed');
      expect(result).toHaveProperty('originalLevel', 'info');
      expect(result).toHaveProperty('originalMessage', 'Test message');

      // Restore original JSON.stringify
      JSON.stringify = originalStringify;
    });
  });

  describe('createLogSummary', () => {
    let logEntries;

    beforeEach(() => {
      logEntries = [
        {
          ...mockLogEntry,
          level: 'info',
          category: 'general',
          severity: { level: 'low' },
          timestamp: '2023-01-01T12:00:00.000Z',
          application: { name: 'app1' },
        },
        {
          ...mockLogEntry,
          level: 'error',
          category: 'network',
          severity: { level: 'high' },
          timestamp: '2023-01-01T12:05:00.000Z',
          application: { name: 'app2' },
        },
        {
          ...mockLogEntry,
          level: 'warn',
          category: 'general',
          severity: { level: 'medium' },
          timestamp: '2023-01-01T12:10:00.000Z',
          application: { name: 'app1' },
        },
      ];
    });

    it('should create summary of log entries', () => {
      const result = formatter.createLogSummary(logEntries);

      expect(result.total).toBe(3);
      expect(result.byLevel).toEqual({
        info: 1,
        error: 1,
        warn: 1,
      });
      expect(result.byCategory).toEqual({
        general: 2,
        network: 1,
      });
      expect(result.bySeverity).toEqual({
        low: 1,
        high: 1,
        medium: 1,
      });
      expect(result.applications).toEqual(['app1', 'app2']);
      expect(result.errors).toBe(1);
      expect(result.warnings).toBe(1);
    });

    it('should handle time range correctly', () => {
      const result = formatter.createLogSummary(logEntries);

      expect(result.timeRange.start).toEqual(
        new Date('2023-01-01T12:00:00.000Z')
      );
      expect(result.timeRange.end).toEqual(
        new Date('2023-01-01T12:10:00.000Z')
      );
    });

    it('should handle empty log entries array', () => {
      const result = formatter.createLogSummary([]);

      expect(result.total).toBe(0);
      expect(result.byLevel).toEqual({});
      expect(result.byCategory).toEqual({});
      expect(result.bySeverity).toEqual({});
      expect(result.applications).toEqual([]);
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.timeRange.start).toBeNull();
      expect(result.timeRange.end).toBeNull();
    });

    it('should handle entries without severity', () => {
      const entriesWithoutSeverity = [
        {
          ...mockLogEntry,
          severity: null,
        },
        {
          ...mockLogEntry,
          severity: undefined,
        },
      ];

      const result = formatter.createLogSummary(entriesWithoutSeverity);

      expect(result.bySeverity).toEqual({
        unknown: 2,
      });
    });

    it('should handle entries without application name', () => {
      const entriesWithoutApp = [
        {
          ...mockLogEntry,
          application: null,
        },
        {
          ...mockLogEntry,
          application: { name: null },
        },
      ];

      const result = formatter.createLogSummary(entriesWithoutApp);

      expect(result.applications).toEqual([]);
    });
  });

  describe('filterLogEntries', () => {
    let logEntries;

    beforeEach(() => {
      logEntries = [
        {
          ...mockLogEntry,
          level: 'info',
          message: 'Info message',
          application: { name: 'app1' },
          severity: { level: 'low' },
          timestamp: '2023-01-01T12:00:00.000Z',
        },
        {
          ...mockLogEntry,
          level: 'error',
          message: 'Error message',
          application: { name: 'app2' },
          severity: { level: 'high' },
          timestamp: '2023-01-01T12:05:00.000Z',
        },
        {
          ...mockLogEntry,
          level: 'warn',
          message: 'Warning message',
          application: { name: 'app1' },
          severity: { level: 'medium' },
          timestamp: '2023-01-01T12:10:00.000Z',
        },
      ];
    });

    it('should filter by levels', () => {
      const result = formatter.filterLogEntries(logEntries, {
        levels: ['info', 'warn'],
      });

      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('info');
      expect(result[1].level).toBe('warn');
    });

    it('should filter by applications', () => {
      const result = formatter.filterLogEntries(logEntries, {
        applications: ['app1'],
      });

      expect(result).toHaveLength(2);
      expect(result[0].application.name).toBe('app1');
      expect(result[1].application.name).toBe('app1');
    });

    it('should filter by severities', () => {
      const result = formatter.filterLogEntries(logEntries, {
        severities: ['high'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].severity.level).toBe('high');
    });

    it('should filter by time range', () => {
      const result = formatter.filterLogEntries(logEntries, {
        timeRange: {
          start: new Date('2023-01-01T12:02:00.000Z'),
          end: new Date('2023-01-01T12:08:00.000Z'),
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
    });

    it('should filter by message pattern (string)', () => {
      const result = formatter.filterLogEntries(logEntries, {
        messagePattern: 'error',
      });

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Error message');
    });

    it('should filter by message pattern (regex)', () => {
      const result = formatter.filterLogEntries(logEntries, {
        messagePattern: /^Info/,
      });

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Info message');
    });

    it('should handle multiple filters', () => {
      const result = formatter.filterLogEntries(logEntries, {
        levels: ['info', 'warn'],
        applications: ['app1'],
      });

      expect(result).toHaveLength(2);
      expect(result.every(entry => entry.application.name === 'app1')).toBe(
        true
      );
      expect(
        result.every(entry => ['info', 'warn'].includes(entry.level))
      ).toBe(true);
    });

    it('should return all entries when no filters provided', () => {
      const result = formatter.filterLogEntries(logEntries);

      expect(result).toHaveLength(3);
    });

    it('should handle entries without application name in filter', () => {
      const entriesWithoutApp = [
        {
          ...mockLogEntry,
          application: null,
        },
      ];

      const result = formatter.filterLogEntries(entriesWithoutApp, {
        applications: ['app1'],
      });

      expect(result).toHaveLength(0);
    });

    it('should handle entries without severity in filter', () => {
      const entriesWithoutSeverity = [
        {
          ...mockLogEntry,
          severity: null,
        },
      ];

      const result = formatter.filterLogEntries(entriesWithoutSeverity, {
        severities: ['high'],
      });

      expect(result).toHaveLength(0);
    });
  });
});
