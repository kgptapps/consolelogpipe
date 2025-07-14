/**
 * TableFormatter Tests
 */

const chalk = require('chalk');
// Mock chalk
jest.mock('chalk', () => ({
  cyan: Object.assign(
    jest.fn(text => `CYAN(${text})`),
    {
      bold: jest.fn(text => `CYAN_BOLD(${text})`),
    }
  ),
  gray: jest.fn(text => `GRAY(${text})`),
  green: jest.fn(text => `GREEN(${text})`),
  red: jest.fn(text => `RED(${text})`),
  yellow: jest.fn(text => `YELLOW(${text})`),
  blue: jest.fn(text => `BLUE(${text})`),
  white: Object.assign(
    jest.fn(text => `WHITE(${text})`),
    {
      bold: jest.fn(text => `WHITE_BOLD(${text})`),
    }
  ),
  bold: jest.fn(text => `BOLD(${text})`),
}));

const TableFormatter = require('../../src/utils/TableFormatter');

// Mock console.log to capture output
let mockConsoleLog;

describe('TableFormatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    if (mockConsoleLog) {
      mockConsoleLog.mockRestore();
    }
  });

  describe('display', () => {
    it('should display table with headers and rows', () => {
      const headers = ['Name', 'Age', 'City'];
      const rows = [
        ['John', '25', 'New York'],
        ['Jane', '30', 'Los Angeles'],
      ];

      TableFormatter.display(headers, rows);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should display title when provided', () => {
      const headers = ['Name'];
      const rows = [['John']];

      TableFormatter.display(headers, rows, { title: 'User List' });

      expect(mockConsoleLog).toHaveBeenCalledWith('CYAN_BOLD(User List)');
    });

    it('should handle empty rows', () => {
      const headers = ['Name', 'Age'];
      const rows = [];

      TableFormatter.display(headers, rows);

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY(No data to display)');
    });

    it('should handle color option', () => {
      const headers = ['Name'];
      const rows = [['John']];

      TableFormatter.display(headers, rows, { color: false, title: 'Test' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Test');
    });

    it('should respect maxWidth option', () => {
      const headers = ['Very Long Header Name That Exceeds Width'];
      const rows = [['Very long content that should be truncated']];

      TableFormatter.display(headers, rows, { maxWidth: 20 });

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('calculateColumnWidths', () => {
    it('should calculate appropriate column widths', () => {
      const headers = ['Name', 'Age'];
      const rows = [
        ['John Doe', '25'],
        ['Jane', '30'],
      ];

      const widths = TableFormatter.calculateColumnWidths(headers, rows, 80);

      expect(Array.isArray(widths)).toBe(true);
      expect(widths).toHaveLength(2);
      expect(widths[0]).toBeGreaterThan(0);
      expect(widths[1]).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const widths = TableFormatter.calculateColumnWidths([], [], 80);

      expect(widths).toEqual([]);
    });
  });

  describe('padText', () => {
    it('should pad text to specified width', () => {
      const result = TableFormatter.padText('Test', 10);

      expect(result).toHaveLength(10);
      expect(result).toContain('Test');
    });

    it('should handle content longer than width', () => {
      const result = TableFormatter.padText('Very long content', 5);

      expect(result).toBe('Very long content');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text content', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = TableFormatter.truncateText(longText, 20);

      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    it('should not truncate short content', () => {
      const shortText = 'Short';
      const result = TableFormatter.truncateText(shortText, 20);

      expect(result).toBe(shortText);
    });

    it('should handle very small widths', () => {
      const result = TableFormatter.truncateText('Test', 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('displayKeyValue', () => {
    it('should display key-value pairs', () => {
      const data = { name: 'John', age: 25, city: 'New York' };

      TableFormatter.displayKeyValue(data, { title: 'User Info' });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      TableFormatter.displayKeyValue({});

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('displayList', () => {
    it('should display list with bullets', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      TableFormatter.displayList(items, { title: 'My List' });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle empty list', () => {
      TableFormatter.displayList([]);

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('displayStats', () => {
    it('should display statistics in grid format', () => {
      const stats = {
        'Total Users': 100,
        'Active Users': 85,
        'New Users': 15,
      };

      TableFormatter.displayStats(stats, { title: 'User Statistics' });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle empty stats', () => {
      TableFormatter.displayStats({});

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});
