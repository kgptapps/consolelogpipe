#!/usr/bin/env node

/**
 * Client Integration Test
 * Tests the client package integration with a local CLI server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runIntegrationTest() {
  console.log('🔗 Console Log Pipe Client Integration Test');
  console.log('==========================================\n');

  // Create test directory
  const testDir = 'client-integration-test';
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir);

  console.log('📦 Installing client package locally...');

  // Create package.json
  const packageJson = {
    name: 'client-integration-test',
    version: '1.0.0',
    dependencies: {
      '@kansnpms/console-log-pipe-client': 'latest',
    },
  };

  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Install the package
  const installProcess = spawn('npm', ['install'], {
    cwd: testDir,
    stdio: 'inherit',
  });

  installProcess.on('close', code => {
    if (code !== 0) {
      console.error('❌ Failed to install client package');
      process.exit(1);
    }

    console.log('✅ Client package installed successfully\n');

    // Create test file
    const testJs = `
const ConsoleLogPipe = require('@kansnpms/console-log-pipe-client');

console.log('🧪 Starting client integration test...');

async function runTest() {
    try {
        // Initialize Console Log Pipe
        const instance = await ConsoleLogPipe.init({
            applicationName: 'integration-test',
            serverPort: 3021
        });
        
        console.log('✅ Console Log Pipe initialized');
        console.log('📊 Session info:', instance.getSession());
        
        // Test different log types
        setTimeout(() => {
            console.log('🧪 Integration Test 1: Basic log');
            console.warn('🧪 Integration Test 2: Warning');
            console.error('🧪 Integration Test 3: Error');
            console.info('🧪 Integration Test 4: Info');
            
            const testData = {
                test: 'integration',
                timestamp: new Date().toISOString(),
                data: { nested: true, array: [1, 2, 3] }
            };
            console.log('🧪 Integration Test 5: Object', testData);
            
            console.log('🎉 Integration test completed!');
            
            // Stop after 5 seconds
            setTimeout(() => {
                process.exit(0);
            }, 5000);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        process.exit(1);
    }
}

runTest();
`;

    fs.writeFileSync(path.join(testDir, 'test.js'), testJs);

    console.log('🚀 Starting CLI server for integration test...');

    // Start CLI server
    const cliProcess = spawn(
      'clp',
      ['start', 'integration-test', '--port', '3021'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    let serverReady = false;
    let testProcess = null;
    let logsCaptured = 0;

    cliProcess.stdout.on('data', data => {
      const output = data.toString();
      console.log('CLI:', output.trim());

      if (
        (output.includes('Ready to receive logs') ||
          output.includes('Server started')) &&
        !serverReady
      ) {
        serverReady = true;
        console.log('\n✅ CLI server ready, starting Node.js test...\n');

        // Start the Node.js test
        testProcess = spawn('node', ['test.js'], {
          cwd: testDir,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        testProcess.stdout.on('data', data => {
          console.log('Test:', data.toString().trim());
        });

        testProcess.stderr.on('data', data => {
          console.error('Test Error:', data.toString().trim());
        });

        testProcess.on('close', code => {
          console.log(`\n📊 Integration Test Results:`);
          console.log(`- Test process exit code: ${code}`);
          console.log(`- Logs captured by CLI: ${logsCaptured}/5`);

          if (code === 0 && logsCaptured >= 5) {
            console.log('🎉 SUCCESS: Integration test passed!');
          } else if (logsCaptured > 0) {
            console.log('⚠️  PARTIAL: Some functionality working');
          } else {
            console.log('❌ FAILED: Integration test failed');
          }

          // Clean up
          cliProcess.kill('SIGTERM');
          setTimeout(() => {
            fs.rmSync(testDir, { recursive: true });
            console.log('🧹 Cleaned up test directory');
            process.exit(code === 0 && logsCaptured >= 5 ? 0 : 1);
          }, 1000);
        });
      }

      // Count captured logs
      if (output.includes('🧪 Integration Test')) {
        logsCaptured++;
        console.log(`✅ Captured integration log ${logsCaptured}/5`);
      }
    });

    cliProcess.stderr.on('data', data => {
      const error = data.toString();
      if (!error.includes('WARN')) {
        console.error('CLI Error:', error.trim());
      }
    });

    cliProcess.on('close', code => {
      console.log(`CLI server closed with code ${code}`);
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping integration test...');
      if (testProcess) testProcess.kill('SIGTERM');
      cliProcess.kill('SIGTERM');
      setTimeout(() => {
        fs.rmSync(testDir, { recursive: true });
        process.exit(0);
      }, 1000);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('\n⏰ Integration test timeout');
      if (testProcess) testProcess.kill('SIGTERM');
      cliProcess.kill('SIGTERM');
      fs.rmSync(testDir, { recursive: true });
      process.exit(1);
    }, 30000);
  });
}

runIntegrationTest().catch(console.error);
