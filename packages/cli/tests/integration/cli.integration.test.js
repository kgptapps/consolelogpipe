/**
 * CLI Integration Tests
 *
 * These tests verify that the CLI commands work end-to-end
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  const CLI_PATH = path.join(__dirname, '../../src/cli.js');
  const TEST_APP_NAME = `test-app-${Date.now()}`;
  const TEST_PORT = 3000 + Math.floor(Math.random() * 1000);

  beforeAll(() => {
    // Ensure CLI is executable
    if (fs.existsSync(CLI_PATH)) {
      fs.chmodSync(CLI_PATH, '755');
    }
  });

  afterAll(async () => {
    // Clean up any running servers
    try {
      await execAsync(`node ${CLI_PATH} stop --all --force`);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic CLI Commands', () => {
    test('should show help when --help flag is used', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --help`);

      expect(stdout).toContain('Console Log Pipe CLI');
      expect(stdout).toContain('start');
      expect(stdout).toContain('monitor');
      expect(stdout).toContain('list');
      expect(stdout).toContain('stop');
      expect(stdout).toContain('status');
    });

    test('should show version when --version flag is used', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --version`);

      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should show help for start command', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} start --help`);

      expect(stdout).toContain('Start Console Log Pipe server');
      expect(stdout).toContain('--port');
      expect(stdout).toContain('--host');
      expect(stdout).toContain('--app-name');
    });

    test('should show help for monitor command', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} monitor --help`);

      expect(stdout).toContain('Monitor logs from a running application');
      expect(stdout).toContain('--follow');
      expect(stdout).toContain('--filter');
      expect(stdout).toContain('--level');
    });
  });

  describe('Server Management', () => {
    test('should start a server for an application', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} start ${TEST_APP_NAME} --port ${TEST_PORT}`
      );

      expect(stdout).toContain('started');
      expect(stdout).toContain(TEST_APP_NAME);
      expect(stdout).toContain(TEST_PORT.toString());
    }, 10000);

    test('should list running servers', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} list`);

      expect(stdout).toContain(TEST_APP_NAME);
      expect(stdout).toContain(TEST_PORT.toString());
    });

    test('should show status of running servers', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} status`);

      expect(stdout).toContain(TEST_APP_NAME);
      expect(stdout).toContain('running');
    });

    test('should show status of specific application', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} status ${TEST_APP_NAME}`
      );

      expect(stdout).toContain(TEST_APP_NAME);
      expect(stdout).toContain('running');
      expect(stdout).toContain(TEST_PORT.toString());
    });

    test('should stop a specific server', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} stop ${TEST_APP_NAME} --force`
      );

      expect(stdout).toContain('stopped');
      expect(stdout).toContain(TEST_APP_NAME);
    });

    test('should show no servers after stopping', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} list`);

      expect(stdout).not.toContain(TEST_APP_NAME);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid command gracefully', async () => {
      try {
        await execAsync(`node ${CLI_PATH} invalid-command`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('Unknown command');
      }
    });

    test('should handle monitoring non-existent application', async () => {
      try {
        await execAsync(
          `node ${CLI_PATH} monitor non-existent-app --timeout 1000`
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('not found');
      }
    });

    test('should handle stopping non-existent application', async () => {
      try {
        await execAsync(`node ${CLI_PATH} stop non-existent-app`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('not found');
      }
    });
  });

  describe('Port Management', () => {
    test('should auto-assign port when not specified', async () => {
      const appName = `auto-port-test-${Date.now()}`;

      const { stdout } = await execAsync(`node ${CLI_PATH} start ${appName}`);

      expect(stdout).toContain('started');
      expect(stdout).toContain(appName);
      expect(stdout).toMatch(/port.*\d+/i);

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 10000);

    test('should handle port conflicts gracefully', async () => {
      const appName1 = `port-conflict-1-${Date.now()}`;
      const appName2 = `port-conflict-2-${Date.now()}`;
      const conflictPort = 3000 + Math.floor(Math.random() * 1000);

      // Start first server
      await execAsync(
        `node ${CLI_PATH} start ${appName1} --port ${conflictPort}`
      );

      try {
        // Try to start second server on same port
        await execAsync(
          `node ${CLI_PATH} start ${appName2} --port ${conflictPort}`
        );
        fail('Should have thrown an error for port conflict');
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('port');
        expect(error.stderr || error.stdout).toContain('use');
      }

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName1} --force`);
    }, 15000);
  });

  describe('Output Formats', () => {
    test('should support JSON output format for list command', async () => {
      const appName = `json-test-${Date.now()}`;

      // Start a server
      await execAsync(`node ${CLI_PATH} start ${appName}`);

      const { stdout } = await execAsync(`node ${CLI_PATH} list --format json`);

      expect(() => JSON.parse(stdout)).not.toThrow();
      const data = JSON.parse(stdout);
      expect(Array.isArray(data)).toBe(true);

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 10000);

    test('should support table output format for list command', async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} list --format table`
      );

      // Should contain table headers
      expect(stdout).toContain('Application');
      expect(stdout).toContain('Status');
      expect(stdout).toContain('Port');
    });
  });
});
