/**
 * TableFormatter - Formats data as tables for CLI display
 */

const chalk = require('chalk');

class TableFormatter {
  /**
   * Display data as a formatted table
   */
  static display(headers, rows, options = {}) {
    const {
      title,
      color = true,
      maxWidth = process.stdout.columns || 120,
    } = options;

    if (title) {
      console.log();
      console.log(color ? chalk.cyan.bold(title) : title);
      console.log();
    }

    if (rows.length === 0) {
      console.log(
        color ? chalk.gray('No data to display') : 'No data to display'
      );
      return;
    }

    // Calculate column widths
    const columnWidths = this.calculateColumnWidths(headers, rows, maxWidth);

    // Display table
    this.displayHeader(headers, columnWidths, color);
    this.displaySeparator(columnWidths, color);

    rows.forEach(row => {
      this.displayRow(row, columnWidths, color);
    });

    console.log();
  }

  /**
   * Calculate optimal column widths
   */
  static calculateColumnWidths(headers, rows, maxWidth) {
    const columnCount = headers.length;
    const minWidth = 8;
    const padding = 3; // Space between columns
    const availableWidth = maxWidth - padding * (columnCount - 1);

    // Calculate content widths
    const contentWidths = headers.map((header, index) => {
      const headerWidth = header.length;
      const maxRowWidth = Math.max(
        ...rows.map(row => String(row[index] || '').length)
      );
      return Math.max(headerWidth, maxRowWidth, minWidth);
    });

    // If total width fits, use content widths
    const totalContentWidth = contentWidths.reduce(
      (sum, width) => sum + width,
      0
    );
    if (totalContentWidth <= availableWidth) {
      return contentWidths;
    }

    // Otherwise, distribute available width proportionally
    const totalRatio = contentWidths.reduce((sum, width) => sum + width, 0);
    return contentWidths.map(width =>
      Math.max(minWidth, Math.floor((width / totalRatio) * availableWidth))
    );
  }

  /**
   * Display table header
   */
  static displayHeader(headers, columnWidths, color) {
    const headerRow = headers
      .map((header, index) => this.padText(header, columnWidths[index]))
      .join('   ');

    console.log(color ? chalk.bold(headerRow) : headerRow);
  }

  /**
   * Display separator line
   */
  static displaySeparator(columnWidths, color) {
    const separator = columnWidths.map(width => '─'.repeat(width)).join('   ');

    console.log(color ? chalk.gray(separator) : separator);
  }

  /**
   * Display table row
   */
  static displayRow(row, columnWidths, _color) {
    const formattedRow = row
      .map((cell, index) => {
        const cellText = String(cell || '');
        const truncated = this.truncateText(cellText, columnWidths[index]);
        return this.padText(truncated, columnWidths[index]);
      })
      .join('   ');

    console.log(formattedRow);
  }

  /**
   * Pad text to specified width
   */
  static padText(text, width) {
    if (text.length >= width) {
      return text;
    }
    return text + ' '.repeat(width - text.length);
  }

  /**
   * Truncate text to fit in column
   */
  static truncateText(text, maxWidth) {
    if (text.length <= maxWidth) {
      return text;
    }

    if (maxWidth <= 3) {
      return '...'.substring(0, maxWidth);
    }

    return `${text.substring(0, maxWidth - 3)}...`;
  }

  /**
   * Create a simple key-value table
   */
  static displayKeyValue(data, options = {}) {
    const { title, color = true } = options;

    if (title) {
      console.log();
      console.log(color ? chalk.cyan.bold(title) : title);
      console.log();
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
      console.log(
        color ? chalk.gray('No data to display') : 'No data to display'
      );
      return;
    }

    const maxKeyWidth = Math.max(...entries.map(([key]) => key.length));

    entries.forEach(([key, value]) => {
      const paddedKey = this.padText(key, maxKeyWidth);
      const keyFormatted = color ? chalk.cyan(paddedKey) : paddedKey;
      const valueFormatted = String(value || '');
      console.log(`${keyFormatted}  ${valueFormatted}`);
    });

    console.log();
  }

  /**
   * Display a list with bullets
   */
  static displayList(items, options = {}) {
    const { title, color = true, bullet = '•' } = options;

    if (title) {
      console.log();
      console.log(color ? chalk.cyan.bold(title) : title);
      console.log();
    }

    if (items.length === 0) {
      console.log(
        color ? chalk.gray('No items to display') : 'No items to display'
      );
      return;
    }

    items.forEach(item => {
      const bulletFormatted = color ? chalk.gray(bullet) : bullet;
      console.log(`  ${bulletFormatted} ${item}`);
    });

    console.log();
  }

  /**
   * Display a tree structure
   */
  static displayTree(tree, options = {}) {
    const { title, color = true, indent = 0 } = options;

    if (title && indent === 0) {
      console.log();
      console.log(color ? chalk.cyan.bold(title) : title);
      console.log();
    }

    const prefix = '  '.repeat(indent);

    if (typeof tree === 'string') {
      console.log(`${prefix}${tree}`);
      return;
    }

    Object.entries(tree).forEach(([key, value]) => {
      const keyFormatted = color ? chalk.white.bold(key) : key;
      console.log(`${prefix}${keyFormatted}`);

      if (typeof value === 'object' && value !== null) {
        this.displayTree(value, {
          ...options,
          title: null,
          indent: indent + 1,
        });
      } else {
        const valuePrefix = '  '.repeat(indent + 1);
        console.log(`${valuePrefix}${value}`);
      }
    });

    if (indent === 0) {
      console.log();
    }
  }

  /**
   * Display statistics in a grid format
   */
  static displayStats(stats, options = {}) {
    const { title, color = true, columns = 3 } = options;

    if (title) {
      console.log();
      console.log(color ? chalk.cyan.bold(title) : title);
      console.log();
    }

    const entries = Object.entries(stats);
    if (entries.length === 0) {
      console.log(
        color
          ? chalk.gray('No statistics to display')
          : 'No statistics to display'
      );
      return;
    }

    // Group entries into rows
    const rows = [];
    for (let i = 0; i < entries.length; i += columns) {
      rows.push(entries.slice(i, i + columns));
    }

    // Calculate column width
    const maxWidth = Math.floor((process.stdout.columns || 120) / columns) - 4;

    rows.forEach(row => {
      const formattedCells = row.map(([key, value]) => {
        const keyFormatted = color ? chalk.cyan(key) : key;
        const valueFormatted = color
          ? chalk.white.bold(String(value))
          : String(value);
        const cell = `${keyFormatted}: ${valueFormatted}`;
        return this.padText(cell, maxWidth);
      });

      console.log(formattedCells.join('    '));
    });

    console.log();
  }
}

module.exports = TableFormatter;
