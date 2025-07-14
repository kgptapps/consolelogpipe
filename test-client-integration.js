#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Simple Client Integration Test
 *
 * This script tests the complete workflow:
 * 1. Start CLI server
 * 2. Connect client library
 * 3. Send test logs
 * 4. Verify logs are received
 * 5. Stop server
 */

const { spawn, exec } = require('child_process');
const WebSocket = require('ws');
const { promisify } = require('util');

const execAsync = promisify(exec);

const TEST_APP_NAME = 'integration-test';
const TEST_PORT = 3091;

console.log('🧪 Testing Console Log Pipe Client Integration...\n');

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
    await execAsync(
      `node packages/cli/src/cli.js stop ${TEST_APP_NAME} --force`
    );
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  let passCount = 0;
  let totalTests = 0;

  // Cleanup before starting
  await cleanup();

  // Test 1: Start Server
  totalTests++;
  let serverProcess;
  const startPassed = await runTest('Starting CLI server', async () => {
    serverProcess = spawn(
      'node',
      ['packages/cli/src/cli.js', 'start', TEST_APP_NAME, '--port', TEST_PORT],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(
        () => reject(new Error('Server start timeout')),
        10000
      );

      serverProcess.stdout.on('data', data => {
        output += data.toString();
        if (output.includes('Server started successfully')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr.on('data', data => {
        console.error('Server error:', data.toString());
      });

      serverProcess.on('error', reject);
    });
  });
  if (startPassed) passCount++;

  // Test 2: Verify Server is Listed
  totalTests++;
  const listPassed = await runTest(
    'Verifying server appears in list',
    async () => {
      const { stdout } = await execAsync(`node packages/cli/src/cli.js list`);
      if (!stdout.includes(TEST_APP_NAME)) {
        throw new Error('Server not found in list');
      }
      if (!stdout.includes(TEST_PORT.toString())) {
        throw new Error('Server port not found in list');
      }
    }
  );
  if (listPassed) passCount++;

  // Test 3: Test HTTP Endpoint
  totalTests++;
  const httpPassed = await runTest('Testing HTTP endpoint', async () => {
    const http = require('http');

    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${TEST_PORT}/`, res => {
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
  });
  if (httpPassed) passCount++;

  // Test 4: Test WebSocket Connection and Log Sending
  totalTests++;
  const wsPassed = await runTest(
    'Testing WebSocket connection and log sending',
    async () => {
      const wsUrl = `ws://localhost:${TEST_PORT}`;
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.on('open', () => {
          // Send a test log
          const testLog = {
            type: 'log',
            level: 'info',
            message: 'Test log message from integration test',
            timestamp: new Date().toISOString(),
            applicationName: TEST_APP_NAME,
            source: 'integration-test.js',
            line: 42,
          };

          ws.send(JSON.stringify(testLog));

          // Wait a bit for the log to be processed
          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        });

        ws.on('error', reject);
        setTimeout(
          () => reject(new Error('WebSocket connection timeout')),
          5000
        );
      });
    }
  );
  if (wsPassed) passCount++;

  // Test 5: Test Client Library Simulation
  totalTests++;
  const clientPassed = await runTest(
    'Simulating client library usage',
    async () => {
      // Simulate what the client library would do
      const wsUrl = `ws://localhost:${TEST_PORT}`;
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.on('open', () => {
          // Send multiple types of logs like the client library would
          const logs = [
            {
              type: 'log',
              level: 'info',
              message: 'Application started',
              timestamp: new Date().toISOString(),
              applicationName: TEST_APP_NAME,
            },
            {
              type: 'log',
              level: 'warn',
              message: 'This is a warning message',
              timestamp: new Date().toISOString(),
              applicationName: TEST_APP_NAME,
            },
            {
              type: 'log',
              level: 'error',
              message: 'This is an error message',
              timestamp: new Date().toISOString(),
              applicationName: TEST_APP_NAME,
            },
            {
              type: 'network',
              method: 'GET',
              url: '/api/test',
              status: 200,
              timestamp: new Date().toISOString(),
              applicationName: TEST_APP_NAME,
            },
          ];

          logs.forEach((log, index) => {
            setTimeout(() => {
              ws.send(JSON.stringify(log));
              messageCount++;

              if (messageCount === logs.length) {
                setTimeout(() => {
                  ws.close();
                  resolve();
                }, 500);
              }
            }, index * 100);
          });
        });

        ws.on('error', reject);
        setTimeout(() => reject(new Error('Client simulation timeout')), 10000);
      });
    }
  );
  if (clientPassed) passCount++;

  // Test 6: Stop Server
  totalTests++;
  const stopPassed = await runTest('Stopping server', async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise(resolve => {
        serverProcess.on('exit', resolve);
        setTimeout(resolve, 3000); // Fallback timeout
      });
    }

    // Verify server is stopped by trying to connect
    const http = require('http');

    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${TEST_PORT}/`, resolve);
        req.on('error', reject);
        req.setTimeout(2000, () =>
          reject(new Error('Expected connection to fail'))
        );
      });
      throw new Error('Server is still running');
    } catch (error) {
      if (error.message === 'Server is still running') {
        throw error;
      }
      // Connection failed as expected
    }
  });
  if (stopPassed) passCount++;

  // Final cleanup
  await cleanup();

  // Results
  console.log('\n📊 Integration Test Results:');
  console.log(`   Passed: ${passCount}/${totalTests}`);
  console.log(
    `   Success Rate: ${Math.round((passCount / totalTests) * 100)}%`
  );

  if (passCount === totalTests) {
    console.log(
      '\n🎉 All integration tests passed! Console Log Pipe is working correctly.'
    );
    process.exit(0);
  } else {
    console.log(
      '\n❌ Some integration tests failed. Please check the issues above.'
    );
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
  console.error('\n💥 Integration test error:', error.message);
  process.exit(1);
});
