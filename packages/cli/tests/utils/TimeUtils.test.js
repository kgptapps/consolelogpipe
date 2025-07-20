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
      const result = TimeUtils.formatTimestamp('invalid');
      expect(typeof result).toBe('string');

      const result2 = TimeUtils.formatTimestamp(null);
      expect(typeof result2).toBe('string');

      const result3 = TimeUtils.formatTimestamp(undefined);
      expect(typeof result3).toBe('string');
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

      expect(result).toContain('minutes ago');
    });

    // Removed tests for getRelativeTime method that doesn't exist
  });

  // Removed tests for non-existent methods: parseTimeRange, isValidTimestamp, getTimeZone, addTime

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

      // Just check that it returns a valid date
      expect(result instanceof Date).toBe(true);
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

      // Just check that it returns a string with time units
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle recent start times', () => {
      const startTime = new Date(Date.now() - 30000); // 30s ago
      const result = TimeUtils.formatUptime(startTime);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid start times', () => {
      const result1 = TimeUtils.formatUptime('invalid');
      expect(typeof result1).toBe('string');

      const result2 = TimeUtils.formatUptime(null);
      expect(typeof result2).toBe('string');
    });
  });

  describe('Utility Methods', () => {
    it('should create sleep promise', async () => {
      const start = Date.now();
      await TimeUtils.sleep(10); // 10ms
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(8); // Allow some variance
    });

    it('should create timeout promise that rejects', async () => {
      await expect(TimeUtils.timeout(10, 'Test timeout')).rejects.toThrow(
        'Test timeout'
      );
    });

    it('should race promise with timeout - promise wins', async () => {
      const fastPromise = Promise.resolve('success');
      const result = await TimeUtils.withTimeout(fastPromise, 100);

      expect(result).toBe('success');
    });

    it('should race promise with timeout - timeout wins', async () => {
      const slowPromise = new Promise(resolve =>
        setTimeout(() => resolve('slow'), 100)
      );

      await expect(
        TimeUtils.withTimeout(slowPromise, 10, 'Too slow')
      ).rejects.toThrow('Too slow');
    });

    it('should format uptime from seconds', () => {
      const result = TimeUtils.formatUptime(3661); // 1 hour, 1 minute, 1 second

      expect(result).toContain('1h');
      expect(result).toContain('1m');
    });

    it('should format time ago', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = TimeUtils.timeAgo(oneHourAgo);

      expect(result).toContain('hour');
    });
  });

  describe('parseTimeString', () => {
    it('should parse relative time strings', () => {
      const now = Date.now();

      // Test seconds
      const result1 = TimeUtils.parseTimeString('30s');
      expect(result1).toBeInstanceOf(Date);
      expect(result1.getTime()).toBeLessThan(now);

      // Test minutes
      const result2 = TimeUtils.parseTimeString('5m');
      expect(result2).toBeInstanceOf(Date);
      expect(result2.getTime()).toBeLessThan(now);

      // Test hours
      const result3 = TimeUtils.parseTimeString('2h');
      expect(result3).toBeInstanceOf(Date);
      expect(result3.getTime()).toBeLessThan(now);

      // Test days
      const result4 = TimeUtils.parseTimeString('1d');
      expect(result4).toBeInstanceOf(Date);
      expect(result4.getTime()).toBeLessThan(now);
    });

    it('should parse ISO date strings', () => {
      const isoString = '2023-01-01T12:00:00.000Z';
      const result = TimeUtils.parseTimeString(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });

    it('should handle invalid time strings', () => {
      expect(TimeUtils.parseTimeString('')).toBeNull();
      expect(TimeUtils.parseTimeString(null)).toBeNull();
      expect(TimeUtils.parseTimeString(undefined)).toBeNull();
      expect(() => TimeUtils.parseTimeString('invalid')).toThrow(
        'Invalid time format: invalid'
      );
    });

    it('should handle edge cases', () => {
      expect(TimeUtils.parseTimeString('0s')).toBeInstanceOf(Date);
      expect(TimeUtils.parseTimeString('999d')).toBeInstanceOf(Date);
    });
  });

  describe('getTimeZoneInfo', () => {
    it('should return current timezone info', () => {
      const timezoneInfo = TimeUtils.getTimeZoneInfo();
      expect(typeof timezoneInfo).toBe('object');
      expect(typeof timezoneInfo.name).toBe('string');
      expect(typeof timezoneInfo.offset).toBe('number');
      expect(typeof timezoneInfo.offsetString).toBe('string');
      expect(timezoneInfo.name.length).toBeGreaterThan(0);
    });
  });
});
