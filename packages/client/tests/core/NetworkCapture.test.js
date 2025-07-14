/**
 * NetworkCapture.test.js - Comprehensive tests for NetworkCapture
 */

const NetworkCapture = require('../../src/core/NetworkCapture');

// Mock browser environment
global.window = {
  fetch: jest.fn(),
  XMLHttpRequest: jest.fn(),
  location: { href: 'http://localhost:3000/test' },
  navigator: { userAgent: 'Mozilla/5.0 (Test Browser)' },
};

global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  getAllRequestHeaders: jest.fn(() => ''),
  getAllResponseHeaders: jest.fn(() => ''),
  getResponseHeader: jest.fn(() => ''),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 0,
  status: 200,
  statusText: 'OK',
  responseText: '{"success": true}',
  response: '{"success": true}',
  responseType: 'json',
  onreadystatechange: null,
}));

// Add XMLHttpRequest constants
global.XMLHttpRequest.DONE = 4;

global.performance = {
  now: jest.fn(() => 123.456),
  timeOrigin: 1234567890000,
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

global.Headers = jest.fn(() => ({
  entries: jest.fn(() => [['content-type', 'application/json']]),
  get: jest.fn(key => (key === 'content-type' ? 'application/json' : null)),
  set: jest.fn(),
}));

describe('NetworkCapture', () => {
  let networkCapture;
  let mockListener;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset window mocks
    global.window.fetch = jest.fn();
    global.XMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      getAllRequestHeaders: jest.fn(() => ''),
      getAllResponseHeaders: jest.fn(() => ''),
      getResponseHeader: jest.fn(() => ''),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: 0,
      status: 200,
      statusText: 'OK',
      responseText: '{"success": true}',
      response: '{"success": true}',
      responseType: 'json',
      onreadystatechange: null,
    }));

    // Reset performance mock
    global.performance.now = jest.fn(() => 123.456);

    // Create fresh instance
    networkCapture = new NetworkCapture({
      applicationName: 'test-app',
      sessionId: 'test-session-123',
      environment: 'test',
      developer: 'test-dev',
      branch: 'test-branch',
    });

    mockListener = jest.fn();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default options', () => {
      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
      });

      expect(capture.options.captureFetch).toBe(true);
      expect(capture.options.captureXHR).toBe(true);
      expect(capture.options.captureHeaders).toBe(true);
      expect(capture.options.applicationName).toBe('test-app');
      expect(capture.options.sessionId).toBe('test-session');
    });

    test('should override default options', () => {
      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
        captureFetch: false,
        captureHeaders: false,
        maxBodySize: 1024,
      });

      expect(capture.options.captureFetch).toBe(false);
      expect(capture.options.captureHeaders).toBe(false);
      expect(capture.options.maxBodySize).toBe(1024);
    });

    test('should initialize empty listeners and network queue', () => {
      expect(networkCapture.listeners.size).toBe(0);
      expect(networkCapture.networkQueue).toEqual([]);
      expect(networkCapture.isCapturing).toBe(false);
    });
  });

  describe('Network Capture Control', () => {
    test('should start capturing and setup network interception', () => {
      const originalFetch = global.window.fetch;

      networkCapture.start();

      expect(networkCapture.isCapturing).toBe(true);
      expect(global.window.fetch).not.toBe(originalFetch);
    });

    test('should not setup handlers if already capturing', () => {
      const originalFetch = global.window.fetch;

      networkCapture.start();
      const interceptedFetch = global.window.fetch;

      networkCapture.start(); // Second call

      expect(global.window.fetch).toBe(interceptedFetch);
    });

    test('should stop capturing and restore original methods', () => {
      const originalFetch = global.window.fetch;

      networkCapture.start();
      networkCapture.stop();

      expect(networkCapture.isCapturing).toBe(false);
      expect(global.window.fetch).toBe(originalFetch);
    });

    test('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      global.window = undefined;

      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
      });

      expect(() => capture.start()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Fetch API Interception', () => {
    test('should intercept fetch requests and capture data', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        url: 'https://api.example.com/data',
        type: 'cors',
        redirected: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: jest.fn(() => ({
          text: jest.fn(() => Promise.resolve('{"data": "test"}')),
        })),
      };

      global.window.fetch = jest.fn(() => Promise.resolve(mockResponse));
      networkCapture.addListener(mockListener);
      networkCapture.start();

      await global.window.fetch('https://api.example.com/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      expect(mockListener).toHaveBeenCalledTimes(2); // Request and response

      const requestCall = mockListener.mock.calls[0][0];
      expect(requestCall.type).toBe('network');
      expect(requestCall.subtype).toBe('request');
      expect(requestCall.request.url).toBe('https://api.example.com/data');
      expect(requestCall.request.method).toBe('POST');

      const responseCall = mockListener.mock.calls[1][0];
      expect(responseCall.type).toBe('network');
      expect(responseCall.subtype).toBe('response');
      expect(responseCall.response.status).toBe(200);
    });

    test('should handle fetch errors', async () => {
      const fetchError = new Error('Network error');
      global.window.fetch = jest.fn(() => Promise.reject(fetchError));

      networkCapture.addListener(mockListener);
      networkCapture.start();

      try {
        await global.window.fetch('https://api.example.com/error');
      } catch (error) {
        // Expected to throw
      }

      expect(mockListener).toHaveBeenCalledTimes(2); // Request and error

      const errorCall = mockListener.mock.calls[1][0];
      expect(errorCall.type).toBe('network');
      expect(errorCall.subtype).toBe('error');
      expect(errorCall.error.message).toBe('Network error');
    });

    test('should exclude URLs based on patterns', async () => {
      networkCapture.options.excludeUrls = [/localhost:\d+\/api\/logs/];
      networkCapture.addListener(mockListener);
      networkCapture.start();

      global.window.fetch = jest.fn(() =>
        Promise.resolve({
          status: 200,
          headers: new Headers(),
          clone: () => ({ text: () => Promise.resolve('') }),
        })
      );

      await global.window.fetch('http://localhost:3001/api/logs');

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('XMLHttpRequest Interception', () => {
    test('should setup XHR interception methods', () => {
      // Set up mock methods first
      const originalOpen = jest.fn();
      const originalSend = jest.fn();
      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;

      networkCapture.start();

      // Verify that the methods have been replaced
      expect(XMLHttpRequest.prototype.open).not.toBe(originalOpen);
      expect(XMLHttpRequest.prototype.send).not.toBe(originalSend);

      // Verify original methods are stored
      expect(networkCapture.originalXHROpen).toBe(originalOpen);
      expect(networkCapture.originalXHRSend).toBe(originalSend);

      networkCapture.stop();

      // Verify methods are restored
      expect(XMLHttpRequest.prototype.open).toBe(originalOpen);
      expect(XMLHttpRequest.prototype.send).toBe(originalSend);
    });

    test('should preserve original onreadystatechange handler', () => {
      const originalHandler = jest.fn();
      networkCapture.start();

      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = originalHandler;
      xhr.open('GET', 'https://api.example.com/data');
      xhr.send();

      // Simulate ready state change
      xhr.readyState = XMLHttpRequest.DONE;
      xhr.onreadystatechange();

      expect(originalHandler).toHaveBeenCalled();
    });
  });

  describe('Header Sanitization', () => {
    test('should sanitize sensitive headers', () => {
      const headers = {
        Authorization: 'Bearer secret-token',
        'Content-Type': 'application/json',
        'X-API-Key': 'secret-key',
      };

      const sanitized = networkCapture._sanitizeHeaders(headers);

      expect(sanitized['Authorization']).toBe('[REDACTED]');
      expect(sanitized['Content-Type']).toBe('application/json');
      expect(sanitized['X-API-Key']).toBe('[REDACTED]');
    });

    test('should handle Headers object', () => {
      // Test with plain object (which is what _headersToObject returns)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      };

      const sanitized = networkCapture._sanitizeHeaders(headers);

      expect(sanitized['Content-Type']).toBe('application/json');
      expect(sanitized['Authorization']).toBe('[REDACTED]');
    });

    test('should truncate large headers', () => {
      networkCapture.options.maxHeaderSize = 10;
      const headers = {
        'Long-Header':
          'This is a very long header value that should be truncated',
      };

      const sanitized = networkCapture._sanitizeHeaders(headers);

      expect(sanitized['Long-Header']).toContain('[TRUNCATED]');
      expect(sanitized['Long-Header'].length).toBeLessThan(50);
    });
  });

  describe('Body Sanitization', () => {
    test('should handle string bodies', () => {
      const body = '{"test": "data"}';
      const sanitized = networkCapture._sanitizeBody(body);
      expect(sanitized).toBe('{"test": "data"}');
    });

    test('should handle FormData', () => {
      const formData = new FormData();
      const sanitized = networkCapture._sanitizeBody(formData);
      expect(sanitized).toBe('[FormData]');
    });

    test('should handle ArrayBuffer', () => {
      const buffer = new ArrayBuffer(8);
      const sanitized = networkCapture._sanitizeBody(buffer);
      expect(sanitized).toBe('[ArrayBuffer: 8 bytes]');
    });

    test('should truncate large bodies', () => {
      networkCapture.options.maxBodySize = 10;
      const largeBody = 'This is a very large body that should be truncated';

      const sanitized = networkCapture._sanitizeBody(largeBody);

      expect(sanitized).toContain('[TRUNCATED]');
      expect(sanitized.length).toBeLessThan(50);
    });

    test('should handle null/undefined bodies', () => {
      expect(networkCapture._sanitizeBody(null)).toBeNull();
      expect(networkCapture._sanitizeBody(undefined)).toBeNull();
    });
  });

  describe('URL Filtering', () => {
    test('should exclude URLs matching exclude patterns', () => {
      networkCapture.options.excludeUrls = [
        /localhost:\d+\/api\/logs/,
        'webpack-dev-server',
      ];

      expect(
        networkCapture._shouldCaptureUrl('http://localhost:3001/api/logs')
      ).toBe(false);
      expect(
        networkCapture._shouldCaptureUrl(
          'http://localhost:8080/webpack-dev-server'
        )
      ).toBe(false);
      expect(
        networkCapture._shouldCaptureUrl('https://api.example.com/data')
      ).toBe(true);
    });

    test('should include only URLs matching include patterns when specified', () => {
      networkCapture.options.includeUrls = [
        /api\.example\.com/,
        'important-service',
      ];

      expect(
        networkCapture._shouldCaptureUrl('https://api.example.com/data')
      ).toBe(true);
      expect(
        networkCapture._shouldCaptureUrl('https://important-service.com/api')
      ).toBe(true);
      expect(
        networkCapture._shouldCaptureUrl('https://other-service.com/api')
      ).toBe(false);
    });

    test('should capture all URLs when no patterns specified', () => {
      networkCapture.options.excludeUrls = [];
      networkCapture.options.includeUrls = [];

      expect(networkCapture._shouldCaptureUrl('https://any-url.com')).toBe(
        true
      );
    });
  });

  describe('Request Categorization', () => {
    test('should categorize API requests', () => {
      const requestData = {
        url: 'https://api.example.com/users',
        method: 'GET',
      };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('API Request');
    });

    test('should categorize GraphQL requests', () => {
      const requestData = {
        url: 'https://example.com/graphql',
        method: 'POST',
      };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('GraphQL Request');
    });

    test('should categorize static assets', () => {
      const requestData = { url: 'https://example.com/app.js', method: 'GET' };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('Static Asset');
    });

    test('should categorize authentication requests', () => {
      const requestData = {
        url: 'https://example.com/auth/login',
        method: 'POST',
      };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('Authentication');
    });

    test('should categorize data mutations', () => {
      const requestData = { url: 'https://example.com/users', method: 'POST' };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('Data Mutation');
    });

    test('should categorize data deletions', () => {
      const requestData = {
        url: 'https://example.com/users/123',
        method: 'DELETE',
      };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('Data Deletion');
    });
  });

  describe('Response Categorization', () => {
    test('should categorize server errors', () => {
      const response = { status: 500, url: 'https://api.example.com/data' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('Server Error');
    });

    test('should categorize client errors', () => {
      const response = { status: 404, url: 'https://api.example.com/data' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('Client Error');
    });

    test('should categorize redirects', () => {
      const response = { status: 302, url: 'https://api.example.com/data' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('Redirect');
    });

    test('should categorize API success', () => {
      const response = { status: 200, url: 'https://api.example.com/data' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('API Success');
    });

    test('should categorize asset success', () => {
      const response = { status: 200, url: 'https://example.com/app.js' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('Asset Success');
    });
  });

  describe('Error Categorization', () => {
    test('should categorize CORS errors', () => {
      const error = new Error('CORS policy violation');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('CORS Error');
    });

    test('should categorize timeout errors', () => {
      const error = new Error('Request timeout');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('Timeout Error');
    });

    test('should categorize network errors', () => {
      const error = new Error('Network request failed');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('Network Error');
    });

    test('should categorize aborted requests', () => {
      const error = new Error('Request aborted');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('Request Aborted');
    });
  });

  describe('Severity Calculation', () => {
    test('should assign critical severity to server errors', () => {
      const response = { status: 500 };
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateResponseSeverity(
        response,
        timing
      );

      expect(severity.level).toBe('critical');
      expect(severity.score).toBe(9);
      expect(severity.factors).toContain('server-error');
    });

    test('should assign high severity to client errors', () => {
      const response = { status: 404 };
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateResponseSeverity(
        response,
        timing
      );

      expect(severity.level).toBe('medium');
      expect(severity.score).toBe(6);
      expect(severity.factors).toContain('client-error');
    });

    test('should increase severity for slow responses', () => {
      const response = { status: 200 };
      const timing = { duration: 6000 }; // 6 seconds
      const severity = networkCapture._calculateResponseSeverity(
        response,
        timing
      );

      expect(severity.level).toBe('high');
      expect(severity.factors).toContain('slow-response');
    });

    test('should assign high severity to network errors', () => {
      const error = new Error('Network failure');
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateErrorSeverity(error, timing);

      expect(severity.level).toBe('high');
      expect(severity.score).toBe(8);
      expect(severity.factors).toContain('network-failure');
    });
  });

  describe('AI-Friendly Tags Generation', () => {
    test('should generate basic request tags', () => {
      const requestData = {
        url: 'https://api.example.com/users',
        method: 'POST',
      };
      const tags = networkCapture._generateRequestTags(requestData);

      expect(tags).toContain('network');
      expect(tags).toContain('request');
      expect(tags).toContain('method-post');
      expect(tags).toContain('api');
    });

    test('should detect technology tags', () => {
      const requestData = { url: 'https://react-app.com/api', method: 'GET' };
      const tags = networkCapture._generateRequestTags(requestData);

      expect(tags).toContain('react');
    });

    test('should include environment and branch tags', () => {
      const requestData = { url: 'https://example.com/api', method: 'GET' };
      const tags = networkCapture._generateRequestTags(requestData);

      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });

    test('should generate response tags with status codes', () => {
      const response = {
        status: 404,
        url: 'https://api.example.com/data',
        headers: { get: () => 'application/json' },
      };
      const timing = { duration: 500 };
      const tags = networkCapture._generateResponseTags(response, timing);

      expect(tags).toContain('network');
      expect(tags).toContain('response');
      expect(tags).toContain('status-4xx');
      expect(tags).toContain('error');
      expect(tags).toContain('client-error');
      expect(tags).toContain('json');
    });

    test('should generate performance tags', () => {
      const response = {
        status: 200,
        url: 'https://example.com/data',
        headers: { get: () => null },
      };
      const timing = { duration: 50 }; // Fast response
      const tags = networkCapture._generateResponseTags(response, timing);

      expect(tags).toContain('fast');
    });

    test('should remove duplicate tags', () => {
      const requestData = { url: 'https://api.example.com/api', method: 'GET' };
      const tags = networkCapture._generateRequestTags(requestData);

      // Should not have duplicate 'api' tags
      const apiTags = tags.filter(tag => tag === 'api');
      expect(apiTags).toHaveLength(1);
    });
  });

  describe('Performance Metrics', () => {
    test('should collect performance metrics when available', () => {
      const metrics = networkCapture._collectPerformanceMetrics();

      expect(metrics).toMatchObject({
        timing: {
          now: expect.any(Number),
          timeOrigin: expect.any(Number),
        },
      });

      if (metrics.memory) {
        expect(metrics.memory).toMatchObject({
          used: expect.any(Number),
          total: expect.any(Number),
          limit: expect.any(Number),
        });
      }
    });

    test('should handle missing performance API', () => {
      const originalPerformance = global.performance;
      delete global.performance;

      const metrics = networkCapture._collectPerformanceMetrics();

      expect(metrics).toBeNull();

      global.performance = originalPerformance;
    });
  });

  describe('Listener Management', () => {
    test('should add and remove listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      networkCapture.addListener(listener1);
      networkCapture.addListener(listener2);

      expect(networkCapture.listeners.size).toBe(2);

      networkCapture.removeListener(listener1);

      expect(networkCapture.listeners.size).toBe(1);
      expect(networkCapture.listeners.has(listener2)).toBe(true);
    });

    test('should ignore non-function listeners', () => {
      networkCapture.addListener('not a function');
      networkCapture.addListener(null);
      networkCapture.addListener(undefined);

      expect(networkCapture.listeners.size).toBe(0);
    });

    test('should notify all listeners of network data', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      networkCapture.addListener(listener1);
      networkCapture.addListener(listener2);

      const testData = { type: 'network', test: 'data' };
      networkCapture._notifyListeners(testData);

      expect(listener1).toHaveBeenCalledWith(testData);
      expect(listener2).toHaveBeenCalledWith(testData);
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      networkCapture.addListener(errorListener);
      networkCapture.addListener(goodListener);

      const testData = { type: 'network', test: 'data' };

      expect(() => networkCapture._notifyListeners(testData)).not.toThrow();
      expect(goodListener).toHaveBeenCalledWith(testData);
    });
  });

  describe('Network Queue Management', () => {
    test('should maintain network queue', () => {
      const data1 = { type: 'network', id: '1' };
      const data2 = { type: 'network', id: '2' };

      networkCapture._notifyListeners(data1);
      networkCapture._notifyListeners(data2);

      const queue = networkCapture.getNetworkData();
      expect(queue).toHaveLength(2);
      expect(queue[0]).toEqual(data1);
      expect(queue[1]).toEqual(data2);
    });

    test('should clear network queue', () => {
      networkCapture._notifyListeners({ type: 'network', id: '1' });
      networkCapture._notifyListeners({ type: 'network', id: '2' });

      expect(networkCapture.getNetworkData()).toHaveLength(2);

      networkCapture.clearNetworkData();

      expect(networkCapture.getNetworkData()).toHaveLength(0);
    });
  });

  describe('Request ID Generation', () => {
    test('should generate unique request IDs', () => {
      const id1 = networkCapture._generateRequestId();
      const id2 = networkCapture._generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Response Body Capture', () => {
    test('should capture text response bodies', () => {
      expect(
        networkCapture._shouldCaptureResponseBody({
          headers: { get: () => 'text/plain' },
        })
      ).toBe(true);
    });

    test('should skip binary response bodies', () => {
      expect(
        networkCapture._shouldCaptureResponseBody({
          headers: { get: () => 'image/png' },
        })
      ).toBe(false);

      expect(
        networkCapture._shouldCaptureResponseBody({
          headers: { get: () => 'video/mp4' },
        })
      ).toBe(false);

      expect(
        networkCapture._shouldCaptureResponseBody({
          headers: { get: () => 'application/octet-stream' },
        })
      ).toBe(false);
    });
  });

  describe('Response Level Determination', () => {
    test('should assign correct levels based on status codes', () => {
      expect(networkCapture._getResponseLevel(200)).toBe('info');
      expect(networkCapture._getResponseLevel(302)).toBe('info');
      expect(networkCapture._getResponseLevel(404)).toBe('warn');
      expect(networkCapture._getResponseLevel(500)).toBe('error');
    });
  });

  describe('Complete Network Entry Structure', () => {
    test('should create complete AI-friendly request entry', () => {
      const requestData = {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "test"}',
        type: 'fetch',
        startTime: 123.456,
      };

      const entry = networkCapture._createRequestEntry(
        'test-req-123',
        requestData
      );

      // Verify complete structure
      expect(entry).toMatchObject({
        id: 'test-req-123',
        timestamp: expect.any(String),
        type: 'network',
        subtype: 'request',
        level: 'info',
        application: {
          name: 'test-app',
          sessionId: 'test-session-123',
          environment: 'test',
          developer: 'test-dev',
          branch: 'test-branch',
        },
        request: {
          id: 'test-req-123',
          url: 'https://api.example.com/users',
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String),
          type: 'fetch',
        },
        category: expect.any(String),
        tags: expect.any(Array),
        performance: expect.any(Object),
        analysis: expect.any(Object),
        metadata: expect.any(Object),
      });

      // Verify AI-friendly features
      expect(entry.tags).toContain('network');
      expect(entry.tags).toContain('request');
      expect(entry.category).toBe('API Request');
    });
  });

  describe('Response Entry Creation', () => {
    test('should create complete response entry', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        url: 'https://api.example.com/data',
        type: 'cors',
        redirected: false,
        headers: {
          get: jest.fn(key =>
            key === 'content-type' ? 'application/json' : null
          ),
          entries: jest.fn(() => [['content-type', 'application/json']]),
        },
        clone: jest.fn(() => ({
          text: jest.fn(() => Promise.resolve('{"data": "test"}')),
        })),
      };

      const timing = {
        startTime: 100,
        endTime: 200,
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      const entry = await networkCapture._createResponseEntry(
        'test-req-123',
        mockResponse,
        timing
      );

      expect(entry).toMatchObject({
        id: 'test-req-123_response',
        type: 'network',
        subtype: 'response',
        level: 'info',
        response: {
          requestId: 'test-req-123',
          status: 200,
          statusText: 'OK',
          url: 'https://api.example.com/data',
        },
        timing: {
          start: 100,
          end: 200,
          duration: 100,
          durationMs: 100,
        },
      });
    });

    test('should handle response body reading errors', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        url: 'https://api.example.com/data',
        type: 'cors',
        redirected: false,
        headers: {
          get: jest.fn(() => 'application/json'),
          entries: jest.fn(() => [['content-type', 'application/json']]),
        },
        clone: jest.fn(() => ({
          text: jest.fn(() => Promise.reject(new Error('Body read error'))),
        })),
      };

      const timing = { startTime: 100, endTime: 200 };
      const entry = await networkCapture._createResponseEntry(
        'test-req',
        mockResponse,
        timing
      );

      expect(entry.response.body).toContain(
        '[Error reading response body: Body read error]'
      );
    });
  });

  describe('XHR Response Entry Creation', () => {
    test('should create XHR response entry', () => {
      const mockXHR = {
        status: 200,
        statusText: 'OK',
        responseText: '{"success": true}',
        responseType: 'json',
        getAllResponseHeaders: jest.fn(
          () => 'content-type: application/json\r\n'
        ),
        getResponseHeader: jest.fn(() => 'application/json'),
      };

      const timing = {
        startTime: 100,
        endTime: 200,
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      const entry = networkCapture._createXHRResponseEntry(
        'test-req-123',
        mockXHR,
        timing
      );

      expect(entry).toMatchObject({
        id: 'test-req-123_response',
        type: 'network',
        subtype: 'response',
        response: {
          requestId: 'test-req-123',
          status: 200,
          statusText: 'OK',
          responseType: 'json',
        },
      });
    });
  });

  describe('Error Entry Creation', () => {
    test('should create error entry for network failures', () => {
      const error = new Error('Network request failed');
      const timing = {
        startTime: 100,
        endTime: 200,
        url: 'https://api.example.com/data',
        method: 'GET',
      };

      const entry = networkCapture._createErrorEntry(
        'test-req-123',
        error,
        timing
      );

      expect(entry).toMatchObject({
        id: 'test-req-123_error',
        type: 'network',
        subtype: 'error',
        level: 'error',
        error: {
          requestId: 'test-req-123',
          name: 'Error',
          message: 'Network request failed',
          url: 'https://api.example.com/data',
          method: 'GET',
        },
      });
    });
  });

  describe('Header Processing', () => {
    test('should convert Headers object to plain object', () => {
      const mockHeaders = {
        entries: jest.fn(() => [
          ['content-type', 'application/json'],
          ['authorization', 'Bearer token'],
        ]),
      };

      const result = networkCapture._headersToObject(mockHeaders);

      expect(result).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token',
      });
    });

    test('should get response headers from fetch Response', () => {
      const mockResponse = {
        headers: {
          entries: jest.fn(() => [['content-type', 'application/json']]),
        },
      };

      const headers = networkCapture._getResponseHeaders(mockResponse);

      expect(headers).toEqual({
        'content-type': 'application/json',
      });
    });

    test('should get XHR request headers', () => {
      const mockXHR = {
        getAllRequestHeaders: jest.fn(
          () =>
            'content-type: application/json\r\nauthorization: Bearer token\r\n'
        ),
      };

      const headers = networkCapture._getXHRHeaders(mockXHR);

      expect(headers).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token',
      });
    });

    test('should handle XHR header errors gracefully', () => {
      const mockXHR = {
        getAllRequestHeaders: jest.fn(() => {
          throw new Error('Headers not available');
        }),
      };

      const headers = networkCapture._getXHRHeaders(mockXHR);

      expect(headers).toEqual({});
    });
  });

  describe('Analysis Methods', () => {
    test('should analyze requests for AI insights', () => {
      const requestData = {
        url: 'https://api.example.com/users',
        method: 'POST',
      };

      const analysis = networkCapture._analyzeRequest(requestData);

      expect(analysis).toMatchObject({
        patterns: expect.any(Array),
        optimization: expect.any(Array),
        security: expect.any(Object),
      });
    });

    test('should analyze responses for AI insights', () => {
      const response = { status: 200, url: 'https://api.example.com/data' };
      const timing = { duration: 500 };

      const analysis = networkCapture._analyzeResponse(response, timing);

      expect(analysis).toMatchObject({
        patterns: expect.any(Array),
        optimization: expect.any(Array),
        performance: expect.any(Object),
      });
    });

    test('should analyze network errors for AI insights', () => {
      const error = new Error('CORS policy violation');
      const timing = { duration: 1000 };

      const analysis = networkCapture._analyzeNetworkError(error, timing);

      expect(analysis).toMatchObject({
        cause: expect.any(String),
        recovery: expect.any(Array),
        prevention: expect.any(Array),
      });
    });
  });

  describe('Configuration Options', () => {
    test('should respect capture options', () => {
      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
        captureHeaders: false,
        captureRequestBody: false,
        captureResponseBody: false,
      });

      expect(capture.options.captureHeaders).toBe(false);
      expect(capture.options.captureRequestBody).toBe(false);
      expect(capture.options.captureResponseBody).toBe(false);
    });

    test('should handle disabled network analysis', () => {
      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
        enableNetworkAnalysis: false,
        enablePerformanceTracking: false,
      });

      const requestData = {
        url: 'https://example.com',
        method: 'GET',
        startTime: 100,
      };
      const entry = capture._createRequestEntry('test-req', requestData);

      expect(entry.analysis).toBeNull();
      expect(entry.performance).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing fetch API gracefully', () => {
      const originalFetch = global.window.fetch;
      delete global.window.fetch;

      networkCapture.start();

      // Should not throw error
      expect(networkCapture.isCapturing).toBe(true);

      global.window.fetch = originalFetch;
    });

    test('should handle missing XMLHttpRequest gracefully', () => {
      const originalXHR = global.XMLHttpRequest;
      delete global.XMLHttpRequest;

      networkCapture.start();

      // Should not throw error
      expect(networkCapture.isCapturing).toBe(true);

      global.XMLHttpRequest = originalXHR;
    });

    test('should handle body serialization errors', () => {
      const circularObj = {};
      circularObj.self = circularObj;

      const sanitized = networkCapture._sanitizeBody(circularObj);

      expect(sanitized).toContain('[Unserializable body:');
    });

    test('should handle Blob bodies', () => {
      const blob = new Blob(['test data'], { type: 'text/plain', size: 9 });

      const sanitized = networkCapture._sanitizeBody(blob);

      expect(sanitized).toBe('[Blob: 9 bytes, type: text/plain]');
    });

    test('should handle empty header strings', () => {
      const mockXHR = {
        getAllRequestHeaders: jest.fn(() => ''),
        getAllResponseHeaders: jest.fn(() => ''),
      };

      const requestHeaders = networkCapture._getXHRHeaders(mockXHR);
      const responseHeaders = networkCapture._getXHRResponseHeaders(mockXHR);

      expect(requestHeaders).toEqual({});
      expect(responseHeaders).toEqual({});
    });

    test('should handle malformed header strings', () => {
      const mockXHR = {
        getAllResponseHeaders: jest.fn(
          () => 'malformed-header-without-colon\r\n'
        ),
      };

      const headers = networkCapture._getXHRResponseHeaders(mockXHR);

      expect(headers).toEqual({});
    });

    test('should handle XHR response header errors', () => {
      const mockXHR = {
        getAllResponseHeaders: jest.fn(() => {
          throw new Error('Headers not available');
        }),
      };

      const headers = networkCapture._getXHRResponseHeaders(mockXHR);

      expect(headers).toEqual({});
    });

    test('should handle missing content-type in XHR response body capture', () => {
      const mockXHR = {
        getResponseHeader: jest.fn(() => null),
      };

      const shouldCapture =
        networkCapture._shouldCaptureXHRResponseBody(mockXHR);

      expect(shouldCapture).toBe(true);
    });

    test('should handle audio content-type in response body capture', () => {
      const response = {
        headers: { get: () => 'audio/mp3' },
      };

      const shouldCapture = networkCapture._shouldCaptureResponseBody(response);

      expect(shouldCapture).toBe(false);
    });

    test('should handle video content-type in XHR response body capture', () => {
      const mockXHR = {
        getResponseHeader: jest.fn(() => 'video/mp4'),
      };

      const shouldCapture =
        networkCapture._shouldCaptureXHRResponseBody(mockXHR);

      expect(shouldCapture).toBe(false);
    });

    test('should handle missing performance.memory', () => {
      const originalMemory = global.performance.memory;
      delete global.performance.memory;

      const metrics = networkCapture._collectPerformanceMetrics();

      expect(metrics.memory).toBeUndefined();
      expect(metrics.timing).toBeDefined();

      global.performance.memory = originalMemory;
    });

    test('should handle string include patterns in URL filtering', () => {
      networkCapture.options.includeUrls = ['api.example.com'];

      expect(
        networkCapture._shouldCaptureUrl('https://api.example.com/data')
      ).toBe(true);
      expect(networkCapture._shouldCaptureUrl('https://other.com/data')).toBe(
        false
      );
    });

    test('should handle string exclude patterns in URL filtering', () => {
      networkCapture.options.excludeUrls = ['analytics'];

      expect(
        networkCapture._shouldCaptureUrl('https://analytics.example.com/track')
      ).toBe(false);
      expect(
        networkCapture._shouldCaptureUrl('https://api.example.com/data')
      ).toBe(true);
    });
  });

  describe('Comprehensive Categorization Tests', () => {
    test('should categorize data fetch requests', () => {
      const requestData = { url: 'https://example.com/users', method: 'GET' };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('Data Fetch');
    });

    test('should categorize HTTP requests as fallback', () => {
      const requestData = {
        url: 'https://example.com/unknown',
        method: 'OPTIONS',
      };
      const category = networkCapture._categorizeRequest(requestData);
      expect(category).toBe('HTTP Request');
    });

    test('should categorize unknown responses', () => {
      const response = { status: 100, url: 'https://example.com/data' };
      const category = networkCapture._categorizeResponse(response, {});
      expect(category).toBe('Unknown Response');
    });

    test('should categorize fetch errors', () => {
      const error = new Error('fetch failed');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('Fetch Error');
    });

    test('should handle unknown error types', () => {
      const error = new Error('Unknown error type');
      const category = networkCapture._categorizeNetworkError(error, {});
      expect(category).toBe('Network Error');
    });
  });

  describe('Analysis Placeholder Methods', () => {
    test('should call all placeholder analysis methods', () => {
      // These are placeholder methods that return empty arrays/objects
      expect(networkCapture._detectRequestPatterns()).toEqual([]);
      expect(networkCapture._suggestRequestOptimizations()).toEqual([]);
      expect(networkCapture._analyzeRequestSecurity()).toEqual({});
      expect(networkCapture._detectResponsePatterns()).toEqual([]);
      expect(networkCapture._suggestResponseOptimizations()).toEqual([]);
      expect(networkCapture._analyzeResponsePerformance()).toEqual({});
      expect(networkCapture._detectXHRResponsePatterns()).toEqual([]);
      expect(networkCapture._suggestXHRResponseOptimizations()).toEqual([]);
      expect(networkCapture._analyzeXHRResponsePerformance()).toEqual({});
      expect(networkCapture._identifyErrorCause()).toBe('Unknown');
      expect(networkCapture._suggestErrorRecovery()).toEqual([]);
      expect(networkCapture._suggestErrorPrevention()).toEqual([]);
    });
  });

  describe('XHR Interception and Processing', () => {
    test('should handle XHR readyState changes', () => {
      networkCapture.start();

      const xhr = new XMLHttpRequest();
      const originalOnReadyStateChange = jest.fn();
      xhr.onreadystatechange = originalOnReadyStateChange;

      // Simulate opening a request
      xhr.open('GET', 'https://api.example.com/data');

      // Simulate ready state change
      xhr.readyState = 4;
      xhr.status = 200;
      xhr.statusText = 'OK';
      xhr.responseText = '{"success": true}';

      // Trigger the onreadystatechange handler
      if (xhr.onreadystatechange) {
        xhr.onreadystatechange();
      }

      // Original handler should still be called
      expect(originalOnReadyStateChange).toHaveBeenCalled();
    });

    test('should handle XHR with no original onreadystatechange', () => {
      networkCapture.start();

      const xhr = new XMLHttpRequest();
      // No original onreadystatechange handler

      xhr.open('GET', 'https://api.example.com/data');
      xhr.readyState = 4;
      xhr.status = 200;

      // Should not throw error
      expect(() => {
        if (xhr.onreadystatechange) {
          xhr.onreadystatechange();
        }
      }).not.toThrow();
    });

    test('should handle XHR send with body', () => {
      // Set up mock XMLHttpRequest methods first
      const originalSend = jest.fn();
      XMLHttpRequest.prototype.send = originalSend;

      networkCapture.addListener(mockListener);
      networkCapture.start();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.example.com/data');
      xhr.send('{"test": "data"}');

      // Verify the original send was stored and interception is working
      expect(networkCapture.originalXHRSend).toBe(originalSend);
      expect(XMLHttpRequest.prototype.send).not.toBe(originalSend);
    });

    test('should handle XHR send without body', () => {
      // Set up mock XMLHttpRequest methods first
      const originalSend = jest.fn();
      XMLHttpRequest.prototype.send = originalSend;

      networkCapture.addListener(mockListener);
      networkCapture.start();

      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.example.com/data');
      xhr.send();

      // Verify the original send was stored and interception is working
      expect(networkCapture.originalXHRSend).toBe(originalSend);
      expect(XMLHttpRequest.prototype.send).not.toBe(originalSend);
    });
  });

  describe('Severity Edge Cases', () => {
    test('should handle moderate delay responses', () => {
      const response = { status: 200 };
      const timing = { duration: 3000 }; // 3 seconds
      const severity = networkCapture._calculateResponseSeverity(
        response,
        timing
      );

      expect(severity.factors).toContain('moderate-delay');
      expect(severity.score).toBe(5);
    });

    test('should handle CORS error severity', () => {
      const error = new Error('CORS policy violation');
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateErrorSeverity(error, timing);

      expect(severity.level).toBe('high');
      expect(severity.score).toBe(7);
      expect(severity.factors).toContain('cors-issue');
    });

    test('should handle timeout error severity', () => {
      const error = new Error('Request timeout');
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateErrorSeverity(error, timing);

      expect(severity.level).toBe('medium');
      expect(severity.score).toBe(6);
      expect(severity.factors).toContain('timeout');
    });

    test('should handle aborted request severity', () => {
      const error = new Error('Request aborted by user');
      const timing = { duration: 1000 };
      const severity = networkCapture._calculateErrorSeverity(error, timing);

      expect(severity.level).toBe('medium');
      expect(severity.score).toBe(4);
      expect(severity.factors).toContain('user-cancelled');
    });
  });

  describe('Tag Generation Edge Cases', () => {
    test('should generate XHR-specific tags', () => {
      const xhr = { status: 200, getResponseHeader: () => 'application/json' };
      const timing = { duration: 50 }; // Less than 100ms for 'fast' tag
      const tags = networkCapture._generateXHRResponseTags(xhr, timing);

      expect(tags).toContain('xhr');
      expect(tags).toContain('fast');
      expect(tags).toContain('json');
    });

    test('should generate HTML content tags', () => {
      const response = {
        status: 200,
        url: 'https://example.com',
        headers: { get: () => 'text/html' },
      };
      const timing = { duration: 500 };
      const tags = networkCapture._generateResponseTags(response, timing);

      expect(tags).toContain('html');
    });

    test('should generate XML content tags for XHR', () => {
      const xhr = { status: 200, getResponseHeader: () => 'application/xml' };
      const timing = { duration: 500 };
      const tags = networkCapture._generateXHRResponseTags(xhr, timing);

      expect(tags).toContain('xml');
    });

    test('should handle missing environment and branch in tags', () => {
      const capture = new NetworkCapture({
        applicationName: 'test-app',
        sessionId: 'test-session',
        // No environment or branch
      });

      const requestData = { url: 'https://example.com', method: 'GET' };
      const tags = capture._generateRequestTags(requestData);

      expect(tags).not.toContain('env-undefined');
      expect(tags).not.toContain('branch-undefined');
    });
  });

  describe('Real-world Integration Tests', () => {
    test('should handle complete fetch workflow', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        url: 'https://api.example.com/data',
        type: 'cors',
        redirected: false,
        headers: {
          get: jest.fn(key =>
            key === 'content-type' ? 'application/json' : null
          ),
          entries: jest.fn(() => [['content-type', 'application/json']]),
        },
        clone: jest.fn(() => ({
          text: jest.fn(() => Promise.resolve('{"data": "test"}')),
        })),
      };

      global.window.fetch = jest.fn(() => Promise.resolve(mockResponse));

      networkCapture.addListener(mockListener);
      networkCapture.start();

      await fetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Should capture both request and response
      expect(mockListener).toHaveBeenCalledTimes(2);
    });

    test('should handle fetch with error', async () => {
      const error = new Error('Network error');
      global.window.fetch = jest.fn(() => Promise.reject(error));

      networkCapture.addListener(mockListener);
      networkCapture.start();

      try {
        await fetch('https://api.example.com/data');
      } catch (e) {
        // Expected to throw
      }

      // Should capture request and error
      expect(mockListener).toHaveBeenCalledTimes(2);
    });
  });
});
