/**
 * TimeUtils - Time and date utilities for Console Log Pipe CLI
 */

class TimeUtils {
  /**
   * Format duration in milliseconds to human readable format
   */
  static formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }

    return `${seconds}s`;
  }

  /**
   * Format timestamp to human readable format
   */
  static formatTimestamp(timestamp, options = {}) {
    const {
      includeDate = true,
      includeTime = true,
      includeSeconds = true,
      relative = false,
      format = 'local',
    } = options;

    const date = new Date(timestamp);

    if (relative) {
      return this.formatRelativeTime(date);
    }

    const parts = [];

    if (includeDate) {
      if (format === 'iso') {
        parts.push(date.toISOString().split('T')[0]);
      } else {
        parts.push(date.toLocaleDateString());
      }
    }

    if (includeTime) {
      if (format === 'iso') {
        const timeStr = date.toISOString().split('T')[1];
        parts.push(
          includeSeconds ? timeStr.split('.')[0] : timeStr.substring(0, 5)
        );
      } else {
        const timeOptions = {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        };
        if (includeSeconds) {
          timeOptions.second = '2-digit';
        }
        parts.push(date.toLocaleTimeString([], timeOptions));
      }
    }

    return parts.join(' ');
  }

  /**
   * Format relative time (e.g., "2 minutes ago")
   */
  static formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return diffSeconds <= 1 ? 'just now' : `${diffSeconds} seconds ago`;
    }

    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }

    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }

    if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }

    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }

    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }

  /**
   * Parse time string to timestamp
   */
  static parseTimeString(timeStr) {
    if (!timeStr) {
      return null;
    }

    // Handle relative time strings
    const relativeMatch = timeStr.match(/^(\d+)([smhd])$/);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2];
      const now = Date.now();

      switch (unit) {
        case 's':
          return new Date(now - value * 1000);
        case 'm':
          return new Date(now - value * 60 * 1000);
        case 'h':
          return new Date(now - value * 60 * 60 * 1000);
        case 'd':
          return new Date(now - value * 24 * 60 * 60 * 1000);
        default:
          break;
      }
    }

    // Handle absolute time strings
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Handle common formats
    const formats = [
      // ISO formats
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      /^\d{4}-\d{2}-\d{2}/,

      // US formats
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      /^\d{1,2}-\d{1,2}-\d{4}/,

      // Time only
      /^\d{1,2}:\d{2}(:\d{2})?/,
    ];

    for (const format of formats) {
      if (format.test(timeStr)) {
        const parsed = new Date(timeStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    throw new Error(`Invalid time format: ${timeStr}`);
  }

  /**
   * Get time zone information
   */
  static getTimeZoneInfo() {
    const date = new Date();
    return {
      name: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: date.getTimezoneOffset(),
      offsetString: this.formatTimezoneOffset(date.getTimezoneOffset()),
    };
  }

  /**
   * Format timezone offset
   */
  static formatTimezoneOffset(offsetMinutes) {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes <= 0 ? '+' : '-';

    return `${sign}${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Check if date is today
   */
  static isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);

    return today.toDateString() === checkDate.toDateString();
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);

    return yesterday.toDateString() === checkDate.toDateString();
  }

  /**
   * Get start of day
   */
  static getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get end of day
   */
  static getEndOfDay(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Get start of week
   */
  static getStartOfWeek(date = new Date()) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get start of month
   */
  static getStartOfMonth(date = new Date()) {
    const start = new Date(date);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a timeout promise
   */
  static timeout(ms, message = 'Operation timed out') {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Race a promise against a timeout
   */
  static withTimeout(promise, ms, message) {
    return Promise.race([promise, this.timeout(ms, message)]);
  }

  /**
   * Format uptime from process.uptime()
   */
  static formatUptime(uptimeSeconds) {
    return this.formatDuration(uptimeSeconds * 1000);
  }

  /**
   * Get human readable time ago
   */
  static timeAgo(date) {
    return this.formatRelativeTime(new Date(date));
  }

  /**
   * Convert milliseconds to various units
   */
  static convertMs(ms) {
    return {
      milliseconds: ms,
      seconds: ms / 1000,
      minutes: ms / (1000 * 60),
      hours: ms / (1000 * 60 * 60),
      days: ms / (1000 * 60 * 60 * 24),
    };
  }
}

module.exports = TimeUtils;
