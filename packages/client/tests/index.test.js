/**
 * index.test.js - Tests for the main entry point
 */

import LogCapture, {
  version,
  createLogCapture,
  autoStart,
} from '../src/index.js';

describe('Index Module', () => {
  describe('Exports', () => {
    it('should export LogCapture as default', () => {
      expect(LogCapture).toBeDefined();
      expect(typeof LogCapture).toBe('function');
    });

    it('should export version', () => {
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should export createLogCapture function', () => {
      expect(createLogCapture).toBeDefined();
      expect(typeof createLogCapture).toBe('function');
    });

    it('should export autoStart function', () => {
      expect(autoStart).toBeDefined();
      expect(typeof autoStart).toBe('function');
    });
  });

  describe('createLogCapture', () => {
    it('should create a LogCapture instance with default options', () => {
      const logCapture = createLogCapture({ applicationName: 'test-app' });

      expect(logCapture).toBeInstanceOf(LogCapture);
      expect(logCapture.options.applicationName).toBe('test-app');
    });

    it('should create a LogCapture instance with custom options', () => {
      const options = {
        applicationName: 'custom-app',
        levels: ['error', 'warn'],
        captureMetadata: false,
      };

      const logCapture = createLogCapture(options);

      expect(logCapture).toBeInstanceOf(LogCapture);
      expect(logCapture.options.applicationName).toBe('custom-app');
      expect(logCapture.options.levels).toEqual(['error', 'warn']);
      expect(logCapture.options.captureMetadata).toBe(false);
    });

    it('should create a LogCapture instance with empty options', () => {
      // This should throw because applicationName is required
      expect(() => {
        createLogCapture();
      }).toThrow('applicationName is required and must be a non-empty string');
    });
  });

  describe('autoStart', () => {
    let logCapture;

    afterEach(() => {
      if (logCapture) {
        logCapture.stop();
      }
    });

    it('should create and start a LogCapture instance', () => {
      logCapture = autoStart({ applicationName: 'auto-test-app' });

      expect(logCapture).toBeInstanceOf(LogCapture);
      expect(logCapture.options.applicationName).toBe('auto-test-app');
      expect(logCapture.isCapturing).toBe(true);
    });

    it('should create and start a LogCapture instance with custom options', () => {
      const options = {
        applicationName: 'auto-custom-app',
        levels: ['log', 'error'],
        captureMetadata: true,
      };

      logCapture = autoStart(options);

      expect(logCapture).toBeInstanceOf(LogCapture);
      expect(logCapture.options.applicationName).toBe('auto-custom-app');
      expect(logCapture.options.levels).toEqual(['log', 'error']);
      expect(logCapture.options.captureMetadata).toBe(true);
      expect(logCapture.isCapturing).toBe(true);
    });

    it('should throw error when autoStart called without applicationName', () => {
      expect(() => {
        autoStart();
      }).toThrow('applicationName is required and must be a non-empty string');
    });
  });
});
