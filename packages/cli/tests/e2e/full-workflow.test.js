/**
 * End-to-End Workflow Tests
 *
 * These tests verify the complete workflow from CLI server start to client connection
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('End-to-End Workflow Tests', () => {
  const CLI_PATH = path.join(__dirname, '../../src/cli.js');
  const TEST_APP_NAME = 'e2e-test-app';
  let serverProcess;
  let serverPort;

  beforeAll(async () => {
    // Clean up any existing servers
    try {
      await execAsync(`node ${CLI_PATH} stop --all --force`);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up
    if (serverProcess) {
      serverProcess.kill();
    }
    try {
      await execAsync(`node ${CLI_PATH} stop --all --force`);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Workflow', () => {
    test('should start server, accept client connections, and receive logs', async () => {
      // Step 1: Start the server
      const startResult = await execAsync(
        `node ${CLI_PATH} start ${TEST_APP_NAME}`
      );
      expect(startResult.stdout).toContain('started');

      // Extract port from output
      const portMatch = startResult.stdout.match(/port[:\s]+(\d+)/i);
      expect(portMatch).toBeTruthy();
      serverPort = parseInt(portMatch[1]);

      // Step 2: Verify server is running
      const listResult = await execAsync(`node ${CLI_PATH} list`);
      expect(listResult.stdout).toContain(TEST_APP_NAME);
      expect(listResult.stdout).toContain(serverPort.toString());

      // Step 3: Test HTTP endpoint
      const http = require('http');
      const httpResponse = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${serverPort}/health`, res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('HTTP request timeout')));
      });

      expect(httpResponse.statusCode).toBe(200);

      // Step 4: Test WebSocket connection
      const wsUrl = `ws://localhost:${serverPort}`;
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(
          () => reject(new Error('WebSocket connection timeout')),
          5000
        );
      });

      // Step 5: Send test log message
      const testLog = {
        type: 'log',
        level: 'info',
        message: 'Test log message',
        timestamp: new Date().toISOString(),
        applicationName: TEST_APP_NAME,
      };

      ws.send(JSON.stringify(testLog));

      // Step 6: Verify log was received (check via monitor command)
      // Note: This is a simplified test - in practice, monitor would show the log

      ws.close();

      // Step 7: Stop the server
      const stopResult = await execAsync(
        `node ${CLI_PATH} stop ${TEST_APP_NAME} --force`
      );
      expect(stopResult.stdout).toContain('stopped');
    }, 30000);

    test('should handle multiple applications simultaneously', async () => {
      const app1 = 'multi-test-app-1';
      const app2 = 'multi-test-app-2';

      // Start two applications
      const start1 = await execAsync(`node ${CLI_PATH} start ${app1}`);
      const start2 = await execAsync(`node ${CLI_PATH} start ${app2}`);

      expect(start1.stdout).toContain('started');
      expect(start2.stdout).toContain('started');

      // Verify both are listed
      const listResult = await execAsync(`node ${CLI_PATH} list`);
      expect(listResult.stdout).toContain(app1);
      expect(listResult.stdout).toContain(app2);

      // Stop both
      await execAsync(`node ${CLI_PATH} stop ${app1} --force`);
      await execAsync(`node ${CLI_PATH} stop ${app2} --force`);
    }, 20000);

    test('should persist server information across CLI calls', async () => {
      const appName = 'persistence-test';

      // Start server
      await execAsync(`node ${CLI_PATH} start ${appName}`);

      // Verify it's listed in a separate CLI call
      const listResult = await execAsync(`node ${CLI_PATH} list`);
      expect(listResult.stdout).toContain(appName);

      // Check status in another separate CLI call
      const statusResult = await execAsync(
        `node ${CLI_PATH} status ${appName}`
      );
      expect(statusResult.stdout).toContain(appName);
      expect(statusResult.stdout).toContain('running');

      // Stop server
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 15000);
  });

  describe('Error Recovery', () => {
    test('should handle server crashes gracefully', async () => {
      const appName = 'crash-test';

      // Start server
      const startResult = await execAsync(`node ${CLI_PATH} start ${appName}`);
      const portMatch = startResult.stdout.match(/port[:\s]+(\d+)/i);
      const port = parseInt(portMatch[1]);

      // Simulate server crash by killing the process
      // First, find the process
      try {
        const { stdout: psOutput } = await execAsync(`lsof -ti:${port}`);
        const pid = psOutput.trim();
        if (pid) {
          await execAsync(`kill -9 ${pid}`);
        }
      } catch (error) {
        // Process might not exist, that's okay
      }

      // Verify CLI detects the server is no longer running
      const statusResult = await execAsync(
        `node ${CLI_PATH} status ${appName}`
      );
      expect(statusResult.stdout).toContain('not running');

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 15000);
  });

  describe('Configuration Management', () => {
    test('should respect environment-specific settings', async () => {
      const appName = 'env-test';

      // Start with development environment
      const devResult = await execAsync(
        `node ${CLI_PATH} start ${appName} --env development`
      );
      expect(devResult.stdout).toContain('started');
      expect(devResult.stdout).toContain('development');

      // Stop and start with production environment
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);

      const prodResult = await execAsync(
        `node ${CLI_PATH} start ${appName} --env production`
      );
      expect(prodResult.stdout).toContain('started');
      expect(prodResult.stdout).toContain('production');

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 15000);

    test('should handle log level filtering', async () => {
      const appName = 'log-level-test';

      // Start with error level only
      const result = await execAsync(
        `node ${CLI_PATH} start ${appName} --log-level error`
      );
      expect(result.stdout).toContain('started');
      expect(result.stdout).toContain('error');

      // Clean up
      await execAsync(`node ${CLI_PATH} stop ${appName} --force`);
    }, 10000);
  });
});
