/**
 * NetworkFormatter Tests
 */

const NetworkFormatter = require('../../../src/core/network/NetworkFormatter');

// Mock dependencies
jest.mock('../../../src/core/network/NetworkUtils');
jest.mock('../../../src/core/network/NetworkSanitizer');
jest.mock('../../../src/core/network/NetworkAnalyzer');

const NetworkUtils = require('../../../src/core/network/NetworkUtils');
const NetworkSanitizer = require('../../../src/core/network/NetworkSanitizer');
const NetworkAnalyzer = require('../../../src/core/network/NetworkAnalyzer');

describe('NetworkFormatter', () => {
  let formatter;
  let mockSanitizer;
  let mockAnalyzer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock NetworkSanitizer
    mockSanitizer = {
      sanitizeHeaders: jest
        .fn()
        .mockReturnValue({ 'content-type': 'application/json' }),
      sanitizeBody: jest.fn().mockReturnValue('sanitized-body'),
    };
    NetworkSanitizer.mockImplementation(() => mockSanitizer);

    // Mock NetworkAnalyzer
    mockAnalyzer = {
      categorizeRequest: jest.fn().mockReturnValue('api'),
      generateRequestTags: jest.fn().mockReturnValue(['GET', 'api']),
      analyzeRequest: jest.fn().mockReturnValue({ type: 'api-call' }),
      categorizeResponse: jest.fn().mockReturnValue('success'),
      calculateResponseSeverity: jest.fn().mockReturnValue('low'),
      generateResponseTags: jest.fn().mockReturnValue(['200', 'success']),
      analyzeResponse: jest.fn().mockReturnValue({ status: 'ok' }),
      categorizeXHRResponse: jest.fn().mockReturnValue('xhr-success'),
      calculateXHRResponseSeverity: jest.fn().mockReturnValue('low'),
      generateXHRResponseTags: jest.fn().mockReturnValue(['xhr', '200']),
      analyzeXHRResponse: jest.fn().mockReturnValue({ xhr: 'ok' }),
      categorizeNetworkError: jest.fn().mockReturnValue('network-error'),
      calculateErrorSeverity: jest.fn().mockReturnValue('high'),
      generateErrorTags: jest.fn().mockReturnValue(['error', 'network']),
      analyzeNetworkError: jest
        .fn()
        .mockReturnValue({ error: 'network-failure' }),
    };
    NetworkAnalyzer.mockImplementation(() => mockAnalyzer);

    // Mock NetworkUtils
    NetworkUtils.collectPerformanceMetrics = jest
      .fn()
      .mockReturnValue({ memory: '10MB' });
    NetworkUtils.shouldCaptureResponseBody = jest.fn().mockReturnValue(true);
    NetworkUtils.shouldCaptureXHRResponseBody = jest.fn().mockReturnValue(true);
    NetworkUtils.getResponseLevel = jest.fn().mockReturnValue('info');
    NetworkUtils.getResponseHeaders = jest
      .fn()
      .mockReturnValue({ 'content-type': 'application/json' });
    NetworkUtils.getXHRResponseHeaders = jest
      .fn()
      .mockReturnValue({ 'content-type': 'text/html' });

    // Mock navigator
    delete global.navigator;
    global.navigator = { userAgent: 'Test Browser' };

    formatter = new NetworkFormatter({
      applicationName: 'test-app',
      sessionId: 'test-session',
      environment: 'test',
      developer: 'test-dev',
      branch: 'test-branch',
    });
  });

  afterEach(() => {
    delete global.navigator;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultFormatter = new NetworkFormatter();

      expect(defaultFormatter.options.environment).toBe('development');
      expect(defaultFormatter.options.enableNetworkAnalysis).toBe(true);
      expect(defaultFormatter.options.enablePerformanceTracking).toBe(true);
    });

    it('should initialize with custom options', () => {
      const customFormatter = new NetworkFormatter({
        applicationName: 'custom-app',
        enableNetworkAnalysis: false,
        enablePerformanceTracking: false,
      });

      expect(customFormatter.options.applicationName).toBe('custom-app');
      expect(customFormatter.options.enableNetworkAnalysis).toBe(false);
      expect(customFormatter.options.enablePerformanceTracking).toBe(false);
    });

    it('should create sanitizer and analyzer instances', () => {
      expect(NetworkSanitizer).toHaveBeenCalled();
      expect(NetworkAnalyzer).toHaveBeenCalled();
    });
  });

  describe('createRequestEntry', () => {
    const requestData = {
      url: 'https://api.example.com/users',
      method: 'get',
      headers: { authorization: 'Bearer token' },
      body: '{"name": "John"}',
      type: 'fetch',
      startTime: 1000,
    };

    it('should create basic request entry', () => {
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.id).toBe('req-123');
      expect(result.type).toBe('network');
      expect(result.subtype).toBe('request');
      expect(result.level).toBe('info');
      expect(result.request.method).toBe('GET');
      expect(result.request.url).toBe(requestData.url);
    });

    it('should include application context', () => {
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.application).toEqual({
        name: 'test-app',
        sessionId: 'test-session',
        environment: 'test',
        developer: 'test-dev',
        branch: 'test-branch',
      });
    });

    it('should sanitize headers and body', () => {
      formatter.createRequestEntry('req-123', requestData);

      expect(mockSanitizer.sanitizeHeaders).toHaveBeenCalledWith(
        requestData.headers
      );
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(requestData.body);
    });

    it('should include performance metrics when enabled', () => {
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.performance).toEqual({ memory: '10MB' });
      expect(NetworkUtils.collectPerformanceMetrics).toHaveBeenCalled();
    });

    it('should exclude performance metrics when disabled', () => {
      formatter.options.enablePerformanceTracking = false;
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.performance).toBeNull();
      expect(NetworkUtils.collectPerformanceMetrics).not.toHaveBeenCalled();
    });

    it('should include network analysis when enabled', () => {
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.analysis).toEqual({ type: 'api-call' });
      expect(mockAnalyzer.analyzeRequest).toHaveBeenCalledWith(requestData);
    });

    it('should exclude network analysis when disabled', () => {
      formatter.options.enableNetworkAnalysis = false;
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.analysis).toBeNull();
      expect(mockAnalyzer.analyzeRequest).not.toHaveBeenCalled();
    });

    it('should handle missing navigator', () => {
      delete global.navigator;
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.metadata.userAgent).toBe('Unknown');
    });

    it('should include analyzer results', () => {
      const result = formatter.createRequestEntry('req-123', requestData);

      expect(result.category).toBe('api');
      expect(result.tags).toEqual(['GET', 'api']);
      expect(mockAnalyzer.categorizeRequest).toHaveBeenCalledWith(requestData);
      expect(mockAnalyzer.generateRequestTags).toHaveBeenCalledWith(
        requestData
      );
    });
  });

  describe('createResponseEntry', () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      clone: jest.fn().mockReturnValue({
        text: jest.fn().mockResolvedValue('{"success": true}'),
      }),
    };

    const timing = {
      startTime: 1000,
      endTime: 1500,
      url: 'https://api.example.com/users',
      method: 'GET',
    };

    beforeEach(() => {
      formatter.options.captureResponseBody = true;
    });

    it('should create basic response entry', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.id).toBe('req-123_response');
      expect(result.type).toBe('network');
      expect(result.subtype).toBe('response');
      expect(result.response.status).toBe(200);
      expect(result.response.statusText).toBe('OK');
    });

    it('should calculate timing correctly', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.timing.start).toBe(1000);
      expect(result.timing.end).toBe(1500);
      expect(result.timing.duration).toBe(500);
      expect(result.timing.durationMs).toBe(500);
    });

    it('should capture response body when enabled and allowed', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(mockResponse.clone).toHaveBeenCalled();
      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(
        '{"success": true}'
      );
    });

    it('should not capture response body when disabled', async () => {
      formatter.options.captureResponseBody = false;
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(mockResponse.clone).toHaveBeenCalled(); // Response is always cloned
      expect(mockResponse.clone().text).not.toHaveBeenCalled(); // But text is not read
      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(null);
    });

    it('should not capture response body when not allowed', async () => {
      NetworkUtils.shouldCaptureResponseBody.mockReturnValue(false);
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(mockResponse.clone).toHaveBeenCalled(); // Response is always cloned
      expect(mockResponse.clone().text).not.toHaveBeenCalled(); // But text is not read
      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(null);
    });

    it('should handle response body reading errors', async () => {
      const errorResponse = {
        ...mockResponse,
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockRejectedValue(new Error('Read error')),
        }),
      };

      const result = await formatter.createResponseEntry(
        'req-123',
        errorResponse,
        timing
      );

      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(
        '[Error reading response body: Read error]'
      );
    });

    it('should include performance metrics when enabled', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.performance).toEqual({ memory: '10MB' });
      expect(NetworkUtils.collectPerformanceMetrics).toHaveBeenCalled();
    });

    it('should exclude performance metrics when disabled', async () => {
      formatter.options.enablePerformanceTracking = false;
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.performance).toBeNull();
      expect(NetworkUtils.collectPerformanceMetrics).not.toHaveBeenCalled();
    });

    it('should include network analysis when enabled', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.analysis).toEqual({ status: 'ok' });
      expect(mockAnalyzer.analyzeResponse).toHaveBeenCalledWith(
        mockResponse,
        timing
      );
    });

    it('should exclude network analysis when disabled', async () => {
      formatter.options.enableNetworkAnalysis = false;
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.analysis).toBeNull();
      expect(mockAnalyzer.analyzeResponse).not.toHaveBeenCalled();
    });

    it('should handle missing navigator', async () => {
      delete global.navigator;
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.metadata.userAgent).toBe('Unknown');
    });

    it('should include analyzer results', async () => {
      const result = await formatter.createResponseEntry(
        'req-123',
        mockResponse,
        timing
      );

      expect(result.category).toBe('success');
      expect(result.severity).toBe('low');
      expect(result.tags).toEqual(['200', 'success']);
      expect(mockAnalyzer.categorizeResponse).toHaveBeenCalledWith(
        mockResponse,
        timing
      );
      expect(mockAnalyzer.calculateResponseSeverity).toHaveBeenCalledWith(
        mockResponse,
        timing
      );
      expect(mockAnalyzer.generateResponseTags).toHaveBeenCalledWith(
        mockResponse,
        timing
      );
    });
  });

  describe('createXHRResponseEntry', () => {
    const mockXHR = {
      status: 201,
      statusText: 'Created',
      responseType: 'json',
      responseText: '{"id": 123}',
    };

    const timing = {
      startTime: 2000,
      endTime: 2300,
      url: 'https://api.example.com/posts',
      method: 'POST',
    };

    beforeEach(() => {
      formatter.options.captureResponseBody = true;
    });

    it('should create basic XHR response entry', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.id).toBe('xhr-456_response');
      expect(result.type).toBe('network');
      expect(result.subtype).toBe('response');
      expect(result.response.status).toBe(201);
      expect(result.response.statusText).toBe('Created');
      expect(result.response.responseType).toBe('json');
    });

    it('should calculate timing correctly', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.timing.start).toBe(2000);
      expect(result.timing.end).toBe(2300);
      expect(result.timing.duration).toBe(300);
      expect(result.timing.durationMs).toBe(300);
    });

    it('should capture XHR response body when enabled and allowed', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith('{"id": 123}');
    });

    it('should not capture XHR response body when disabled', () => {
      formatter.options.captureResponseBody = false;
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(null);
    });

    it('should not capture XHR response body when not allowed', () => {
      NetworkUtils.shouldCaptureXHRResponseBody.mockReturnValue(false);
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.response.body).toBe('sanitized-body');
      expect(mockSanitizer.sanitizeBody).toHaveBeenCalledWith(null);
    });

    it('should handle missing responseType', () => {
      const xhrWithoutType = { ...mockXHR };
      delete xhrWithoutType.responseType;

      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        xhrWithoutType,
        timing
      );

      expect(result.response.responseType).toBe('text');
    });

    it('should include performance metrics when enabled', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.performance).toEqual({ memory: '10MB' });
      expect(NetworkUtils.collectPerformanceMetrics).toHaveBeenCalled();
    });

    it('should exclude performance metrics when disabled', () => {
      formatter.options.enablePerformanceTracking = false;
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.performance).toBeNull();
      expect(NetworkUtils.collectPerformanceMetrics).not.toHaveBeenCalled();
    });

    it('should include network analysis when enabled', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.analysis).toEqual({ xhr: 'ok' });
      expect(mockAnalyzer.analyzeXHRResponse).toHaveBeenCalledWith(
        mockXHR,
        timing
      );
    });

    it('should exclude network analysis when disabled', () => {
      formatter.options.enableNetworkAnalysis = false;
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.analysis).toBeNull();
      expect(mockAnalyzer.analyzeXHRResponse).not.toHaveBeenCalled();
    });

    it('should handle missing navigator', () => {
      delete global.navigator;
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.metadata.userAgent).toBe('Unknown');
    });

    it('should include XHR analyzer results', () => {
      const result = formatter.createXHRResponseEntry(
        'xhr-456',
        mockXHR,
        timing
      );

      expect(result.category).toBe('xhr-success');
      expect(result.severity).toBe('low');
      expect(result.tags).toEqual(['xhr', '200']);
      expect(mockAnalyzer.categorizeXHRResponse).toHaveBeenCalledWith(
        mockXHR,
        timing
      );
      expect(mockAnalyzer.calculateXHRResponseSeverity).toHaveBeenCalledWith(
        mockXHR,
        timing
      );
      expect(mockAnalyzer.generateXHRResponseTags).toHaveBeenCalledWith(
        mockXHR,
        timing
      );
    });
  });

  describe('createErrorEntry', () => {
    const mockError = new Error('Network timeout');
    mockError.name = 'TimeoutError';
    mockError.stack = 'TimeoutError: Network timeout\n    at fetch...';

    const timing = {
      startTime: 3000,
      endTime: 3500,
      url: 'https://api.example.com/timeout',
      method: 'GET',
    };

    it('should create basic error entry', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.id).toBe('err-789_error');
      expect(result.type).toBe('network');
      expect(result.subtype).toBe('error');
      expect(result.level).toBe('error');
      expect(result.error.name).toBe('TimeoutError');
      expect(result.error.message).toBe('Network timeout');
    });

    it('should calculate timing correctly', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.timing.start).toBe(3000);
      expect(result.timing.end).toBe(3500);
      expect(result.timing.duration).toBe(500);
      expect(result.timing.durationMs).toBe(500);
    });

    it('should include error details', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.error.requestId).toBe('err-789');
      expect(result.error.stack).toBe(mockError.stack);
      expect(result.error.url).toBe(timing.url);
      expect(result.error.method).toBe(timing.method);
      expect(result.error.timestamp).toBe(timing.endTime);
    });

    it('should include application context', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.application).toEqual({
        name: 'test-app',
        sessionId: 'test-session',
        environment: 'test',
        developer: 'test-dev',
        branch: 'test-branch',
      });
    });

    it('should include network analysis when enabled', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.analysis).toEqual({ error: 'network-failure' });
      expect(mockAnalyzer.analyzeNetworkError).toHaveBeenCalledWith(
        mockError,
        timing
      );
    });

    it('should exclude network analysis when disabled', () => {
      formatter.options.enableNetworkAnalysis = false;
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.analysis).toBeNull();
      expect(mockAnalyzer.analyzeNetworkError).not.toHaveBeenCalled();
    });

    it('should handle missing navigator', () => {
      delete global.navigator;
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.metadata.userAgent).toBe('Unknown');
    });

    it('should include error analyzer results', () => {
      const result = formatter.createErrorEntry('err-789', mockError, timing);

      expect(result.category).toBe('network-error');
      expect(result.severity).toBe('high');
      expect(result.tags).toEqual(['error', 'network']);
      expect(mockAnalyzer.categorizeNetworkError).toHaveBeenCalledWith(
        mockError,
        timing
      );
      expect(mockAnalyzer.calculateErrorSeverity).toHaveBeenCalledWith(
        mockError,
        timing
      );
      expect(mockAnalyzer.generateErrorTags).toHaveBeenCalledWith(
        mockError,
        timing
      );
    });
  });
});
