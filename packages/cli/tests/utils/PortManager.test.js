/**
 * PortManager Tests
 */

const net = require('net');
const PortManager = require('../../src/utils/PortManager');

// Mock net module
jest.mock('net');

describe('PortManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PortManager.reservedPorts.clear();
  });

  describe('getApplicationPort', () => {
    it('should return consistent port for same application name', () => {
      const port1 = PortManager.getApplicationPort('test-app');
      const port2 = PortManager.getApplicationPort('test-app');

      expect(port1).toBe(port2);
      expect(port1).toBeGreaterThanOrEqual(3001);
      expect(port1).toBeLessThanOrEqual(3100);
    });

    it('should return different ports for different application names', () => {
      const port1 = PortManager.getApplicationPort('app1');
      const port2 = PortManager.getApplicationPort('app2');

      expect(port1).not.toBe(port2);
    });

    it('should throw error for empty application name', () => {
      expect(() => PortManager.getApplicationPort('')).toThrow(
        'Application name is required'
      );
      expect(() => PortManager.getApplicationPort(null)).toThrow(
        'Application name is required'
      );
      expect(() => PortManager.getApplicationPort(undefined)).toThrow(
        'Application name is required'
      );
    });

    it('should handle special characters in application name', () => {
      const port1 = PortManager.getApplicationPort('app-with-dashes');
      const port2 = PortManager.getApplicationPort('app_with_underscores');
      const port3 = PortManager.getApplicationPort('app.with.dots');

      expect(port1).toBeGreaterThanOrEqual(3001);
      expect(port2).toBeGreaterThanOrEqual(3001);
      expect(port3).toBeGreaterThanOrEqual(3001);
    });

    it('should handle long application names', () => {
      const longName = 'a'.repeat(1000);
      const port = PortManager.getApplicationPort(longName);

      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3100);
    });

    it('should handle unicode characters in application name', () => {
      const port = PortManager.getApplicationPort('测试应用');

      expect(port).toBeGreaterThanOrEqual(3001);
      expect(port).toBeLessThanOrEqual(3100);
    });
  });

  describe('isPortAvailable', () => {
    it('should return true when port is available', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          callback();
        }),
        once: jest.fn((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
        close: jest.fn(),
      };

      net.createServer.mockReturnValue(mockServer);

      const result = await PortManager.isPortAvailable(3001);

      expect(result).toBe(true);
      expect(mockServer.listen).toHaveBeenCalledWith(
        3001,
        expect.any(Function)
      );
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should return false when port is not available', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          // Simulate port in use
        }),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            const error = new Error('Port in use');
            error.code = 'EADDRINUSE';
            callback(error);
          }
        }),
      };

      net.createServer.mockReturnValue(mockServer);

      const result = await PortManager.isPortAvailable(3001);

      expect(result).toBe(false);
    });

    it('should handle other server errors', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          // Simulate other error
        }),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            const error = new Error('Other error');
            error.code = 'EACCES';
            callback(error);
          }
        }),
      };

      net.createServer.mockReturnValue(mockServer);

      const result = await PortManager.isPortAvailable(3001);

      expect(result).toBe(false);
    });
  });

  describe('findAvailablePort', () => {
    it('should find available port starting from given port', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          if (port === 3001 || port === 3002) {
            // Ports 3001 and 3002 are busy
            return;
          }
          callback(); // Port 3003 is available
        }),
        once: jest.fn((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
        close: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            const error = new Error('Port in use');
            error.code = 'EADDRINUSE';
            callback(error);
          }
        }),
      };

      net.createServer.mockReturnValue(mockServer);

      const result = await PortManager.findAvailablePort(3001);

      expect(result).toBe(3003);
    });

    it('should throw error when no ports available in range', async () => {
      const mockServer = {
        listen: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            const error = new Error('Port in use');
            error.code = 'EADDRINUSE';
            callback(error);
          }
        }),
      };

      net.createServer.mockReturnValue(mockServer);

      await expect(PortManager.findAvailablePort(3099)).rejects.toThrow(
        'No available ports in range'
      );
    });

    it('should use default start port when none provided', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          callback();
        }),
        once: jest.fn((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
        close: jest.fn(),
      };

      net.createServer.mockReturnValue(mockServer);

      const result = await PortManager.findAvailablePort();

      expect(result).toBe(3001);
    });
  });

  describe('reservePort', () => {
    it('should reserve a port successfully', () => {
      PortManager.reservePort(3001);

      expect(PortManager.reservedPorts.has(3001)).toBe(true);
    });

    it('should allow reserving same port multiple times', () => {
      PortManager.reservePort(3001);
      PortManager.reservePort(3001); // Should not throw

      expect(PortManager.isPortReserved(3001)).toBe(true);
    });
  });

  describe('releasePort', () => {
    it('should release a reserved port', () => {
      PortManager.reservePort(3001);
      PortManager.releasePort(3001);

      expect(PortManager.reservedPorts.has(3001)).toBe(false);
    });

    it('should handle releasing non-reserved port gracefully', () => {
      expect(() => PortManager.releasePort(3001)).not.toThrow();
    });
  });

  describe('isPortReserved', () => {
    it('should return true for reserved ports', () => {
      PortManager.reservePort(3001);

      expect(PortManager.isPortReserved(3001)).toBe(true);
    });

    it('should return false for non-reserved ports', () => {
      expect(PortManager.isPortReserved(3001)).toBe(false);
    });
  });

  describe('getUsedPorts', () => {
    it('should return array of used ports', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          if (port === 3001) {
            // Port 3001 is in use
            return;
          }
          callback();
        }),
        once: jest.fn((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
        close: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            const error = new Error('Port in use');
            error.code = 'EADDRINUSE';
            callback(error);
          }
        }),
      };

      net.createServer.mockReturnValue(mockServer);

      const usedPorts = await PortManager.getUsedPorts();

      expect(Array.isArray(usedPorts)).toBe(true);
    });
  });

  describe('getPortStats', () => {
    it('should return port statistics', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => {
          callback();
        }),
        once: jest.fn((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
        close: jest.fn(),
      };

      net.createServer.mockReturnValue(mockServer);

      const stats = await PortManager.getPortStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('usedPorts');
      expect(stats).toHaveProperty('available');
    });
  });

  describe('setPortRange', () => {
    it('should update port range successfully', () => {
      PortManager.setPortRange(4001, 4100);

      expect(PortManager.portRange.start).toBe(4001);
      expect(PortManager.portRange.end).toBe(4100);

      // Reset for other tests
      PortManager.resetPortRange();
    });

    it('should throw error for invalid range', () => {
      expect(() => PortManager.setPortRange(4100, 4001)).toThrow(
        'Start port must be less than end port'
      );
    });

    it('should throw error for invalid port numbers', () => {
      expect(() => PortManager.setPortRange(0, 100)).toThrow(
        'Invalid port range'
      );
      expect(() => PortManager.setPortRange(1000, 70000)).toThrow(
        'Invalid port range'
      );
    });
  });

  describe('isValidPort', () => {
    it('should return true for valid ports', () => {
      expect(PortManager.isValidPort(3001)).toBe(true);
      expect(PortManager.isValidPort(8080)).toBe(true);
      expect(PortManager.isValidPort(65535)).toBe(true);
    });

    it('should return false for invalid ports', () => {
      expect(PortManager.isValidPort(0)).toBe(false);
      expect(PortManager.isValidPort(-1)).toBe(false);
      expect(PortManager.isValidPort(65536)).toBe(false);
      expect(PortManager.isValidPort('3001')).toBe(true); // String numbers are valid
      expect(PortManager.isValidPort(null)).toBe(false);
      expect(PortManager.isValidPort(undefined)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true for ports in range', () => {
      expect(PortManager.isInRange(3001)).toBe(true);
      expect(PortManager.isInRange(3050)).toBe(true);
      expect(PortManager.isInRange(3100)).toBe(true);
    });

    it('should return false for ports out of range', () => {
      expect(PortManager.isInRange(3000)).toBe(false);
      expect(PortManager.isInRange(3101)).toBe(false);
    });
  });
});
