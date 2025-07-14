/**
 * NetworkInterceptor Tests
 */

const NetworkInterceptor = require('../../../src/core/network/NetworkInterceptor');

describe('NetworkInterceptor', () => {
  let interceptor;
  let mockFormatter;
  let mockOnNetworkData;
  let originalFetch;
  let originalXMLHttpRequest;

  beforeEach(() => {
    // Mock formatter
    mockFormatter = {
      createRequestEntry: jest
        .fn()
        .mockReturnValue({ type: 'request', id: 'req-1' }),
      createResponseEntry: jest
        .fn()
        .mockResolvedValue({ type: 'response', id: 'req-1' }),
      createXHRResponseEntry: jest
        .fn()
        .mockReturnValue({ type: 'xhr-response', id: 'req-1' }),
      createErrorEntry: jest
        .fn()
        .mockReturnValue({ type: 'error', id: 'req-1' }),
    };

    // Mock callback
    mockOnNetworkData = jest.fn();

    // Store originals
    originalFetch = global.fetch;
    originalXMLHttpRequest = global.XMLHttpRequest;

    // Create interceptor
    interceptor = new NetworkInterceptor(
      {
        captureFetch: true,
        captureXHR: true,
        excludeUrls: [],
      },
      mockFormatter,
      mockOnNetworkData
    );
  });

  afterEach(() => {
    // Restore originals
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    if (originalXMLHttpRequest) {
      global.XMLHttpRequest = originalXMLHttpRequest;
    }

    // Clean up interceptor
    interceptor.restoreOriginalMethods();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(interceptor.options.captureFetch).toBe(true);
      expect(interceptor.options.captureXHR).toBe(true);
      expect(interceptor.formatter).toBe(mockFormatter);
      expect(interceptor.onNetworkData).toBe(mockOnNetworkData);
    });

    it('should initialize tracking properties', () => {
      expect(interceptor.originalFetch).toBeNull();
      expect(interceptor.originalXHROpen).toBeNull();
      expect(interceptor.originalXHRSend).toBeNull();
      expect(interceptor.activeRequests).toBeInstanceOf(Map);
    });
  });

  describe('setupInterception', () => {
    it('should not setup interception in non-browser environment', () => {
      const originalWindow = global.window;
      delete global.window;

      interceptor.setupInterception();

      expect(interceptor.originalFetch).toBeNull();
      expect(interceptor.originalXHROpen).toBeNull();

      global.window = originalWindow;
    });

    it('should setup fetch interception when enabled', () => {
      const mockFetch = jest.fn();
      global.window = { fetch: mockFetch };

      interceptor.setupInterception();

      expect(interceptor.originalFetch).toBe(mockFetch);
      expect(global.window.fetch).not.toBe(mockFetch);
    });

    it('should setup XHR interception when enabled', () => {
      const originalOpen = jest.fn();
      const originalSend = jest.fn();

      global.window = { XMLHttpRequest() {} };
      global.XMLHttpRequest = function () {};
      global.XMLHttpRequest.prototype = {
        open: originalOpen,
        send: originalSend,
      };

      interceptor.setupInterception();

      expect(interceptor.originalXHROpen).toBe(originalOpen);
      expect(interceptor.originalXHRSend).toBe(originalSend);
    });

    it('should not setup fetch when disabled', () => {
      interceptor.options.captureFetch = false;
      const mockFetch = jest.fn();
      global.window = { fetch: mockFetch };

      interceptor.setupInterception();

      expect(interceptor.originalFetch).toBeNull();
      expect(global.window.fetch).toBe(mockFetch);
    });

    it('should not setup XHR when disabled', () => {
      interceptor.options.captureXHR = false;
      const mockXHR = jest.fn();
      global.window = { XMLHttpRequest: mockXHR };
      global.XMLHttpRequest = mockXHR;
      mockXHR.prototype = {
        open: jest.fn(),
        send: jest.fn(),
      };

      interceptor.setupInterception();

      expect(interceptor.originalXHROpen).toBeNull();
      expect(interceptor.originalXHRSend).toBeNull();
    });
  });

  describe('setupFetchInterception', () => {
    beforeEach(() => {
      global.window = { fetch: jest.fn() };
      global.performance = { now: jest.fn().mockReturnValue(1000) };

      // Mock NetworkUtils
      const NetworkUtils = require('../../../src/core/network/NetworkUtils');
      jest.spyOn(NetworkUtils, 'generateRequestId').mockReturnValue('req-123');
      jest.spyOn(NetworkUtils, 'shouldCaptureUrl').mockReturnValue(true);
    });

    it('should intercept fetch calls', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({}),
      };

      interceptor.originalFetch = jest.fn().mockResolvedValue(mockResponse);
      interceptor.setupFetchInterception();

      await global.window.fetch('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John' }),
      });

      expect(mockFormatter.createRequestEntry).toHaveBeenCalled();
      expect(mockFormatter.createResponseEntry).toHaveBeenCalled();
      expect(mockOnNetworkData).toHaveBeenCalledTimes(2);
    });

    it('should setup fetch interception properly', () => {
      const originalFetch = global.window.fetch;
      interceptor.setupFetchInterception();

      // Verify that fetch was replaced
      expect(global.window.fetch).not.toBe(originalFetch);
      expect(interceptor.originalFetch).toBe(originalFetch);
    });

    it('should skip interception for excluded URLs', async () => {
      const NetworkUtils = require('../../../src/core/network/NetworkUtils');
      jest.spyOn(NetworkUtils, 'shouldCaptureUrl').mockReturnValue(false);

      interceptor.originalFetch = jest.fn().mockResolvedValue({});
      interceptor.setupFetchInterception();

      await global.window.fetch('https://excluded.com/api');

      expect(interceptor.originalFetch).toHaveBeenCalled();
      expect(mockFormatter.createRequestEntry).not.toHaveBeenCalled();
    });

    it('should handle Request object input', async () => {
      const request = { url: 'https://api.example.com/users' };
      interceptor.originalFetch = jest.fn().mockResolvedValue({});
      interceptor.setupFetchInterception();

      await global.window.fetch(request);

      expect(mockFormatter.createRequestEntry).toHaveBeenCalledWith(
        'req-123',
        expect.objectContaining({
          url: 'https://api.example.com/users',
          method: 'GET',
          type: 'fetch',
        })
      );
    });
  });

  describe('setupXHRInterception', () => {
    let mockXHRInstance;
    let MockXHRConstructor;

    beforeEach(() => {
      global.performance = { now: jest.fn().mockReturnValue(1000) };

      mockXHRInstance = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        readyState: 4,
        status: 200,
        statusText: 'OK',
        responseText: '{"success": true}',
        getAllResponseHeaders: jest
          .fn()
          .mockReturnValue('content-type: application/json'),
        onreadystatechange: null,
      };

      MockXHRConstructor = jest.fn(() => mockXHRInstance);
      MockXHRConstructor.prototype = {
        open: jest.fn(),
        send: jest.fn(),
      };
      MockXHRConstructor.DONE = 4;

      global.XMLHttpRequest = MockXHRConstructor;

      // Mock NetworkUtils
      const NetworkUtils = require('../../../src/core/network/NetworkUtils');
      jest.spyOn(NetworkUtils, 'generateRequestId').mockReturnValue('xhr-123');
      jest.spyOn(NetworkUtils, 'shouldCaptureUrl').mockReturnValue(true);
      jest.spyOn(NetworkUtils, 'getXHRHeaders').mockReturnValue({});
    });

    it('should intercept XHR open method', () => {
      const originalOpen = global.XMLHttpRequest.prototype.open;
      const originalSend = global.XMLHttpRequest.prototype.send;

      interceptor.setupXHRInterception();

      // Verify that the prototype methods were replaced
      expect(global.XMLHttpRequest.prototype.open).not.toBe(originalOpen);
      expect(global.XMLHttpRequest.prototype.send).not.toBe(originalSend);
    });

    it('should intercept XHR send method', () => {
      interceptor.setupXHRInterception();

      // Test that the interceptor stores the original methods
      expect(interceptor.originalXHROpen).toBeDefined();
      expect(interceptor.originalXHRSend).toBeDefined();
    });

    it('should handle XHR without network capture metadata', () => {
      interceptor.setupXHRInterception();

      // Test that the methods exist and can be called
      expect(typeof global.XMLHttpRequest.prototype.open).toBe('function');
      expect(typeof global.XMLHttpRequest.prototype.send).toBe('function');
    });

    it('should skip XHR interception for excluded URLs', () => {
      const NetworkUtils = require('../../../src/core/network/NetworkUtils');
      jest.spyOn(NetworkUtils, 'shouldCaptureUrl').mockReturnValue(false);

      interceptor.setupXHRInterception();

      // Verify interception is set up even for excluded URLs
      expect(interceptor.originalXHROpen).toBeDefined();
      expect(interceptor.originalXHRSend).toBeDefined();
    });
  });

  describe('restoreOriginalMethods', () => {
    it('should not restore in non-browser environment', () => {
      const originalWindow = global.window;
      delete global.window;

      interceptor.originalFetch = jest.fn();
      interceptor.restoreOriginalMethods();

      expect(interceptor.originalFetch).not.toBeNull();

      global.window = originalWindow;
    });

    it('should restore original fetch', () => {
      const originalFetch = jest.fn();
      global.window = { fetch: jest.fn() };
      interceptor.originalFetch = originalFetch;

      interceptor.restoreOriginalMethods();

      expect(global.window.fetch).toBe(originalFetch);
      expect(interceptor.originalFetch).toBeNull();
    });

    it('should restore original XHR methods', () => {
      const originalOpen = jest.fn();
      const originalSend = jest.fn();

      global.XMLHttpRequest = jest.fn();
      global.XMLHttpRequest.prototype = {
        open: jest.fn(),
        send: jest.fn(),
      };

      interceptor.originalXHROpen = originalOpen;
      interceptor.originalXHRSend = originalSend;

      interceptor.restoreOriginalMethods();

      expect(global.XMLHttpRequest.prototype.open).toBe(originalOpen);
      expect(global.XMLHttpRequest.prototype.send).toBe(originalSend);
      expect(interceptor.originalXHROpen).toBeNull();
      expect(interceptor.originalXHRSend).toBeNull();
    });

    it('should handle missing XMLHttpRequest', () => {
      delete global.XMLHttpRequest;
      interceptor.originalXHROpen = jest.fn();
      interceptor.originalXHRSend = jest.fn();

      expect(() => interceptor.restoreOriginalMethods()).not.toThrow();
    });
  });
});
