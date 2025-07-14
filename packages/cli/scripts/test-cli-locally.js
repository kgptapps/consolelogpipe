#!/usr/bin/env node

/**
 * Local CLI Testing Script
 *
 * This script tests the CLI functionality locally before publishing
 */

const { exec } = require('child_process');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const CLI_PATH = path.join(__dirname, '../src/cli.js');
const TEST_APP_NAME = 'local-test-app';

console.log('🧪 Testing Console Log Pipe CLI locally...\n');

async function runTest(description, testFn) {
  process.stdout.write(`${description}... `);
  try {
    await testFn();
    console.log('✅ PASS');
    return true;
  } catch (error) {
    console.log('❌ FAIL');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  try {
    await execAsync(`node ${CLI_PATH} stop --all --force`);
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  let passCount = 0;
  let totalTests = 0;

  // Cleanup before starting
  await cleanup();

  // Test 1: CLI Help
  totalTests++;
  const helpPassed = await runTest('Testing CLI help command', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
    if (!stdout.includes('Console Log Pipe CLI')) {
      throw new Error('Help output does not contain expected text');
    }
    if (!stdout.includes('start') || !stdout.includes('monitor')) {
      throw new Error('Help output missing expected commands');
    }
  });
  if (helpPassed) passCount++;

  // Test 2: CLI Version
  totalTests++;
  const versionPassed = await runTest(
    'Testing CLI version command',
    async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
      if (!/^\d+\.\d+\.\d+/.test(stdout.trim())) {
        throw new Error('Version output is not in expected format');
      }
    }
  );
  if (versionPassed) passCount++;

  // Test 3: Start Server
  totalTests++;
  let serverPort;
  const startPassed = await runTest(
    'Testing server start command',
    async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} start ${TEST_APP_NAME}`
      );
      if (!stdout.includes('started')) {
        throw new Error('Start command did not indicate success');
      }
      if (!stdout.includes(TEST_APP_NAME)) {
        throw new Error('Start command did not mention app name');
      }

      // Extract port
      const portMatch = stdout.match(/port[:\s]+(\d+)/i);
      if (!portMatch) {
        throw new Error('Could not extract port from start command output');
      }
      serverPort = parseInt(portMatch[1]);
    }
  );
  if (startPassed) passCount++;

  // Test 4: List Servers
  totalTests++;
  const listPassed = await runTest('Testing list servers command', async () => {
    const { stdout } = await execAsync(`node ${CLI_PATH} list`);
    if (!stdout.includes(TEST_APP_NAME)) {
      throw new Error('List command does not show started server');
    }
    if (!stdout.includes(serverPort.toString())) {
      throw new Error('List command does not show correct port');
    }
  });
  if (listPassed) passCount++;

  // Test 5: Server Status
  totalTests++;
  const statusPassed = await runTest(
    'Testing server status command',
    async () => {
      const { stdout } = await execAsync(
        `node ${CLI_PATH} status ${TEST_APP_NAME}`
      );
      if (!stdout.includes(TEST_APP_NAME)) {
        throw new Error('Status command does not show app name');
      }
      if (!stdout.includes('running')) {
        throw new Error('Status command does not show running status');
      }
    }
  );
  if (statusPassed) passCount++;

  // Test 6: HTTP Endpoint
  totalTests++;
  const httpPassed = await runTest(
    'Testing HTTP endpoint accessibility',
    async () => {
      const http = require('http');

      const response = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${serverPort}/health`, res => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('HTTP request timeout')));
      });

      if (response !== 200) {
        throw new Error(
          `HTTP endpoint returned status ${response}, expected 200`
        );
      }
    }
  );
  if (httpPassed) passCount++;

  // Test 7: WebSocket Connection
  totalTests++;
  const wsPassed = await runTest('Testing WebSocket connection', async () => {
    const WebSocket = require('ws');
    const wsUrl = `ws://localhost:${serverPort}`;

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        ws.close();
        resolve();
      });
      ws.on('error', reject);
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  });
  if (wsPassed) passCount++;

  // Test 8: Stop Server
  totalTests++;
  const stopPassed = await runTest('Testing server stop command', async () => {
    const { stdout } = await execAsync(
      `node ${CLI_PATH} stop ${TEST_APP_NAME} --force`
    );
    if (!stdout.includes('stopped')) {
      throw new Error('Stop command did not indicate success');
    }
    if (!stdout.includes(TEST_APP_NAME)) {
      throw new Error('Stop command did not mention app name');
    }
  });
  if (stopPassed) passCount++;

  // Test 9: Verify Server Stopped
  totalTests++;
  const verifyStoppedPassed = await runTest(
    'Verifying server is stopped',
    async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} list`);
      if (stdout.includes(TEST_APP_NAME)) {
        throw new Error('Server still appears in list after stopping');
      }
    }
  );
  if (verifyStoppedPassed) passCount++;

  // Final cleanup
  await cleanup();

  // Results
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passCount}/${totalTests}`);
  console.log(
    `   Success Rate: ${Math.round((passCount / totalTests) * 100)}%`
  );

  if (passCount === totalTests) {
    console.log('\n🎉 All tests passed! CLI is ready for use.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please fix issues before publishing.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error('\n💥 Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
main().catch(error => {
  console.error('\n💥 Test runner error:', error.message);
  process.exit(1);
});
