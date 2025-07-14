/**
 * TimeUtils Tests
 */

const TimeUtils = require('../../src/utils/TimeUtils');

describe('TimeUtils', () => {
  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(TimeUtils.formatDuration(500)).toBe('500ms');
      expect(TimeUtils.formatDuration(999)).toBe('999ms');
    });

    it('should format seconds correctly', () => {
      expect(TimeUtils.formatDuration(1000)).toBe('1s');
      expect(TimeUtils.formatDuration(1500)).toBe('1s');
      expect(TimeUtils.formatDuration(59000)).toBe('59s');
    });

    it('should format minutes correctly', () => {
      expect(TimeUtils.formatDuration(60000)).toBe('1m');
      expect(TimeUtils.formatDuration(90000)).toBe('1m 30s');
      expect(TimeUtils.formatDuration(3599000)).toBe('59m 59s');
    });

    it('should format hours correctly', () => {
      expect(TimeUtils.formatDuration(3600000)).toBe('1h');
      expect(TimeUtils.formatDuration(3660000)).toBe('1h 1m');
      expect(TimeUtils.formatDuration(7200000)).toBe('2h');
    });

    it('should format days correctly', () => {
      expect(TimeUtils.formatDuration(86400000)).toBe('1d');
      expect(TimeUtils.formatDuration(90000000)).toBe('1d 1h');
      expect(TimeUtils.formatDuration(172800000)).toBe('2d');
    });

    it('should handle zero duration', () => {
      expect(TimeUtils.formatDuration(0)).toBe('0ms');
    });

    it('should handle negative durations', () => {
      expect(TimeUtils.formatDuration(-1000)).toBe('-1000ms');
      expect(TimeUtils.formatDuration(-3600000)).toBe('-3600000ms');
    });
  });

  describe('formatTimestamp', () => {
    it('should format ISO timestamp to readable format', () => {
      const timestamp = '2023-01-01T12:30:45.123Z';
      const result = TimeUtils.formatTimestamp(timestamp);

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}/);
    });

    it('should format timestamp with custom format', () => {
      const timestamp = '2023-01-01T12:30:45.123Z';
      const result = TimeUtils.formatTimestamp(timestamp, 'time');

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format timestamp as date only', () => {
      const timestamp = '2023-01-01T12:30:45.123Z';
      const result = TimeUtils.formatTimestamp(timestamp, 'date');

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle invalid timestamps', () => {
      expect(TimeUtils.formatTimestamp('invalid')).toBe(
        'Invalid Date Invalid Date'
      );
      expect(TimeUtils.formatTimestamp(null)).toBe('Invalid Date Invalid Date');
      expect(TimeUtils.formatTimestamp(undefined)).toBe(
        'Invalid Date Invalid Date'
      );
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T12:30:45.123Z');
      const result = TimeUtils.formatTimestamp(date);

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}/);
    });

    it('should handle timestamps in different timezones', () => {
      const timestamp = '2023-01-01T12:30:45.123Z';
      const result = TimeUtils.formatTimestamp(timestamp, 'datetime', 'UTC');

      expect(result).toContain('1/1/2023');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return relative time for recent timestamps', () => {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

      const result = TimeUtils.formatRelativeTime(fiveMinutesAgo);

      expect(result).toBe('5 minutes ago');
    });

    it('should return relative time for future timestamps', () => {
      const now = Date.now();
      const inTenMinutes = new Date(now + 10 * 60 * 1000);

      const result = TimeUtils.getRelativeTime(inTenMinutes);

      expect(result).toBe('in 10 minutes');
    });

    it('should handle seconds', () => {
      const now = Date.now();
      const thirtySecondsAgo = new Date(now - 30 * 1000);

      const result = TimeUtils.getRelativeTime(thirtySecondsAgo);

      expect(result).toBe('30 seconds ago');
    });

    it('should handle hours', () => {
      const now = Date.now();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);

      const result = TimeUtils.getRelativeTime(twoHoursAgo);

      expect(result).toBe('2 hours ago');
    });

    it('should handle days', () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

      const result = TimeUtils.getRelativeTime(threeDaysAgo);

      expect(result).toBe('3 days ago');
    });

    it('should handle just now', () => {
      const now = new Date();

      const result = TimeUtils.getRelativeTime(now);

      expect(result).toBe('just now');
    });

    it('should handle invalid dates', () => {
      expect(TimeUtils.getRelativeTime('invalid')).toBe('Invalid Date');
      expect(TimeUtils.getRelativeTime(null)).toBe('Invalid Date');
    });
  });

  describe('parseTimeRange', () => {
    it('should parse time range strings', () => {
      const result = TimeUtils.parseTimeRange('1h');

      expect(result).toBe(3600000); // 1 hour in ms
    });

    it('should parse different time units', () => {
      expect(TimeUtils.parseTimeRange('30s')).toBe(30000);
      expect(TimeUtils.parseTimeRange('5m')).toBe(300000);
      expect(TimeUtils.parseTimeRange('2h')).toBe(7200000);
      expect(TimeUtils.parseTimeRange('1d')).toBe(86400000);
    });

    it('should parse complex time ranges', () => {
      expect(TimeUtils.parseTimeRange('1h 30m')).toBe(5400000);
      expect(TimeUtils.parseTimeRange('2d 3h 15m')).toBe(183900000);
    });

    it('should handle invalid time ranges', () => {
      expect(TimeUtils.parseTimeRange('invalid')).toBe(0);
      expect(TimeUtils.parseTimeRange('')).toBe(0);
      expect(TimeUtils.parseTimeRange(null)).toBe(0);
    });

    it('should handle numeric input as milliseconds', () => {
      expect(TimeUtils.parseTimeRange(5000)).toBe(5000);
      expect(TimeUtils.parseTimeRange('5000')).toBe(5000);
    });
  });

  describe('isValidTimestamp', () => {
    it('should validate ISO timestamps', () => {
      expect(TimeUtils.isValidTimestamp('2023-01-01T12:00:00.000Z')).toBe(true);
      expect(TimeUtils.isValidTimestamp('2023-01-01T12:00:00Z')).toBe(true);
    });

    it('should validate Date objects', () => {
      expect(TimeUtils.isValidTimestamp(new Date())).toBe(true);
      expect(TimeUtils.isValidTimestamp(new Date('invalid'))).toBe(false);
    });

    it('should validate numeric timestamps', () => {
      expect(TimeUtils.isValidTimestamp(Date.now())).toBe(true);
      expect(TimeUtils.isValidTimestamp(1640995200000)).toBe(true);
    });

    it('should reject invalid timestamps', () => {
      expect(TimeUtils.isValidTimestamp('invalid')).toBe(false);
      expect(TimeUtils.isValidTimestamp('')).toBe(false);
      expect(TimeUtils.isValidTimestamp(null)).toBe(false);
      expect(TimeUtils.isValidTimestamp(undefined)).toBe(false);
    });
  });

  describe('getTimeZone', () => {
    it('should return current timezone', () => {
      const result = TimeUtils.getTimeZone();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle timezone offset', () => {
      const result = TimeUtils.getTimeZone(true);

      expect(result).toMatch(/^[+-]\d{2}:\d{2}$/);
    });
  });

  describe('addTime', () => {
    it('should add time to date', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = TimeUtils.addTime(date, 1, 'hour');

      expect(result.getTime()).toBe(date.getTime() + 3600000);
    });

    it('should add different time units', () => {
      const date = new Date('2023-01-01T12:00:00Z');

      expect(TimeUtils.addTime(date, 30, 'second').getTime()).toBe(
        date.getTime() + 30000
      );
      expect(TimeUtils.addTime(date, 15, 'minute').getTime()).toBe(
        date.getTime() + 900000
      );
      expect(TimeUtils.addTime(date, 1, 'day').getTime()).toBe(
        date.getTime() + 86400000
      );
    });

    it('should handle negative values', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = TimeUtils.addTime(date, -1, 'hour');

      expect(result.getTime()).toBe(date.getTime() - 3600000);
    });

    it('should handle invalid units', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = TimeUtils.addTime(date, 1, 'invalid');

      expect(result.getTime()).toBe(date.getTime());
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const date = new Date('2023-01-01T15:30:45.123Z');
      const result = TimeUtils.getStartOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle timezone', () => {
      const date = new Date('2023-01-01T15:30:45.123Z');
      const result = TimeUtils.getStartOfDay(date, 'UTC');

      expect(result.getUTCHours()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day', () => {
      const date = new Date('2023-01-01T15:30:45.123Z');
      const result = TimeUtils.getEndOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('formatUptime', () => {
    it('should format uptime from start time', () => {
      const startTime = new Date(Date.now() - 3661000); // 1h 1m 1s ago
      const result = TimeUtils.formatUptime(startTime);

      expect(result).toContain('1h');
      expect(result).toContain('1m');
    });

    it('should handle recent start times', () => {
      const startTime = new Date(Date.now() - 30000); // 30s ago
      const result = TimeUtils.formatUptime(startTime);

      expect(result).toContain('30s');
    });

    it('should handle invalid start times', () => {
      expect(TimeUtils.formatUptime('invalid')).toBe('Unknown');
      expect(TimeUtils.formatUptime(null)).toBe('Unknown');
    });
  });
});
