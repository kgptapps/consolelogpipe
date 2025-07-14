/**
 * NetworkAnalyzer Tests
 */

const NetworkAnalyzer = require('../../../src/core/network/NetworkAnalyzer');

describe('NetworkAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new NetworkAnalyzer({
      environment: 'test',
      branch: 'test-branch',
      enableNetworkAnalysis: true,
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultAnalyzer = new NetworkAnalyzer();

      expect(defaultAnalyzer.options.environment).toBe('development');
      expect(defaultAnalyzer.options.branch).toBeUndefined();
      expect(defaultAnalyzer.options.enableNetworkAnalysis).toBe(true);
    });

    it('should initialize with custom options', () => {
      const customAnalyzer = new NetworkAnalyzer({
        environment: 'production',
        branch: 'main',
        enableNetworkAnalysis: false,
      });

      expect(customAnalyzer.options.environment).toBe('production');
      expect(customAnalyzer.options.branch).toBe('main');
      expect(customAnalyzer.options.enableNetworkAnalysis).toBe(false);
    });
  });

  describe('categorizeRequest', () => {
    it('should categorize GraphQL requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://api.example.com/graphql',
          method: 'POST',
        })
      ).toBe('GraphQL Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/query',
          method: 'POST',
        })
      ).toBe('GraphQL Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/GRAPHQL',
          method: 'GET',
        })
      ).toBe('GraphQL Request');
    });

    it('should categorize API requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/api/users',
          method: 'GET',
        })
      ).toBe('API Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/v1/posts',
          method: 'POST',
        })
      ).toBe('API Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/v2/comments',
          method: 'PUT',
        })
      ).toBe('API Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://api.example.com/data',
          method: 'GET',
        })
      ).toBe('API Request');

      expect(
        analyzer.categorizeRequest({
          url: 'https://service.api.example.com/endpoint',
          method: 'DELETE',
        })
      ).toBe('API Request');
    });

    it('should categorize static assets', () => {
      const staticExtensions = [
        'js',
        'css',
        'png',
        'jpg',
        'jpeg',
        'gif',
        'svg',
        'ico',
        'woff',
        'woff2',
        'ttf',
      ];

      staticExtensions.forEach(ext => {
        expect(
          analyzer.categorizeRequest({
            url: `https://example.com/assets/file.${ext}`,
            method: 'GET',
          })
        ).toBe('Static Asset');
      });
    });

    it('should categorize authentication requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/auth/login',
          method: 'POST',
        })
      ).toBe('Authentication');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/login',
          method: 'POST',
        })
      ).toBe('Authentication');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/token',
          method: 'POST',
        })
      ).toBe('Authentication');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/oauth',
          method: 'GET',
        })
      ).toBe('Authentication');
    });

    it('should categorize data fetch requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/data',
          method: 'GET',
        })
      ).toBe('Data Fetch');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/page',
          method: 'GET',
        })
      ).toBe('Data Fetch');
    });

    it('should categorize data mutation requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/create',
          method: 'POST',
        })
      ).toBe('Data Mutation');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/update',
          method: 'PUT',
        })
      ).toBe('Data Mutation');

      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/patch',
          method: 'PATCH',
        })
      ).toBe('Data Mutation');
    });

    it('should categorize data deletion requests', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/delete',
          method: 'DELETE',
        })
      ).toBe('Data Deletion');
    });

    it('should categorize HTTP requests as fallback', () => {
      expect(
        analyzer.categorizeRequest({
          url: 'https://example.com/unknown',
          method: 'OPTIONS',
        })
      ).toBe('HTTP Request');
    });
  });

  describe('categorizeResponse', () => {
    it('should categorize server errors', () => {
      expect(
        analyzer.categorizeResponse({
          status: 500,
          url: 'https://example.com/test',
        })
      ).toBe('Server Error');
      expect(
        analyzer.categorizeResponse({
          status: 502,
          url: 'https://example.com/test',
        })
      ).toBe('Server Error');
      expect(
        analyzer.categorizeResponse({
          status: 503,
          url: 'https://example.com/test',
        })
      ).toBe('Server Error');
    });

    it('should categorize client errors', () => {
      expect(
        analyzer.categorizeResponse({
          status: 400,
          url: 'https://example.com/test',
        })
      ).toBe('Client Error');
      expect(
        analyzer.categorizeResponse({
          status: 401,
          url: 'https://example.com/test',
        })
      ).toBe('Client Error');
      expect(
        analyzer.categorizeResponse({
          status: 404,
          url: 'https://example.com/test',
        })
      ).toBe('Client Error');
      expect(
        analyzer.categorizeResponse({
          status: 422,
          url: 'https://example.com/test',
        })
      ).toBe('Client Error');
    });

    it('should categorize redirects', () => {
      expect(
        analyzer.categorizeResponse({
          status: 300,
          url: 'https://example.com/test',
        })
      ).toBe('Redirect');
      expect(
        analyzer.categorizeResponse({
          status: 301,
          url: 'https://example.com/test',
        })
      ).toBe('Redirect');
      expect(
        analyzer.categorizeResponse({
          status: 302,
          url: 'https://example.com/test',
        })
      ).toBe('Redirect');
    });

    it('should categorize API success responses', () => {
      expect(
        analyzer.categorizeResponse({
          status: 200,
          url: 'https://example.com/api/users',
        })
      ).toBe('API Success');
      expect(
        analyzer.categorizeResponse({
          status: 201,
          url: 'https://api.example.com/posts',
        })
      ).toBe('API Success');
      expect(
        analyzer.categorizeResponse({
          status: 204,
          url: 'https://service.api.example.com/data',
        })
      ).toBe('API Success');
    });

    it('should categorize general success responses', () => {
      expect(
        analyzer.categorizeResponse({
          status: 200,
          url: 'https://example.com/page',
        })
      ).toBe('Success');
      expect(
        analyzer.categorizeResponse({
          status: 201,
          url: 'https://example.com/upload',
        })
      ).toBe('Success');
    });

    it('should categorize unknown responses', () => {
      expect(
        analyzer.categorizeResponse({
          status: 100,
          url: 'https://example.com/test',
        })
      ).toBe('Unknown Response');
      expect(
        analyzer.categorizeResponse({
          status: 0,
          url: 'https://example.com/test',
        })
      ).toBe('Unknown Response');
    });
  });

  describe('categorizeXHRResponse', () => {
    const timing = { url: 'https://example.com/test' };

    it('should categorize XHR server errors', () => {
      expect(analyzer.categorizeXHRResponse({ status: 500 }, timing)).toBe(
        'Server Error'
      );
      expect(analyzer.categorizeXHRResponse({ status: 502 }, timing)).toBe(
        'Server Error'
      );
    });

    it('should categorize XHR client errors', () => {
      expect(analyzer.categorizeXHRResponse({ status: 400 }, timing)).toBe(
        'Client Error'
      );
      expect(analyzer.categorizeXHRResponse({ status: 404 }, timing)).toBe(
        'Client Error'
      );
    });

    it('should categorize XHR redirects', () => {
      expect(analyzer.categorizeXHRResponse({ status: 301 }, timing)).toBe(
        'Redirect'
      );
      expect(analyzer.categorizeXHRResponse({ status: 302 }, timing)).toBe(
        'Redirect'
      );
    });

    it('should categorize XHR API success responses', () => {
      expect(
        analyzer.categorizeXHRResponse(
          { status: 200 },
          { url: 'https://example.com/api/users' }
        )
      ).toBe('API Success');
      expect(
        analyzer.categorizeXHRResponse(
          { status: 201 },
          { url: 'https://api.example.com/posts' }
        )
      ).toBe('API Success');
      expect(
        analyzer.categorizeXHRResponse(
          { status: 204 },
          { url: 'https://service.api.example.com/data' }
        )
      ).toBe('API Success');
    });

    it('should categorize XHR general success responses', () => {
      expect(
        analyzer.categorizeXHRResponse(
          { status: 200 },
          { url: 'https://example.com/page' }
        )
      ).toBe('Success');
      expect(
        analyzer.categorizeXHRResponse(
          { status: 201 },
          { url: 'https://example.com/upload' }
        )
      ).toBe('Success');
    });

    it('should categorize XHR unknown responses', () => {
      expect(analyzer.categorizeXHRResponse({ status: 100 }, timing)).toBe(
        'Unknown Response'
      );
      expect(analyzer.categorizeXHRResponse({ status: 0 }, timing)).toBe(
        'Unknown Response'
      );
    });
  });

  describe('categorizeNetworkError', () => {
    const timing = { url: 'https://example.com/test' };

    it('should categorize timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      expect(analyzer.categorizeNetworkError(timeoutError, timing)).toBe(
        'Timeout Error'
      );

      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      expect(analyzer.categorizeNetworkError(abortError, timing)).toBe(
        'Request Aborted'
      );
    });

    it('should categorize fetch errors', () => {
      const fetchError = new Error('Failed to fetch');
      expect(analyzer.categorizeNetworkError(fetchError, timing)).toBe(
        'Fetch Error'
      );
    });

    it('should categorize CORS errors', () => {
      const corsError = new Error('CORS policy violation');
      expect(analyzer.categorizeNetworkError(corsError, timing)).toBe(
        'CORS Error'
      );

      const corsError2 = new Error('Cross-origin request blocked');
      expect(analyzer.categorizeNetworkError(corsError2, timing)).toBe(
        'Network Error'
      );
    });

    it('should categorize general network errors', () => {
      const unknownError = new Error('Something went wrong');
      expect(analyzer.categorizeNetworkError(unknownError, timing)).toBe(
        'Network Error'
      );
    });
  });

  describe('calculateResponseSeverity', () => {
    const timing = { url: 'https://example.com/test', duration: 100 };

    it('should calculate critical severity for server errors', () => {
      const result = analyzer.calculateResponseSeverity(
        { status: 500 },
        timing
      );
      expect(result.level).toBe('critical');
      expect(result.score).toBe(9);
      expect(result.factors).toContain('server-error');
    });

    it('should calculate medium severity for client errors', () => {
      const result = analyzer.calculateResponseSeverity(
        { status: 400 },
        timing
      );
      expect(result.level).toBe('medium');
      expect(result.score).toBe(6);
      expect(result.factors).toContain('client-error');
    });

    it('should calculate low severity for redirects', () => {
      const result = analyzer.calculateResponseSeverity(
        { status: 301 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(3);
      expect(result.factors).toContain('redirect');
    });

    it('should calculate low severity for success responses', () => {
      const result = analyzer.calculateResponseSeverity(
        { status: 200 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(1);
      expect(result.factors).toEqual([]);
    });

    it('should calculate high severity for slow responses', () => {
      const slowTiming = { url: 'https://example.com/test', duration: 6000 };
      const result = analyzer.calculateResponseSeverity(
        { status: 200 },
        slowTiming
      );
      expect(result.level).toBe('high');
      expect(result.score).toBe(7);
      expect(result.factors).toContain('slow-response');
    });

    it('should calculate low severity for unknown status', () => {
      const result = analyzer.calculateResponseSeverity(
        { status: 100 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(1);
    });
  });

  describe('calculateXHRResponseSeverity', () => {
    const timing = { url: 'https://example.com/test', duration: 100 };

    it('should calculate critical severity for XHR server errors', () => {
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 500 },
        timing
      );
      expect(result.level).toBe('critical');
      expect(result.score).toBe(9);
      expect(result.factors).toContain('server-error');
    });

    it('should calculate medium severity for XHR client errors', () => {
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 400 },
        timing
      );
      expect(result.level).toBe('medium');
      expect(result.score).toBe(6);
      expect(result.factors).toContain('client-error');
    });

    it('should calculate low severity for XHR redirects', () => {
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 300 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(3);
      expect(result.factors).toContain('redirect');
    });

    it('should calculate low severity for XHR success responses', () => {
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 200 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(1);
      expect(result.factors).toEqual([]);
    });

    it('should calculate high severity for slow XHR responses', () => {
      const slowTiming = { url: 'https://example.com/test', duration: 6000 };
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 200 },
        slowTiming
      );
      expect(result.level).toBe('high');
      expect(result.score).toBe(7);
      expect(result.factors).toContain('slow-response');
    });

    it('should calculate low severity for unknown XHR status', () => {
      const result = analyzer.calculateXHRResponseSeverity(
        { status: 0 },
        timing
      );
      expect(result.level).toBe('low');
      expect(result.score).toBe(1);
    });
  });

  describe('calculateErrorSeverity', () => {
    const timing = { url: 'https://example.com/test' };

    it('should calculate medium severity for timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const result = analyzer.calculateErrorSeverity(timeoutError, timing);
      expect(result.level).toBe('medium');
      expect(result.factors).toContain('network-failure');
      expect(result.factors).toContain('timeout');
    });

    it('should calculate high severity for network errors', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      const result = analyzer.calculateErrorSeverity(networkError, timing);
      expect(result.level).toBe('high');
      expect(result.factors).toContain('network-failure');
    });

    it('should calculate high severity for CORS errors', () => {
      const corsError = new Error('CORS policy violation');
      const result = analyzer.calculateErrorSeverity(corsError, timing);
      expect(result.level).toBe('high');
      expect(result.factors).toContain('network-failure');
      expect(result.factors).toContain('cors-issue');
    });

    it('should calculate high severity for general errors', () => {
      const unknownError = new Error('Something went wrong');
      const result = analyzer.calculateErrorSeverity(unknownError, timing);
      expect(result.level).toBe('high');
      expect(result.factors).toContain('network-failure');
    });
  });

  describe('generateRequestTags', () => {
    it('should generate tags for GraphQL requests', () => {
      const tags = analyzer.generateRequestTags({
        url: 'https://api.example.com/graphql',
        method: 'POST',
      });
      expect(tags).toContain('method-post');
      expect(tags).toContain('graphql');
      expect(tags).toContain('api');
    });

    it('should generate tags for API requests', () => {
      const tags = analyzer.generateRequestTags({
        url: 'https://example.com/api/users',
        method: 'GET',
      });
      expect(tags).toContain('method-get');
      expect(tags).toContain('api');
    });

    it('should generate tags for static assets', () => {
      const tags = analyzer.generateRequestTags({
        url: 'https://example.com/assets/style.css',
        method: 'GET',
      });
      expect(tags).toContain('method-get');
      expect(tags).toContain('asset');
      expect(tags).toContain('script-style');
    });

    it('should generate tags for authentication requests', () => {
      const tags = analyzer.generateRequestTags({
        url: 'https://example.com/auth/login',
        method: 'POST',
      });
      expect(tags).toContain('method-post');
      expect(tags).toContain('authentication');
    });

    it('should generate tags for data fetch requests', () => {
      const tags = analyzer.generateRequestTags({
        url: 'https://example.com/data',
        method: 'GET',
      });
      expect(tags).toContain('method-get');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });
  });

  describe('generateResponseTags', () => {
    const timing = { url: 'https://example.com/api/users', duration: 100 };

    it('should generate tags for successful responses', () => {
      const response = {
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };
      const tags = analyzer.generateResponseTags(response, timing);
      expect(tags).toContain('status-2xx');
      expect(tags).toContain('json');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });

    it('should generate tags for error responses', () => {
      const response = {
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
      };
      const tags = analyzer.generateResponseTags(response, timing);
      expect(tags).toContain('status-4xx');
      expect(tags).toContain('error');
      expect(tags).toContain('client-error');
      expect(tags).toContain('html');
    });

    it('should generate tags for slow responses', () => {
      const slowTiming = {
        url: 'https://example.com/api/users',
        duration: 6000,
      };
      const response = {
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };
      const tags = analyzer.generateResponseTags(response, slowTiming);
      expect(tags).toContain('status-2xx');
      expect(tags).toContain('slow');
      expect(tags).toContain('delayed');
    });

    it('should generate tags for API responses', () => {
      const apiTiming = { url: 'https://example.com/api/users', duration: 100 };
      const response = {
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };
      const tags = analyzer.generateResponseTags(response, apiTiming);
      expect(tags).toContain('status-2xx');
      expect(tags).toContain('json');
    });
  });

  describe('generateXHRResponseTags', () => {
    const timing = { url: 'https://example.com/api/posts', duration: 200 };

    it('should generate tags for XHR successful responses', () => {
      const xhr = {
        status: 201,
        getResponseHeader: jest.fn().mockReturnValue('application/json'),
      };
      const tags = analyzer.generateXHRResponseTags(xhr, timing);
      expect(tags).toContain('status-2xx');
      expect(tags).toContain('xhr');
      expect(tags).toContain('json');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });

    it('should generate tags for XHR error responses', () => {
      const xhr = {
        status: 500,
        getResponseHeader: jest.fn().mockReturnValue('text/html'),
      };
      const tags = analyzer.generateXHRResponseTags(xhr, timing);
      expect(tags).toContain('status-5xx');
      expect(tags).toContain('xhr');
      expect(tags).toContain('error');
      expect(tags).toContain('server-error');
      expect(tags).toContain('html');
    });

    it('should generate tags for slow XHR responses', () => {
      const slowTiming = {
        url: 'https://example.com/api/posts',
        duration: 8000,
      };
      const xhr = {
        status: 200,
        getResponseHeader: jest.fn().mockReturnValue('application/json'),
      };
      const tags = analyzer.generateXHRResponseTags(xhr, slowTiming);
      expect(tags).toContain('status-2xx');
      expect(tags).toContain('xhr');
      expect(tags).toContain('slow');
      expect(tags).toContain('delayed');
    });
  });

  describe('generateErrorTags', () => {
    const timing = { url: 'https://example.com/api/users' };

    it('should generate tags for timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const tags = analyzer.generateErrorTags(timeoutError, timing);
      expect(tags).toContain('error');
      expect(tags).toContain('timeout');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });

    it('should generate tags for network errors', () => {
      const networkError = new Error('Failed to fetch');
      const tags = analyzer.generateErrorTags(networkError, timing);
      expect(tags).toContain('error');
      expect(tags).toContain('fetch-error');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });

    it('should generate tags for CORS errors', () => {
      const corsError = new Error('CORS policy violation');
      const tags = analyzer.generateErrorTags(corsError, timing);
      expect(tags).toContain('error');
      expect(tags).toContain('cors');
      expect(tags).toContain('env-test');
      expect(tags).toContain('branch-test-branch');
    });
  });
});
