/**
 * NetworkInterceptor - Handle fetch and XMLHttpRequest interception
 */

const NetworkUtils = require('./NetworkUtils');

class NetworkInterceptor {
  constructor(options = {}, formatter, onNetworkData) {
    this.options = options;
    this.formatter = formatter;
    this.onNetworkData = onNetworkData;

    // Store original methods
    this.originalFetch = null;
    this.originalXHROpen = null;
    this.originalXHRSend = null;

    // Track active requests
    this.activeRequests = new Map();
  }

  /**
   * Setup network interception for fetch and XMLHttpRequest
   */
  setupInterception() {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }

    // Intercept fetch API
    if (this.options.captureFetch && typeof window.fetch === 'function') {
      this.setupFetchInterception();
    }

    // Intercept XMLHttpRequest
    if (
      this.options.captureXHR &&
      typeof window.XMLHttpRequest === 'function'
    ) {
      this.setupXHRInterception();
    }
  }

  /**
   * Setup fetch API interception
   */
  setupFetchInterception() {
    this.originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const requestId = NetworkUtils.generateRequestId();
      const startTime = performance.now();

      try {
        // Parse request details
        const url = typeof input === 'string' ? input : input.url;
        const method = init.method || 'GET';

        // Check if URL should be captured
        if (!NetworkUtils.shouldCaptureUrl(url, this.options)) {
          return this.originalFetch.call(window, input, init);
        }

        // Capture request
        const requestData = this.formatter.createRequestEntry(requestId, {
          url,
          method,
          headers: init.headers || {},
          body: init.body,
          type: 'fetch',
          startTime,
        });

        this.onNetworkData(requestData);
        this.activeRequests.set(requestId, { startTime, url, method });

        // Make the actual request
        const response = await this.originalFetch.call(window, input, init);

        // Capture response
        const endTime = performance.now();
        const responseData = await this.formatter.createResponseEntry(
          requestId,
          response,
          {
            startTime,
            endTime,
            url,
            method,
          }
        );

        this.onNetworkData(responseData);
        this.activeRequests.delete(requestId);

        return response;
      } catch (error) {
        // Capture error
        const endTime = performance.now();
        const errorData = this.formatter.createErrorEntry(requestId, error, {
          startTime,
          endTime,
          url: typeof input === 'string' ? input : input.url,
          method: init.method || 'GET',
        });

        this.onNetworkData(errorData);
        this.activeRequests.delete(requestId);

        throw error;
      }
    };
  }

  /**
   * Setup XMLHttpRequest interception
   */
  setupXHRInterception() {
    const self = this;

    // Store original methods
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    // Override open method
    XMLHttpRequest.prototype.open = function (method, url, async = true) {
      // Store network capture metadata on the XHR instance
      this._networkCapture = {
        requestId: NetworkUtils.generateRequestId(),
        method,
        url,
        async,
        startTime: null,
      };

      return self.originalXHROpen.call(
        this,
        method,
        url,
        async,
        arguments[3],
        arguments[4]
      );
    };

    // Override send method
    XMLHttpRequest.prototype.send = function (body) {
      if (!this._networkCapture) {
        return self.originalXHRSend.call(this, body);
      }

      const { requestId, method, url } = this._networkCapture;

      // Check if URL should be captured
      if (!NetworkUtils.shouldCaptureUrl(url, self.options)) {
        return self.originalXHRSend.call(this, body);
      }

      const startTime = performance.now();
      this._networkCapture.startTime = startTime;

      // Capture request
      const requestData = self.formatter.createRequestEntry(requestId, {
        url,
        method,
        headers: NetworkUtils.getXHRHeaders(this),
        body,
        type: 'xhr',
        startTime,
      });

      self.onNetworkData(requestData);
      self.activeRequests.set(requestId, { startTime, url, method });

      // Setup response handlers
      const originalOnReadyStateChange = this.onreadystatechange;

      this.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          const endTime = performance.now();

          try {
            const responseData = self.formatter.createXHRResponseEntry(
              requestId,
              this,
              {
                startTime,
                endTime,
                url,
                method,
              }
            );

            self.onNetworkData(responseData);
          } catch (error) {
            const errorData = self.formatter.createErrorEntry(
              requestId,
              error,
              {
                startTime,
                endTime,
                url,
                method,
              }
            );

            self.onNetworkData(errorData);
          }

          self.activeRequests.delete(requestId);
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this);
        }
      };

      return self.originalXHRSend.call(this, body);
    };
  }

  /**
   * Restore original network methods
   */
  restoreOriginalMethods() {
    if (typeof window === 'undefined') {
      return;
    }

    // Restore fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // Restore XMLHttpRequest
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }

    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }
  }
}

// Export for both CommonJS and ES modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = NetworkInterceptor;
}
