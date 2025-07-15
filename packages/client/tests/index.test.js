/**
 * index.test.js - Tests for the main entry point
 */

const ConsoleLogPipeAPI = require('../src/index');

// Mock all dependencies to avoid actual initialization
jest.mock('../src/transport', () => ({
  HttpTransport: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    send: jest.fn(),
    flush: jest.fn().mockResolvedValue(),
    destroy: jest.fn(),
    getStats: jest.fn().mockReturnValue({ totalSent: 0 }),
  })),
}));

jest.mock('../src/core/log', () => ({
  LogCapture: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('../src/core/network', () => ({
  NetworkCapture: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('../src/core/ErrorCapture', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  }));
});

describe('Index Module', () => {
  describe('Exports', () => {
    it('should export main API object', () => {
      expect(ConsoleLogPipeAPI).toBeDefined();
      expect(typeof ConsoleLogPipeAPI).toBe('object');
    });

    it('should export init function', () => {
      expect(ConsoleLogPipeAPI.init).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.init).toBe('function');
    });

    it('should export create function', () => {
      expect(ConsoleLogPipeAPI.create).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.create).toBe('function');
    });

    it('should export ConsoleLogPipe class', () => {
      expect(ConsoleLogPipeAPI.ConsoleLogPipe).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.ConsoleLogPipe).toBe('function');
    });

    it('should export version', () => {
      expect(ConsoleLogPipeAPI.version).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.version).toBe('string');
      expect(ConsoleLogPipeAPI.version).toBe('1.1.23');
    });

    it('should export individual components', () => {
      expect(ConsoleLogPipeAPI.LogCapture).toBeDefined();
      expect(ConsoleLogPipeAPI.NetworkCapture).toBeDefined();
      expect(ConsoleLogPipeAPI.ErrorCapture).toBeDefined();
      expect(ConsoleLogPipeAPI.HttpTransport).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a ConsoleLogPipe instance', () => {
      const clp = ConsoleLogPipeAPI.create({ applicationName: 'test-app' });

      expect(clp).toBeInstanceOf(ConsoleLogPipeAPI.ConsoleLogPipe);
      expect(clp.config.applicationName).toBe('test-app');
    });

    it('should throw error when create called without applicationName', () => {
      expect(() => {
        ConsoleLogPipeAPI.create();
      }).toThrow('applicationName is required');
    });
  });

  describe('init', () => {
    let clp;

    beforeEach(() => {
      // Mock console.log to avoid noise in test output
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(async () => {
      if (clp) {
        await clp.destroy();
      }
      jest.restoreAllMocks();
    });

    it('should create, initialize and start a ConsoleLogPipe instance', async () => {
      clp = await ConsoleLogPipeAPI.init({ applicationName: 'init-test-app' });

      expect(clp).toBeInstanceOf(ConsoleLogPipeAPI.ConsoleLogPipe);
      expect(clp.config.applicationName).toBe('init-test-app');
      expect(clp.isInitialized).toBe(true);
      expect(clp.isCapturing).toBe(true);
    });

    it('should throw error when init called without applicationName', async () => {
      await expect(ConsoleLogPipeAPI.init()).rejects.toThrow(
        'applicationName is required'
      );
    });
  });
});
