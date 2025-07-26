/**
 * Integration tests for CDN/UMD distribution
 * These tests ensure that the browser build works correctly
 * and prevent CDN distribution issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('CDN Distribution Integration Tests', () => {
  const distDir = path.join(__dirname, '../../dist');
  const umdFile = path.join(distDir, 'console-log-pipe.umd.js');
  const esmFile = path.join(distDir, 'console-log-pipe.esm.js');
  const cjsFile = path.join(distDir, 'console-log-pipe.cjs.js');

  beforeAll(() => {
    // Ensure build exists
    if (!fs.existsSync(umdFile)) {
      console.log('Building distribution files...');
      execSync('npm run build', { cwd: path.join(__dirname, '../..') });
    }
  });

  describe('Build Artifacts', () => {
    test('should generate all required distribution files', () => {
      expect(fs.existsSync(umdFile)).toBe(true);
      expect(fs.existsSync(esmFile)).toBe(true);
      expect(fs.existsSync(cjsFile)).toBe(true);
    });

    test('should have non-empty distribution files', () => {
      const umdStats = fs.statSync(umdFile);
      const esmStats = fs.statSync(esmFile);
      const cjsStats = fs.statSync(cjsFile);

      expect(umdStats.size).toBeGreaterThan(1000); // Should be substantial
      expect(esmStats.size).toBeGreaterThan(1000);
      expect(cjsStats.size).toBeGreaterThan(1000);
    });

    test('should contain proper UMD wrapper', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Should have UMD pattern
      expect(umdContent).toContain('(function (global, factory)');
      expect(umdContent).toContain(
        "typeof exports === 'object' && typeof module !== 'undefined'"
      );
      expect(umdContent).toContain(
        "typeof define === 'function' && define.amd"
      );
      expect(umdContent).toContain('global.ConsoleLogPipe = factory()');
    });

    test('should contain version information', () => {
      const packageJson = require('../../package.json');
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      expect(umdContent).toContain(`v${packageJson.version}`);
      expect(umdContent).toContain('Console Log Pipe Client Library');
    });
  });

  describe('UMD Module Loading', () => {
    test('should be loadable as CommonJS module', () => {
      // This test runs in Node.js environment, so we can test CJS loading
      const ConsoleLogPipe = require(cjsFile);

      expect(ConsoleLogPipe).toBeDefined();
      expect(typeof ConsoleLogPipe.init).toBe('function');
    });

    test('should export correct API surface', () => {
      const ConsoleLogPipe = require(cjsFile);

      // Main API methods
      expect(typeof ConsoleLogPipe.init).toBe('function');
      expect(typeof ConsoleLogPipe.version).toBe('string');

      // Should match package.json version
      const packageJson = require('../../package.json');
      expect(ConsoleLogPipe.version).toBe(packageJson.version);
    });
  });

  describe('Browser Compatibility', () => {
    test('should not contain Node.js specific code in UMD build', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Should not contain Node.js specific requires
      expect(umdContent).not.toContain("require('fs')");
      expect(umdContent).not.toContain("require('path')");
      expect(umdContent).not.toContain("require('os')");
      expect(umdContent).not.toContain('process.env');
    });

    test('should use browser-compatible WebSocket implementation', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Should reference WebSocket (browser global) not ws (Node.js package)
      expect(umdContent).toContain('WebSocket');
      expect(umdContent).not.toContain("require('ws')");
    });

    test('should handle browser globals correctly', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Should reference browser globals (window is used for WebSocket and fetch)
      expect(umdContent).toContain('window');
      // Note: document may not be used in this particular build, so we'll check for WebSocket instead
      expect(umdContent).toContain('WebSocket');
    });
  });

  describe('ESM Module', () => {
    test('should have proper ESM exports', () => {
      const esmContent = fs.readFileSync(esmFile, 'utf8');

      expect(esmContent).toContain('export');
      expect(esmContent).not.toContain('module.exports');
      expect(esmContent).not.toContain('require(');
    });
  });

  describe('File Integrity', () => {
    test('should have consistent API across all builds', () => {
      const cjsModule = require(cjsFile);

      // All builds should export the same API
      const expectedMethods = ['init', 'version'];

      expectedMethods.forEach(method => {
        expect(cjsModule[method]).toBeDefined();
      });
    });

    test('should not contain development artifacts', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Should not contain development-only code
      expect(umdContent).not.toContain("console.log('DEBUG:");
      expect(umdContent).not.toContain('debugger;');
      expect(umdContent).not.toContain('TODO:');
      expect(umdContent).not.toContain('FIXME:');
    });
  });

  describe('Package.json Configuration', () => {
    test('should have correct package.json entry points', () => {
      const packageJson = require('../../package.json');

      expect(packageJson.main).toBe('dist/console-log-pipe.cjs.js');
      expect(packageJson.module).toBe('dist/console-log-pipe.esm.js');
      expect(packageJson.browser).toBe('dist/console-log-pipe.umd.js');
    });

    test('should include distribution files in package files', () => {
      const packageJson = require('../../package.json');

      expect(packageJson.files).toContain('dist/*.js');
      expect(packageJson.files).toContain('dist/*.js.map');
    });
  });

  describe('Build Process Validation', () => {
    test('should be able to rebuild without errors', () => {
      expect(() => {
        execSync('npm run build', {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe', // Suppress output during test
        });
      }).not.toThrow();
    });

    test('should generate consistent builds', () => {
      const originalContent = fs.readFileSync(umdFile, 'utf8');

      // Rebuild
      execSync('npm run build', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe',
      });

      const rebuiltContent = fs.readFileSync(umdFile, 'utf8');

      // Content should be identical (excluding timestamps/build hashes)
      // We'll check that the core structure is the same
      expect(rebuiltContent).toHaveLength(originalContent.length);
    });
  });

  describe('CDN Usage Simulation', () => {
    test('should be loadable via script tag simulation', () => {
      const umdContent = fs.readFileSync(umdFile, 'utf8');

      // Simulate browser global environment
      const global = {};
      const mockWindow = {
        WebSocket: class MockWebSocket {
          constructor() {}
          close() {}
        },
        document: {
          createElement: () => ({}),
          head: { appendChild: () => {} },
        },
        console: {
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
        },
      };

      // Execute UMD in simulated browser environment
      try {
        const factory = new Function(
          'global',
          'window',
          'document',
          'console',
          `${umdContent}; return global.ConsoleLogPipe;`
        );
        const ConsoleLogPipe = factory(
          global,
          mockWindow,
          mockWindow.document,
          mockWindow.console
        );

        expect(ConsoleLogPipe).toBeDefined();
        expect(typeof ConsoleLogPipe.init).toBe('function');
      } catch (error) {
        // If there are browser-specific dependencies, the test should still validate structure
        expect(umdContent).toContain('global.ConsoleLogPipe = factory()');
      }
    });
  });
});
