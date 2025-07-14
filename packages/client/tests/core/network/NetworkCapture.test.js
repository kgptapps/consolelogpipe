/**
 * NetworkCapture Tests
 */

const NetworkCapture = require('../../../src/core/network/NetworkCapture');

// Mock dependencies
jest.mock('../../../src/core/network/NetworkUtils');
jest.mock('../../../src/core/network/NetworkSanitizer');
jest.mock('../../../src/core/network/NetworkAnalyzer');
jest.mock('../../../src/core/network/NetworkFormatter');
jest.mock('../../../src/core/network/NetworkInterceptor');

const NetworkUtils = require('../../../src/core/network/NetworkUtils');
const NetworkSanitizer = require('../../../src/core/network/NetworkSanitizer');
const NetworkAnalyzer = require('../../../src/core/network/NetworkAnalyzer');
const NetworkFormatter = require('../../../src/core/network/NetworkFormatter');
const NetworkInterceptor = require('../../../src/core/network/NetworkInterceptor');

describe('NetworkCapture', () => {
  let capture;
  let mockSanitizer;
  let mockAnalyzer;
  let mockFormatter;
  let mockInterceptor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock NetworkSanitizer
    mockSanitizer = {
      sanitizeHeaders: jest
        .fn()
        .mockReturnValue({ 'content-type': 'application/json' }),
      sanitizeBody: jest.fn().mockReturnValue('sanitized-body'),
      sanitizeUrl: jest.fn().mockReturnValue('https://sanitized.com'),
    };
    NetworkSanitizer.mockImplementation(() => mockSanitizer);

    // Mock NetworkAnalyzer
    mockAnalyzer = {
      categorizeRequest: jest.fn().mockReturnValue('api'),
      categorizeResponse: jest.fn().mockReturnValue('success'),
      categorizeXHRResponse: jest.fn().mockReturnValue('xhr-success'),
      categorizeNetworkError: jest.fn().mockReturnValue('network-error'),
      calculateResponseSeverity: jest.fn().mockReturnValue('low'),
      calculateXHRResponseSeverity: jest.fn().mockReturnValue('low'),
      calculateErrorSeverity: jest.fn().mockReturnValue('high'),
      generateRequestTags: jest.fn().mockReturnValue(['GET', 'api']),
      generateResponseTags: jest.fn().mockReturnValue(['200', 'success']),
      generateXHRResponseTags: jest.fn().mockReturnValue(['xhr', '200']),
      generateErrorTags: jest.fn().mockReturnValue(['error', 'network']),
      analyzeRequest: jest.fn().mockReturnValue({ type: 'api-call' }),
      analyzeResponse: jest.fn().mockReturnValue({ status: 'ok' }),
      analyzeXHRResponse: jest.fn().mockReturnValue({ xhr: 'ok' }),
      analyzeNetworkError: jest
        .fn()
        .mockReturnValue({ error: 'network-failure' }),
    };
    NetworkAnalyzer.mockImplementation(() => mockAnalyzer);

    // Mock NetworkFormatter
    mockFormatter = {
      analyzer: mockAnalyzer,
      createRequestEntry: jest
        .fn()
        .mockReturnValue({ id: 'req-123', type: 'request' }),
      createResponseEntry: jest
        .fn()
        .mockResolvedValue({ id: 'res-123', type: 'response' }),
      createXHRResponseEntry: jest
        .fn()
        .mockReturnValue({ id: 'xhr-123', type: 'xhr-response' }),
      createErrorEntry: jest
        .fn()
        .mockReturnValue({ id: 'err-123', type: 'error' }),
    };
    NetworkFormatter.mockImplementation(() => mockFormatter);

    // Mock NetworkInterceptor
    mockInterceptor = {
      setupInterception: jest.fn(),
      restoreOriginalMethods: jest.fn(),
    };
    NetworkInterceptor.mockImplementation(() => mockInterceptor);

    // Mock NetworkUtils
    NetworkUtils.shouldCaptureUrl = jest.fn().mockReturnValue(true);
    NetworkUtils.generateRequestId = jest.fn().mockReturnValue('req-123');
    NetworkUtils.headersToObject = jest
      .fn()
      .mockReturnValue({ 'content-type': 'application/json' });
    NetworkUtils.getResponseHeaders = jest
      .fn()
      .mockReturnValue({ 'content-type': 'application/json' });
    NetworkUtils.getXHRHeaders = jest
      .fn()
      .mockReturnValue({ 'content-type': 'text/html' });
    NetworkUtils.getXHRResponseHeaders = jest
      .fn()
      .mockReturnValue({ 'content-type': 'text/html' });
    NetworkUtils.shouldCaptureResponseBody = jest.fn().mockReturnValue(true);
    NetworkUtils.shouldCaptureXHRResponseBody = jest.fn().mockReturnValue(true);
    NetworkUtils.getResponseLevel = jest.fn().mockReturnValue('info');
    NetworkUtils.collectPerformanceMetrics = jest
      .fn()
      .mockReturnValue({ memory: '10MB' });

    // Mock browser environment
    delete global.window;
    delete global.XMLHttpRequest;
    global.window = {
      fetch: jest.fn(),
    };
    global.XMLHttpRequest = function () {};
    global.XMLHttpRequest.prototype = {
      open: jest.fn(),
      send: jest.fn(),
    };

    capture = new NetworkCapture({
      applicationName: 'test-app',
      sessionId: 'test-session',
      environment: 'test',
    });
  });

  afterEach(() => {
    delete global.window;
    delete global.XMLHttpRequest;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCapture = new NetworkCapture();

      expect(defaultCapture.options.captureFetch).toBe(true);
      expect(defaultCapture.options.captureXHR).toBe(true);
      expect(defaultCapture.options.environment).toBe('development');
      expect(defaultCapture.options.serverPort).toBe(3001);
      expect(defaultCapture.options.enableNetworkAnalysis).toBe(true);
      expect(defaultCapture.options.enablePerformanceTracking).toBe(true);
    });

    it('should initialize with custom options', () => {
      const customCapture = new NetworkCapture({
        applicationName: 'custom-app',
        captureFetch: false,
        enableNetworkAnalysis: false,
        serverPort: 4000,
      });

      expect(customCapture.options.applicationName).toBe('custom-app');
      expect(customCapture.options.captureFetch).toBe(false);
      expect(customCapture.options.enableNetworkAnalysis).toBe(false);
      expect(customCapture.options.serverPort).toBe(4000);
    });

    it('should merge URL filters when exclude filters are provided', () => {
      const captureWithFilters = new NetworkCapture({
        urlFilters: {
          exclude: [/test\.com/, /example\.org/],
        },
      });

      // Check that the new filters are included
      const excludeUrls = captureWithFilters.options.excludeUrls;
      const hasTestCom = excludeUrls.some(
        regex => regex.toString() === '/test\\.com/'
      );
      const hasExampleOrg = excludeUrls.some(
        regex => regex.toString() === '/example\\.org/'
      );

      expect(hasTestCom).toBe(true);
      expect(hasExampleOrg).toBe(true);
      expect(excludeUrls.length).toBeGreaterThan(7); // Should include defaults + new ones
    });

    it('should set include filters when provided', () => {
      const captureWithFilters = new NetworkCapture({
        urlFilters: {
          include: [/api\.example\.com/, /secure\.site\.com/],
        },
      });

      expect(captureWithFilters.options.includeUrls).toEqual([
        /api\.example\.com/,
        /secure\.site\.com/,
      ]);
    });

    it('should not modify URL filters when none are provided', () => {
      const captureWithoutFilters = new NetworkCapture();

      expect(captureWithoutFilters.options.excludeUrls).toHaveLength(7); // Default excludes
      expect(captureWithoutFilters.options.includeUrls).toEqual([]);
    });

    it('should initialize components correctly', () => {
      expect(NetworkSanitizer).toHaveBeenCalledWith(capture.options);
      expect(NetworkAnalyzer).toHaveBeenCalledWith(capture.options);
      expect(NetworkFormatter).toHaveBeenCalledWith(capture.options);
      expect(NetworkInterceptor).toHaveBeenCalledWith(
        capture.options,
        mockFormatter,
        expect.any(Function)
      );
    });

    it('should initialize state correctly', () => {
      expect(capture.isCapturing).toBe(false);
      expect(capture.listeners).toBeInstanceOf(Set);
      expect(capture.networkQueue).toEqual([]);
      expect(capture.originalFetch).toBeNull();
      expect(capture.originalXHROpen).toBeNull();
      expect(capture.originalXHRSend).toBeNull();
    });
  });

  describe('start', () => {
    it('should start capturing when not already capturing', () => {
      capture.start();

      expect(capture.isCapturing).toBe(true);
      expect(mockInterceptor.setupInterception).toHaveBeenCalled();
      expect(capture.originalFetch).toBe(global.window.fetch);
      expect(capture.originalXHROpen).toBe(
        global.XMLHttpRequest.prototype.open
      );
      expect(capture.originalXHRSend).toBe(
        global.XMLHttpRequest.prototype.send
      );
    });

    it('should not start capturing when already capturing', () => {
      capture.isCapturing = true;
      capture.start();

      expect(mockInterceptor.setupInterception).not.toHaveBeenCalled();
    });

    it('should handle missing window object', () => {
      delete global.window;
      capture.start();

      expect(capture.isCapturing).toBe(true);
      expect(mockInterceptor.setupInterception).toHaveBeenCalled();
      expect(capture.originalFetch).toBeNull();
    });

    it('should handle missing XMLHttpRequest', () => {
      delete global.XMLHttpRequest;
      capture.start();

      expect(capture.isCapturing).toBe(true);
      expect(mockInterceptor.setupInterception).toHaveBeenCalled();
      expect(capture.originalXHROpen).toBeNull();
      expect(capture.originalXHRSend).toBeNull();
    });
  });

  describe('stop', () => {
    it('should stop capturing when currently capturing', () => {
      capture.isCapturing = true;
      capture.stop();

      expect(capture.isCapturing).toBe(false);
      expect(mockInterceptor.restoreOriginalMethods).toHaveBeenCalled();
    });

    it('should not stop capturing when not currently capturing', () => {
      capture.isCapturing = false;
      capture.stop();

      expect(mockInterceptor.restoreOriginalMethods).not.toHaveBeenCalled();
    });
  });

  describe('listener management', () => {
    it('should add valid function listeners', () => {
      const listener = jest.fn();
      capture.addListener(listener);

      expect(capture.listeners.has(listener)).toBe(true);
    });

    it('should not add non-function listeners', () => {
      capture.addListener('not-a-function');
      capture.addListener(null);
      capture.addListener(undefined);
      capture.addListener(123);

      expect(capture.listeners.size).toBe(0);
    });

    it('should remove listeners', () => {
      const listener = jest.fn();
      capture.addListener(listener);
      capture.removeListener(listener);

      expect(capture.listeners.has(listener)).toBe(false);
    });
  });

  describe('network data management', () => {
    it('should return copy of network queue', () => {
      const testData = { id: 'test-1', type: 'request' };
      capture.networkQueue.push(testData);

      const result = capture.getNetworkData();

      expect(result).toEqual([testData]);
      expect(result).not.toBe(capture.networkQueue); // Should be a copy
    });

    it('should clear network queue', () => {
      capture.networkQueue.push({ id: 'test-1' }, { id: 'test-2' });
      capture.clearNetworkData();

      expect(capture.networkQueue).toEqual([]);
    });
  });

  describe('_notifyListeners', () => {
    it('should add data to queue and notify listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const testData = { id: 'test-1', type: 'request' };

      capture.addListener(listener1);
      capture.addListener(listener2);
      capture._notifyListeners(testData);

      expect(capture.networkQueue).toContain(testData);
      expect(listener1).toHaveBeenCalledWith(testData);
      expect(listener2).toHaveBeenCalledWith(testData);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      const testData = { id: 'test-1', type: 'request' };

      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      capture.addListener(errorListener);
      capture.addListener(goodListener);
      capture._notifyListeners(testData);

      expect(capture.networkQueue).toContain(testData);
      expect(errorListener).toHaveBeenCalledWith(testData);
      expect(goodListener).toHaveBeenCalledWith(testData);
      expect(consoleSpy).toHaveBeenCalledWith(
        'NetworkCapture: Listener error',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('legacy method aliases', () => {
    it('should delegate _shouldCaptureUrl to NetworkUtils', () => {
      const url = 'https://api.example.com';
      const result = capture._shouldCaptureUrl(url);

      expect(NetworkUtils.shouldCaptureUrl).toHaveBeenCalledWith(
        url,
        capture.options
      );
      expect(result).toBe(true);
    });

    it('should delegate _generateRequestId to NetworkUtils', () => {
      const result = capture._generateRequestId();

      expect(NetworkUtils.generateRequestId).toHaveBeenCalled();
      expect(result).toBe('req-123');
    });

    it('should delegate _createRequestEntry to formatter', () => {
      const requestId = 'req-123';
      const requestData = { url: 'https://api.example.com', method: 'GET' };
      const result = capture._createRequestEntry(requestId, requestData);

      expect(mockFormatter.createRequestEntry).toHaveBeenCalledWith(
        requestId,
        requestData
      );
      expect(result).toEqual({ id: 'req-123', type: 'request' });
    });

    it('should delegate _createResponseEntry to formatter', async () => {
      const requestId = 'req-123';
      const response = { status: 200 };
      const timing = { startTime: 1000, endTime: 1500 };
      const result = await capture._createResponseEntry(
        requestId,
        response,
        timing
      );

      expect(mockFormatter.createResponseEntry).toHaveBeenCalledWith(
        requestId,
        response,
        timing
      );
      expect(result).toEqual({ id: 'res-123', type: 'response' });
    });

    it('should delegate _createXHRResponseEntry to formatter', () => {
      const requestId = 'xhr-123';
      const xhr = { status: 201 };
      const timing = { startTime: 2000, endTime: 2300 };
      const result = capture._createXHRResponseEntry(requestId, xhr, timing);

      expect(mockFormatter.createXHRResponseEntry).toHaveBeenCalledWith(
        requestId,
        xhr,
        timing
      );
      expect(result).toEqual({ id: 'xhr-123', type: 'xhr-response' });
    });

    it('should delegate _createErrorEntry to formatter', () => {
      const requestId = 'err-123';
      const error = new Error('Network error');
      const timing = { startTime: 3000, endTime: 3500 };
      const result = capture._createErrorEntry(requestId, error, timing);

      expect(mockFormatter.createErrorEntry).toHaveBeenCalledWith(
        requestId,
        error,
        timing
      );
      expect(result).toEqual({ id: 'err-123', type: 'error' });
    });

    it('should delegate NetworkUtils methods correctly', () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      const response = { headers };
      const xhr = { getAllResponseHeaders: () => 'content-type: text/html' };

      capture._headersToObject(headers);
      capture._getResponseHeaders(response);
      capture._getXHRHeaders(xhr);
      capture._getXHRResponseHeaders(xhr);
      capture._shouldCaptureResponseBody(response);
      capture._shouldCaptureXHRResponseBody(xhr);
      capture._getResponseLevel(200);
      capture._collectPerformanceMetrics();

      expect(NetworkUtils.headersToObject).toHaveBeenCalledWith(headers);
      expect(NetworkUtils.getResponseHeaders).toHaveBeenCalledWith(response);
      expect(NetworkUtils.getXHRHeaders).toHaveBeenCalledWith(xhr);
      expect(NetworkUtils.getXHRResponseHeaders).toHaveBeenCalledWith(xhr);
      expect(NetworkUtils.shouldCaptureResponseBody).toHaveBeenCalledWith(
        response
      );
      expect(NetworkUtils.shouldCaptureXHRResponseBody).toHaveBeenCalledWith(
        xhr
      );
      expect(NetworkUtils.getResponseLevel).toHaveBeenCalledWith(200);
      expect(NetworkUtils.collectPerformanceMetrics).toHaveBeenCalled();
    });

    it('should delegate analyzer methods correctly', () => {
      const requestData = { url: 'https://api.example.com', method: 'GET' };
      const response = { status: 200 };
      const xhr = { status: 201 };
      const error = new Error('Network error');
      const timing = { startTime: 1000, endTime: 1500 };

      capture._categorizeRequest(requestData);
      capture._categorizeResponse(response, timing);
      capture._categorizeXHRResponse(xhr, timing);
      capture._categorizeNetworkError(error, timing);
      capture._calculateResponseSeverity(response, timing);
      capture._calculateXHRResponseSeverity(xhr, timing);
      capture._calculateErrorSeverity(error, timing);
      capture._generateRequestTags(requestData);
      capture._generateResponseTags(response, timing);
      capture._generateXHRResponseTags(xhr, timing);
      capture._generateErrorTags(error, timing);
      capture._analyzeRequest(requestData);
      capture._analyzeResponse(response, timing);
      capture._analyzeXHRResponse(xhr, timing);
      capture._analyzeNetworkError(error, timing);

      expect(mockAnalyzer.categorizeRequest).toHaveBeenCalledWith(requestData);
      expect(mockAnalyzer.categorizeResponse).toHaveBeenCalledWith(
        response,
        timing
      );
      expect(mockAnalyzer.categorizeXHRResponse).toHaveBeenCalledWith(
        xhr,
        timing
      );
      expect(mockAnalyzer.categorizeNetworkError).toHaveBeenCalledWith(
        error,
        timing
      );
      expect(mockAnalyzer.calculateResponseSeverity).toHaveBeenCalledWith(
        response,
        timing
      );
      expect(mockAnalyzer.calculateXHRResponseSeverity).toHaveBeenCalledWith(
        xhr,
        timing
      );
      expect(mockAnalyzer.calculateErrorSeverity).toHaveBeenCalledWith(
        error,
        timing
      );
      expect(mockAnalyzer.generateRequestTags).toHaveBeenCalledWith(
        requestData
      );
      expect(mockAnalyzer.generateResponseTags).toHaveBeenCalledWith(
        response,
        timing
      );
      expect(mockAnalyzer.generateXHRResponseTags).toHaveBeenCalledWith(
        xhr,
        timing
      );
      expect(mockAnalyzer.generateErrorTags).toHaveBeenCalledWith(
        error,
        timing
      );
      expect(mockAnalyzer.analyzeRequest).toHaveBeenCalledWith(requestData);
      expect(mockAnalyzer.analyzeResponse).toHaveBeenCalledWith(
        response,
        timing
      );
      expect(mockAnalyzer.analyzeXHRResponse).toHaveBeenCalledWith(xhr, timing);
      expect(mockAnalyzer.analyzeNetworkError).toHaveBeenCalledWith(
        error,
        timing
      );
    });

    it('should delegate interceptor methods correctly', () => {
      capture._setupNetworkInterception();
      capture._restoreNetworkMethods();

      expect(mockInterceptor.setupInterception).toHaveBeenCalled();
      expect(mockInterceptor.restoreOriginalMethods).toHaveBeenCalled();
    });

    it('should delegate sanitizer methods correctly', () => {
      const headers = { authorization: 'Bearer token' };
      const body = '{"password": "secret"}';
      const url = 'https://api.example.com?token=secret';

      capture._sanitizeHeaders(headers);
      capture._sanitizeBody(body);
      capture._sanitizeUrl(url);

      expect(mockSanitizer.sanitizeHeaders).toHaveBeenCalledWith(
        headers,
        capture.options
      );
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(
        body,
        capture.options
      );
      expect(mockSanitizer.sanitizeUrl).toHaveBeenCalledWith(url);
    });

    it('should return placeholder values for backward compatibility methods', () => {
      expect(capture._detectRequestPatterns()).toEqual([]);
      expect(capture._suggestRequestOptimizations()).toEqual([]);
      expect(capture._analyzeRequestSecurity()).toEqual({});
      expect(capture._detectResponsePatterns()).toEqual([]);
      expect(capture._suggestResponseOptimizations()).toEqual([]);
      expect(capture._analyzeResponsePerformance()).toEqual({});
      expect(capture._detectXHRResponsePatterns()).toEqual([]);
      expect(capture._suggestXHRResponseOptimizations()).toEqual([]);
      expect(capture._analyzeXHRResponsePerformance()).toEqual({});
      expect(capture._identifyErrorCause()).toBe('Unknown');
      expect(capture._suggestErrorRecovery()).toEqual([]);
      expect(capture._suggestErrorPrevention()).toEqual([]);
    });
  });
});
