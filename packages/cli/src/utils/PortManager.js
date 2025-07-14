/**
 * PortManager - Manages port allocation for Console Log Pipe applications
 */

const net = require('net');

class PortManager {
  static portRange = {
    start: 3001,
    end: 3100,
  };

  static reservedPorts = new Set();

  /**
   * Get a consistent port for an application based on its name
   */
  static getApplicationPort(appName) {
    if (!appName) {
      throw new Error('Application name is required');
    }

    // Generate a consistent hash from the application name
    let hash = 0;
    for (let i = 0; i < appName.length; i++) {
      hash = ((hash << 5) - hash + appName.charCodeAt(i)) & 0xffffffff;
    }

    // Map hash to port range
    const portOffset =
      Math.abs(hash) % (this.portRange.end - this.portRange.start + 1);
    const port = this.portRange.start + portOffset;

    return port;
  }

  /**
   * Check if a port is available
   */
  static async isPortAvailable(port) {
    return new Promise(resolve => {
      const server = net.createServer();

      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });

      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find the next available port starting from a given port
   */
  static async findAvailablePort(startPort = this.portRange.start) {
    let port = startPort;
    const maxPort = this.portRange.end;

    while (port <= maxPort) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }

    throw new Error(
      `No available ports in range ${this.portRange.start}-${this.portRange.end}`
    );
  }

  /**
   * Get an available port for an application, preferring the consistent port
   */
  static async getAvailableApplicationPort(appName) {
    const preferredPort = this.getApplicationPort(appName);

    // Check if preferred port is available
    if (await this.isPortAvailable(preferredPort)) {
      return preferredPort;
    }

    // Find next available port
    return this.findAvailablePort(preferredPort + 1);
  }

  /**
   * Reserve a port to prevent conflicts
   */
  static reservePort(port) {
    this.reservedPorts.add(port);
  }

  /**
   * Release a reserved port
   */
  static releasePort(port) {
    this.reservedPorts.delete(port);
  }

  /**
   * Check if a port is reserved
   */
  static isPortReserved(port) {
    return this.reservedPorts.has(port);
  }

  /**
   * Get all ports currently in use by Console Log Pipe
   */
  static async getUsedPorts() {
    const usedPorts = [];

    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (!(await this.isPortAvailable(port))) {
        usedPorts.push(port);
      }
    }

    return usedPorts;
  }

  /**
   * Get port statistics
   */
  static async getPortStats() {
    const usedPorts = await this.getUsedPorts();
    const totalPorts = this.portRange.end - this.portRange.start + 1;
    const availablePorts = totalPorts - usedPorts.length;

    return {
      total: totalPorts,
      used: usedPorts.length,
      available: availablePorts,
      usedPorts,
      range: this.portRange,
      reservedPorts: Array.from(this.reservedPorts),
    };
  }

  /**
   * Validate port number
   */
  static isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1024 && portNum <= 65535;
  }

  /**
   * Check if port is in Console Log Pipe range
   */
  static isInRange(port) {
    const portNum = parseInt(port, 10);
    return portNum >= this.portRange.start && portNum <= this.portRange.end;
  }

  /**
   * Set custom port range
   */
  static setPortRange(start, end) {
    if (!this.isValidPort(start) || !this.isValidPort(end)) {
      throw new Error('Invalid port range');
    }

    if (start >= end) {
      throw new Error('Start port must be less than end port');
    }

    this.portRange = { start, end };
  }

  /**
   * Reset port range to default
   */
  static resetPortRange() {
    this.portRange = {
      start: 3001,
      end: 3100,
    };
  }

  /**
   * Get port information for debugging
   */
  static async getPortInfo(port) {
    const isAvailable = await this.isPortAvailable(port);
    const isReserved = this.isPortReserved(port);
    const isInRange = this.isInRange(port);
    const isValid = this.isValidPort(port);

    return {
      port,
      isAvailable,
      isReserved,
      isInRange,
      isValid,
      status: isAvailable ? 'available' : 'in-use',
    };
  }
}

module.exports = PortManager;
