/* eslint-env node */
/**
 * HttpTransport - HTTP transport layer for Console Log Pipe
 *
 * Handles batch processing, retry logic, compression, and auto-discovery
 * of local server for efficient log transmission.
 */

class HttpTransport {
  constructor(options = {}) {
    this.options = {
      // Server configuration
      serverHost: options.serverHost || 'localhost',
      serverPort: options.serverPort || 3001,
      serverPath: options.serverPath || '/api/logs',

      // Batch processing
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 1000, // 1 second
      maxBatchSize: options.maxBatchSize || 100,

      // Retry configuration
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      retryBackoffMultiplier: options.retryBackoffMultiplier || 2,
      maxRetryDelay: options.maxRetryDelay || 30000, // 30 seconds

      // Compression
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB

      // Connection health
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      connectionTimeout: options.connectionTimeout || 5000, // 5 seconds

      // Auto-discovery
      enableAutoDiscovery: options.enableAutoDiscovery !== false,
      discoveryPorts: options.discoveryPorts || [3001, 3002, 3003, 3004, 3005],

      // Application context
      applicationName: options.applicationName,
      sessionId: options.sessionId,

      ...options,
    };

    // State management
    this.isConnected = false;
    this.isHealthy = false;
    this.batch = [];
    this.batchTimer = null;
    this.retryQueue = [];
    this.healthCheckTimer = null;
    this.discoveredEndpoint = null;

    // Statistics
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      totalRetries: 0,
      averageLatency: 0,
      lastSuccessTime: null,
      lastFailureTime: null,
    };

    // Bind methods
    this.send = this.send.bind(this);
    this.flush = this.flush.bind(this);
    this._processBatch = this._processBatch.bind(this);
    this._healthCheck = this._healthCheck.bind(this);
  }

  /**
   * Initialize the transport
   */
  async initialize() {
    if (this.options.enableAutoDiscovery) {
      await this._discoverServer();
    }

    this._startHealthCheck();
    return this.isConnected;
  }

  /**
   * Send a log entry
   * @param {Object} logEntry - The log entry to send
   */
  send(logEntry) {
    if (!logEntry) {
      return;
    }

    // Add to batch
    this.batch.push({
      ...logEntry,
      transportTimestamp: Date.now(),
    });

    // Process batch if it reaches the size limit
    if (this.batch.length >= this.options.batchSize) {
      this._processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch timeout
      this.batchTimer = setTimeout(() => {
        this._processBatch();
      }, this.options.batchTimeout);
    }
  }

  /**
   * Flush all pending logs immediately
   */
  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batch.length > 0) {
      await this._processBatch();
    }

    // Process retry queue
    await this._processRetryQueue();
  }

  /**
   * Destroy the transport and clean up resources
   */
  destroy() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.batch = [];
    this.retryQueue = [];
    this.isConnected = false;
    this.isHealthy = false;
  }

  /**
   * Get transport statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Process the current batch
   */
  async _processBatch() {
    if (this.batch.length === 0) {
      return;
    }

    const batchToSend = this.batch.splice(0, this.options.maxBatchSize);

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await this._sendBatch(batchToSend);
      this.stats.totalSent += batchToSend.length;
      this.stats.lastSuccessTime = Date.now();
      this.isHealthy = true;
    } catch (error) {
      this.stats.totalFailed += batchToSend.length;
      this.stats.lastFailureTime = Date.now();
      this.isHealthy = false;

      // Add to retry queue
      this.retryQueue.push({
        batch: batchToSend,
        retryCount: 0,
        nextRetryTime: Date.now() + this.options.retryDelay,
      });
    }
  }

  /**
   * Send a batch of logs to the server
   */
  async _sendBatch(batch) {
    const startTime = Date.now();
    const endpoint = this.discoveredEndpoint || this._getDefaultEndpoint();

    let payload = JSON.stringify({
      logs: batch,
      metadata: {
        applicationName: this.options.applicationName,
        sessionId: this.options.sessionId,
        timestamp: Date.now(),
        batchSize: batch.length,
      },
    });

    // Compress if enabled and payload is large enough
    if (
      this.options.enableCompression &&
      payload.length > this.options.compressionThreshold
    ) {
      payload = await this._compress(payload);
    }

    const response = await this._makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Name': this.options.applicationName,
        'X-Session-Id': this.options.sessionId,
        ...(this.options.enableCompression &&
        payload.length > this.options.compressionThreshold
          ? {
              'Content-Encoding': 'gzip',
            }
          : {}),
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update latency statistics
    const latency = Date.now() - startTime;
    this.stats.averageLatency =
      this.stats.averageLatency === 0
        ? latency
        : (this.stats.averageLatency + latency) / 2;
  }

  /**
   * Make an HTTP request with timeout
   */
  async _makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.connectionTimeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Compress payload using gzip (browser-compatible)
   */
  async _compress(data) {
    // In browser environment, we'll use CompressionStream if available
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(data));
      writer.close();

      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      return new Uint8Array(
        chunks.reduce((acc, chunk) => [...acc, ...chunk], [])
      );
    }

    // Fallback: return original data if compression not available
    return data;
  }

  /**
   * Discover the server endpoint
   */
  async _discoverServer() {
    for (const port of this.options.discoveryPorts) {
      try {
        const endpoint = `http://${this.options.serverHost}:${port}/api/health`;
        const response = await this._makeRequest(endpoint, { method: 'GET' });

        if (response.ok) {
          this.discoveredEndpoint = `http://${this.options.serverHost}:${port}${this.options.serverPath}`;
          this.isConnected = true;
          this.isHealthy = true;
          return;
        }
      } catch (error) {
        // Continue to next port
      }
    }

    // If no server discovered, use default
    this.discoveredEndpoint = this._getDefaultEndpoint();
    this.isConnected = false;
  }

  /**
   * Get the default endpoint
   */
  _getDefaultEndpoint() {
    return `http://${this.options.serverHost}:${this.options.serverPort}${this.options.serverPath}`;
  }

  /**
   * Start health check timer
   */
  _startHealthCheck() {
    this.healthCheckTimer = setInterval(
      this._healthCheck,
      this.options.healthCheckInterval
    );
  }

  /**
   * Perform health check
   */
  async _healthCheck() {
    try {
      const endpoint = this.discoveredEndpoint || this._getDefaultEndpoint();
      const healthEndpoint = endpoint.replace('/api/logs', '/api/health');

      const response = await this._makeRequest(healthEndpoint, {
        method: 'GET',
      });
      this.isHealthy = response.ok;
      this.isConnected = response.ok;
    } catch (error) {
      this.isHealthy = false;
      this.isConnected = false;
    }
  }

  /**
   * Process retry queue
   */
  async _processRetryQueue() {
    const now = Date.now();
    const itemsToRetry = this.retryQueue.filter(
      item => item.nextRetryTime <= now
    );

    for (const item of itemsToRetry) {
      if (item.retryCount >= this.options.maxRetries) {
        // Remove from queue - max retries exceeded
        this.retryQueue = this.retryQueue.filter(i => i !== item);
        continue;
      }

      try {
        await this._sendBatch(item.batch);
        this.stats.totalSent += item.batch.length;
        this.stats.totalRetries += item.retryCount + 1;
        this.stats.lastSuccessTime = Date.now();

        // Remove from retry queue
        this.retryQueue = this.retryQueue.filter(i => i !== item);
      } catch (error) {
        // Update retry info
        item.retryCount++;
        const delay = Math.min(
          this.options.retryDelay *
            Math.pow(this.options.retryBackoffMultiplier, item.retryCount),
          this.options.maxRetryDelay
        );
        item.nextRetryTime = now + delay;
        this.stats.totalRetries++;
      }
    }
  }
}

module.exports = HttpTransport;
