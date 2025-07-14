/**
 * NetworkSanitizer Tests
 */

const NetworkSanitizer = require('../../../src/core/network/NetworkSanitizer');

describe('NetworkSanitizer', () => {
  let sanitizer;

  beforeEach(() => {
    sanitizer = new NetworkSanitizer();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(sanitizer.options.captureHeaders).toBe(true);
      expect(sanitizer.options.maxBodySize).toBe(50 * 1024);
      expect(sanitizer.options.maxHeaderSize).toBe(10 * 1024);
      expect(sanitizer.options.sensitiveHeaders).toContain('authorization');
    });

    it('should accept custom options', () => {
      const customSanitizer = new NetworkSanitizer({
        captureHeaders: false,
        maxBodySize: 100 * 1024,
        maxHeaderSize: 20 * 1024,
        sensitiveHeaders: ['custom-header'],
      });

      expect(customSanitizer.options.captureHeaders).toBe(false);
      expect(customSanitizer.options.maxBodySize).toBe(100 * 1024);
      expect(customSanitizer.options.maxHeaderSize).toBe(20 * 1024);
      expect(customSanitizer.options.sensitiveHeaders).toEqual([
        'custom-header',
      ]);
    });
  });

  describe('sanitizeHeaders', () => {
    it('should return empty object when captureHeaders is false', () => {
      const result = sanitizer.sanitizeHeaders(
        { 'content-type': 'application/json' },
        { captureHeaders: false }
      );
      expect(result).toEqual({});
    });

    it('should sanitize sensitive headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-token',
        'X-API-Key': 'api-key-123',
        Cookie: 'session=abc123',
      };

      const result = sanitizer.sanitizeHeaders(headers);

      expect(result['Content-Type']).toBe('application/json');
      expect(result['Authorization']).toBe('[REDACTED]');
      expect(result['X-API-Key']).toBe('[REDACTED]');
      expect(result['Cookie']).toBe('[REDACTED]');
    });

    it('should handle Headers object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-token',
      });

      const result = sanitizer.sanitizeHeaders(headers);

      expect(result['content-type']).toBe('application/json');
      expect(result['authorization']).toBe('[REDACTED]');
    });

    it('should truncate long header values', () => {
      const longValue = 'x'.repeat(15000);
      const headers = { 'Long-Header': longValue };

      const result = sanitizer.sanitizeHeaders(headers);

      expect(result['Long-Header']).toContain('...[TRUNCATED]');
      expect(result['Long-Header'].length).toBeLessThan(longValue.length);
    });

    it('should handle null/undefined headers', () => {
      expect(sanitizer.sanitizeHeaders(null)).toEqual({});
      expect(sanitizer.sanitizeHeaders(undefined)).toEqual({});
    });

    it('should be case insensitive for sensitive headers', () => {
      const headers = {
        AUTHORIZATION: 'Bearer token',
        'x-api-key': 'key123',
        'Set-Cookie': 'session=abc',
      };

      const result = sanitizer.sanitizeHeaders(headers);

      expect(result['AUTHORIZATION']).toBe('[REDACTED]');
      expect(result['x-api-key']).toBe('[REDACTED]');
      expect(result['Set-Cookie']).toBe('[REDACTED]');
    });
  });

  describe('sanitizeBody', () => {
    it('should return null for null/undefined body', () => {
      expect(sanitizer.sanitizeBody(null)).toBeNull();
      expect(sanitizer.sanitizeBody(undefined)).toBeNull();
    });

    it('should handle string body', () => {
      const body = 'test string body';
      const result = sanitizer.sanitizeBody(body);
      expect(result).toBe(body);
    });

    it('should handle JSON object body', () => {
      const body = { key: 'value', number: 123 };
      const result = sanitizer.sanitizeBody(body);
      expect(result).toBe('{"key":"value","number":123}');
    });

    it('should handle FormData body', () => {
      const formData = new FormData();
      formData.append('field1', 'value1');
      formData.append('field2', 'value2');

      const result = sanitizer.sanitizeBody(formData);
      expect(result).toContain('FormData:');
      expect(result).toContain('field1=value1');
      expect(result).toContain('field2=value2');
    });

    it('should handle empty FormData', () => {
      const formData = new FormData();
      const result = sanitizer.sanitizeBody(formData);
      expect(result).toBe('[FormData]');
    });

    it('should handle ArrayBuffer body', () => {
      const buffer = new ArrayBuffer(1024);
      const result = sanitizer.sanitizeBody(buffer);
      expect(result).toBe('[ArrayBuffer: 1024 bytes]');
    });

    it('should handle Blob body', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const result = sanitizer.sanitizeBody(blob);
      expect(result).toContain('[Blob:');
      expect(result).toContain('type: text/plain');
    });

    it('should truncate large body content', () => {
      const largeBody = 'x'.repeat(60000);
      const result = sanitizer.sanitizeBody(largeBody);
      expect(result).toContain('...[TRUNCATED]');
      expect(result.length).toBeLessThan(largeBody.length);
    });

    it('should handle unserializable objects', () => {
      const circular = {};
      circular.self = circular;

      const result = sanitizer.sanitizeBody(circular);
      expect(result).toContain('[Unserializable body:');
    });
  });

  describe('sanitizeUrl', () => {
    it('should sanitize sensitive URL parameters', () => {
      const url =
        'https://api.example.com/users?token=secret123&key=apikey&name=john';
      const result = sanitizer.sanitizeUrl(url);

      expect(result).toContain('token=%5BREDACTED%5D'); // URL encoded [REDACTED]
      expect(result).toContain('key=%5BREDACTED%5D');
      expect(result).toContain('name=john');
    });

    it('should handle URLs without query parameters', () => {
      const url = 'https://api.example.com/users';
      const result = sanitizer.sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should handle invalid URLs', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = sanitizer.sanitizeUrl(invalidUrl);
      // Our mock URL constructor handles this differently
      expect(result).toContain('not-a-valid-url');
    });

    it('should sanitize all sensitive parameter types', () => {
      const url =
        'https://api.example.com/data?password=secret&secret=key&auth=token';
      const result = sanitizer.sanitizeUrl(url);

      expect(result).toContain('password=%5BREDACTED%5D');
      expect(result).toContain('secret=%5BREDACTED%5D');
      expect(result).toContain('auth=%5BREDACTED%5D');
    });
  });

  describe('sanitizeError', () => {
    it('should return null for null/undefined error', () => {
      expect(sanitizer.sanitizeError(null)).toBeNull();
      expect(sanitizer.sanitizeError(undefined)).toBeNull();
    });

    it('should sanitize basic error properties', () => {
      const error = new Error('Test error message');
      error.name = 'TestError';

      const result = sanitizer.sanitizeError(error);

      expect(result.name).toBe('TestError');
      expect(result.message).toBe('Test error message');
      expect(result.type).toBe('Error');
    });

    it('should include truncated stack trace', () => {
      const error = new Error('Test error');
      // Create a long stack trace
      error.stack = Array(20).fill('at function (file.js:1:1)').join('\n');

      const result = sanitizer.sanitizeError(error);

      expect(result.stack).toBeDefined();
      expect(result.stack.split('\n').length).toBeLessThanOrEqual(10);
    });

    it('should handle error without stack', () => {
      const error = { name: 'CustomError', message: 'Custom message' };
      const result = sanitizer.sanitizeError(error);

      expect(result.name).toBe('CustomError');
      expect(result.message).toBe('Custom message');
      expect(result.stack).toBeUndefined();
    });

    it('should handle error with missing properties', () => {
      const error = {};
      const result = sanitizer.sanitizeError(error);

      expect(result.name).toBe('Error');
      expect(result.message).toBe('Unknown error');
      expect(result.type).toBe('Object');
    });
  });

  describe('sanitizeRequestData', () => {
    it('should sanitize all request data components', () => {
      const requestData = {
        url: 'https://api.example.com/users?token=secret',
        headers: { Authorization: 'Bearer token123' },
        body: { username: 'john', password: 'secret' },
        method: 'POST',
      };

      const result = sanitizer.sanitizeRequestData(requestData);

      expect(result.url).toContain('token=%5BREDACTED%5D');
      expect(result.headers['Authorization']).toBe('[REDACTED]');
      expect(result.body).toContain('username');
      expect(result.method).toBe('POST');
    });
  });

  describe('sanitizeResponseData', () => {
    it('should sanitize response headers and body', () => {
      const responseData = {
        headers: { 'Set-Cookie': 'session=abc123' },
        body: { data: 'response data' },
        status: 200,
      };

      const result = sanitizer.sanitizeResponseData(responseData);

      expect(result.headers['Set-Cookie']).toBe('[REDACTED]');
      expect(result.body).toContain('response data');
      expect(result.status).toBe(200);
    });
  });
});
