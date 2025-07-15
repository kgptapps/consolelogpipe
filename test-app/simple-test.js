#!/usr/bin/env node

/**
 * Simple Test for Console Log Pipe Packages
 * Tests basic functionality without heavy dependencies
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import WebSocket from 'ws';

const sleep = promisify(setTimeout);

class SimplePackageTester {
  constructor() {
    this.testResults = [];
    this.serverProcess = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.testResults.push({ name, status: 'PASS' });
      this.log(`✅ ${name} - PASSED`, 'success');
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
    }
  }

  async testCLIPackageAvailable() {
    try {
      const { spawn } = await import('child_process');
      const process = spawn('npx', ['clp', '--version'], { stdio: 'pipe' });
      
      return new Promise((resolve, reject) => {
        let output = '';
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.on('close', (code) => {
          if (code === 0 && output.includes('1.1.24')) {
            resolve();
          } else {
            reject(new Error(`CLI version check failed. Output: ${output}`));
          }
        });
        
        process.on('error', reject);
      });
    } catch (error) {
      throw new Error(`CLI package not available: ${error.message}`);
    }
  }

  async testClientPackageAvailable() {
    try {
      // Try to import the client package
      const clientPackage = await import('@kansnpms/console-log-pipe-client');
      
      if (!clientPackage.default) {
        throw new Error('Client package default export not found');
      }
      
      if (clientPackage.default.version !== '1.1.24') {
        throw new Error(`Expected version 1.1.24, got ${clientPackage.default.version}`);
      }
      
    } catch (error) {
      throw new Error(`Client package not available: ${error.message}`);
    }
  }

  async startCLIServer() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 15000);

      this.serverProcess = spawn('npx', ['clp', 'start', '--port', '3005'], {
        stdio: 'pipe'
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if (text.includes('Server running on port 3005')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  async testWebSocketConnection() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3005');
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async testClientInitialization() {
    // Create a simple HTML file to test client initialization
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Client Test</title>
</head>
<body>
    <script type="module">
        import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';
        
        // Test initialization
        try {
            ConsoleLogPipe.init();
            console.log('✅ Client initialized successfully');
            
            // Test version
            if (ConsoleLogPipe.version === '1.1.24') {
                console.log('✅ Version check passed');
            } else {
                console.error('❌ Version check failed');
            }
            
            // Test basic logging
            console.log('🧪 Test log message from client');
            console.error('🧪 Test error message from client');
            console.warn('🧪 Test warning message from client');
            
        } catch (error) {
            console.error('❌ Client initialization failed:', error);
        }
    </script>
</body>
</html>`;
    
    writeFileSync('simple-client-test.html', html);
    this.log('Created simple client test HTML file', 'info');
  }

  async runAllTests() {
    this.log('🚀 Starting Simple Package Tests', 'info');
    
    try {
      await this.test('CLI Package Available', () => this.testCLIPackageAvailable());
      await this.test('Client Package Available', () => this.testClientPackageAvailable());
      
      this.log('Starting CLI server for integration tests...', 'info');
      await this.startCLIServer();
      await sleep(2000); // Give server time to start
      
      await this.test('WebSocket Connection', () => this.testWebSocketConnection());
      await this.test('Client Initialization Test File', () => this.testClientInitialization());
      
    } finally {
      await this.stopServer();
    }

    this.printResults();
  }

  printResults() {
    this.log('\n📊 Simple Package Test Results:', 'info');
    this.log('='.repeat(50), 'info');
    
    let passed = 0;
    let failed = 0;

    this.testResults.forEach(result => {
      if (result.status === 'PASS') {
        this.log(`✅ ${result.name}`, 'success');
        passed++;
      } else {
        this.log(`❌ ${result.name}: ${result.error}`, 'error');
        failed++;
      }
    });

    this.log('='.repeat(50), 'info');
    this.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`, 'info');
    
    if (failed === 0) {
      this.log('\n🎉 All tests passed! Console Log Pipe packages are working correctly!', 'success');
      this.log('\n📝 Next steps:', 'info');
      this.log('1. Open simple-client-test.html in a browser', 'info');
      this.log('2. Start the CLI server: npx clp start --port 3005', 'info');
      this.log('3. Check browser console and CLI output for log streaming', 'info');
    } else {
      this.log('\n❌ Some tests failed. Please check the errors above.', 'error');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new SimplePackageTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
