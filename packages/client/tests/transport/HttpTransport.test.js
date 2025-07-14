/**
 * HttpTransport Tests
 *
 * Comprehensive test suite for HTTP transport layer functionality
 */

const HttpTransport = require('../../src/transport/HttpTransport');

// Mock fetch globally
global.fetch = jest.fn();
global.CompressionStream = jest.fn();
global.TextEncoder = jest.fn(() => ({
  encode: jest.fn(data => new Uint8Array(Buffer.from(data))),
}));

describe('HttpTransport', () => {
  let transport;
  let mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockFetch = global.fetch;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    transport = new HttpTransport({
      applicationName: 'test-app',
      sessionId: 'test-session-123',
      batchSize: 3,
      batchTimeout: 1000,
      maxRetries: 2,
      retryDelay: 500,
    });
  });

  afterEach(() => {
    if (transport) {
      transport.destroy();
    }
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultTransport = new HttpTransport();

      expect(defaultTransport.options.serverHost).toBe('localhost');
      expect(defaultTransport.options.serverPort).toBe(3001);
      expect(defaultTransport.options.batchSize).toBe(10);
      expect(defaultTransport.options.maxRetries).toBe(3);
      expect(defaultTransport.options.enableCompression).toBe(true);
    });

    it('should merge custom options', () => {
      const customTransport = new HttpTransport({
        serverHost: 'custom-host',
        serverPort: 4000,
        batchSize: 5,
        enableCompression: false,
      });

      expect(customTransport.options.serverHost).toBe('custom-host');
      expect(customTransport.options.serverPort).toBe(4000);
      expect(customTransport.options.batchSize).toBe(5);
      expect(customTransport.options.enableCompression).toBe(false);
    });

    it('should initialize state correctly', () => {
      expect(transport.isConnected).toBe(false);
      expect(transport.isHealthy).toBe(false);
      expect(transport.batch).toEqual([]);
      expect(transport.retryQueue).toEqual([]);
      expect(transport.stats.totalSent).toBe(0);
    });
  });

  describe('send', () => {
    it('should add log entry to batch', () => {
      const logEntry = { level: 'info', message: 'test log' };

      transport.send(logEntry);

      expect(transport.batch).toHaveLength(1);
      expect(transport.batch[0]).toMatchObject(logEntry);
      expect(transport.batch[0].transportTimestamp).toBeDefined();
    });

    it('should ignore null/undefined entries', () => {
      transport.send(null);
      transport.send(undefined);

      expect(transport.batch).toHaveLength(0);
    });

    it('should process batch when size limit reached', async () => {
      const spy = jest.spyOn(transport, '_processBatch');

      // Send 3 logs (batch size is 3)
      transport.send({ message: 'log 1' });
      transport.send({ message: 'log 2' });
      transport.send({ message: 'log 3' });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should set batch timer when not at size limit', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      transport.send({ message: 'log 1' });

      expect(transport.batchTimer).toBeDefined();
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      setTimeoutSpy.mockRestore();
    });
  });

  describe('flush', () => {
    it('should process current batch immediately', async () => {
      transport.send({ message: 'log 1' });
      transport.send({ message: 'log 2' });

      expect(transport.batch).toHaveLength(2);

      await transport.flush();

      expect(transport.batch).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should clear batch timer', async () => {
      transport.send({ message: 'log 1' });

      expect(transport.batchTimer).toBeDefined();

      await transport.flush();

      expect(transport.batchTimer).toBeNull();
    });

    it('should process retry queue', async () => {
      const spy = jest.spyOn(transport, '_processRetryQueue');

      await transport.flush();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_processBatch', () => {
    it('should send batch to server', async () => {
      transport.batch = [{ message: 'log 1' }, { message: 'log 2' }];

      await transport._processBatch();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Application-Name': 'test-app',
            'X-Session-Id': 'test-session-123',
          }),
          body: expect.stringContaining('"logs"'),
        })
      );
    });

    it('should update success statistics', async () => {
      transport.batch = [{ message: 'log 1' }];

      await transport._processBatch();

      expect(transport.stats.totalSent).toBe(1);
      expect(transport.stats.lastSuccessTime).toBeDefined();
      expect(transport.isHealthy).toBe(true);
    });

    it('should handle send failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      transport.batch = [{ message: 'log 1' }];

      await transport._processBatch();

      expect(transport.stats.totalFailed).toBe(1);
      expect(transport.stats.lastFailureTime).toBeDefined();
      expect(transport.isHealthy).toBe(false);
      expect(transport.retryQueue).toHaveLength(1);
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      transport.batch = [{ message: 'log 1' }];

      await transport._processBatch();

      expect(transport.stats.totalFailed).toBe(1);
      expect(transport.retryQueue).toHaveLength(1);
    });
  });

  describe('_makeRequest', () => {
    it('should make request with timeout', async () => {
      const mockController = {
        abort: jest.fn(),
        signal: 'mock-signal',
      };
      global.AbortController = jest.fn(() => mockController);

      await transport._makeRequest('http://test.com', { method: 'GET' });

      expect(mockFetch).toHaveBeenCalledWith('http://test.com', {
        method: 'GET',
        signal: 'mock-signal',
      });
    });

    it('should abort request on timeout', async () => {
      const mockController = {
        abort: jest.fn(),
        signal: 'mock-signal',
      };
      global.AbortController = jest.fn(() => mockController);

      const promise = transport._makeRequest('http://test.com', {
        method: 'GET',
      });

      // Fast-forward past timeout
      jest.advanceTimersByTime(6000);

      await promise;

      expect(mockController.abort).toHaveBeenCalled();
    });
  });

  describe('_discoverServer', () => {
    it('should discover available server', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Port 3001 not available'))
        .mockResolvedValueOnce({ ok: true });

      await transport._discoverServer();

      expect(transport.discoveredEndpoint).toBe(
        'http://localhost:3002/api/logs'
      );
      expect(transport.isConnected).toBe(true);
      expect(transport.isHealthy).toBe(true);
    });

    it('should fallback to default if no server found', async () => {
      mockFetch.mockRejectedValue(new Error('No servers available'));

      await transport._discoverServer();

      expect(transport.discoveredEndpoint).toBe(
        'http://localhost:3001/api/logs'
      );
      expect(transport.isConnected).toBe(false);
    });
  });

  describe('_healthCheck', () => {
    it('should update health status on success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await transport._healthCheck();

      expect(transport.isHealthy).toBe(true);
      expect(transport.isConnected).toBe(true);
    });

    it('should update health status on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Health check failed'));

      await transport._healthCheck();

      expect(transport.isHealthy).toBe(false);
      expect(transport.isConnected).toBe(false);
    });
  });

  describe('_processRetryQueue', () => {
    beforeEach(() => {
      // Add item to retry queue
      transport.retryQueue.push({
        batch: [{ message: 'retry log' }],
        retryCount: 0,
        nextRetryTime: Date.now() - 1000, // Past time, ready for retry
      });
    });

    it('should retry failed batches', async () => {
      await transport._processRetryQueue();

      expect(mockFetch).toHaveBeenCalled();
      expect(transport.retryQueue).toHaveLength(0);
      expect(transport.stats.totalRetries).toBe(1);
    });

    it('should remove items after max retries', async () => {
      transport.retryQueue[0].retryCount = 2; // At max retries

      await transport._processRetryQueue();

      expect(transport.retryQueue).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should update retry count and delay on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Retry failed'));

      await transport._processRetryQueue();

      expect(transport.retryQueue).toHaveLength(1);
      expect(transport.retryQueue[0].retryCount).toBe(1);
      expect(transport.retryQueue[0].nextRetryTime).toBeGreaterThan(Date.now());
    });

    it('should not retry items not ready yet', async () => {
      transport.retryQueue[0].nextRetryTime = Date.now() + 10000; // Future time

      await transport._processRetryQueue();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(transport.retryQueue).toHaveLength(1);
    });
  });

  describe('compression', () => {
    it('should compress large payloads when enabled', async () => {
      const mockStream = {
        writable: {
          getWriter: () => ({
            write: jest.fn(),
            close: jest.fn(),
          }),
        },
        readable: {
          getReader: () => ({
            read: jest
              .fn()
              .mockResolvedValueOnce({
                value: new Uint8Array([1, 2, 3]),
                done: false,
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      global.CompressionStream = jest.fn(() => mockStream);

      const result = await transport._compress('large data payload');

      expect(global.CompressionStream).toHaveBeenCalledWith('gzip');
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should fallback to original data if compression unavailable', async () => {
      global.CompressionStream = undefined;

      const data = 'test data';
      const result = await transport._compress(data);

      expect(result).toBe(data);
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      transport.send({ message: 'test' });
      transport.retryQueue.push({ batch: [], retryCount: 0 });

      transport.destroy();

      expect(transport.batch).toEqual([]);
      expect(transport.retryQueue).toEqual([]);
      expect(transport.batchTimer).toBeNull();
      expect(transport.healthCheckTimer).toBeNull();
      expect(transport.isConnected).toBe(false);
      expect(transport.isHealthy).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return copy of statistics', () => {
      transport.stats.totalSent = 10;
      transport.stats.totalFailed = 2;

      const stats = transport.getStats();

      expect(stats.totalSent).toBe(10);
      expect(stats.totalFailed).toBe(2);

      // Verify it's a copy
      stats.totalSent = 20;
      expect(transport.stats.totalSent).toBe(10);
    });
  });

  describe('initialize', () => {
    it('should discover server and start health check', async () => {
      const discoverSpy = jest
        .spyOn(transport, '_discoverServer')
        .mockResolvedValue();
      const healthSpy = jest.spyOn(transport, '_startHealthCheck');

      await transport.initialize();

      expect(discoverSpy).toHaveBeenCalled();
      expect(healthSpy).toHaveBeenCalled();
    });

    it('should skip discovery if disabled', async () => {
      transport.options.enableAutoDiscovery = false;
      const discoverSpy = jest.spyOn(transport, '_discoverServer');
      const healthSpy = jest.spyOn(transport, '_startHealthCheck');

      await transport.initialize();

      expect(discoverSpy).not.toHaveBeenCalled();
      expect(healthSpy).toHaveBeenCalled();
    });
  });
});
