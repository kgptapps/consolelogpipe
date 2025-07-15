#!/usr/bin/env node

/**
 * Basic Test for Console Log Pipe Packages
 * Tests basic functionality with CommonJS approach
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const { writeFileSync } = require('fs');
const WebSocket = require('ws');

const sleep = promisify(setTimeout);

class BasicPackageTester {
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

  async testCLIPackageInstalled() {
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['clp', '--version'], { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.includes('1.1.24')) {
          resolve();
        } else {
          reject(new Error(`CLI version check failed. Code: ${code}, Output: ${output}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  async testCLIHelp() {
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['clp', '--help'], { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.includes('start') && output.includes('--port')) {
          resolve();
        } else {
          reject(new Error(`CLI help check failed. Code: ${code}, Output: ${output}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  async testClientPackageInstalled() {
    try {
      // Check if the package files exist
      const fs = require('fs');
      const path = require('path');
      
      const clientPath = path.join(process.cwd(), 'node_modules', '@kansnpms', 'console-log-pipe-client');
      const packageJsonPath = path.join(clientPath, 'package.json');
      const distPath = path.join(clientPath, 'dist');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('Client package.json not found');
      }
      
      if (!fs.existsSync(distPath)) {
        throw new Error('Client dist directory not found');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.version !== '1.1.24') {
        throw new Error(`Expected version 1.1.24, got ${packageJson.version}`);
      }
      
      // Check if main dist files exist
      const esmFile = path.join(distPath, 'console-log-pipe.esm.js');
      const cjsFile = path.join(distPath, 'console-log-pipe.cjs.js');
      const umdFile = path.join(distPath, 'console-log-pipe.umd.js');
      
      if (!fs.existsSync(esmFile)) {
        throw new Error('ESM dist file not found');
      }
      
      if (!fs.existsSync(cjsFile)) {
        throw new Error('CJS dist file not found');
      }
      
      if (!fs.existsSync(umdFile)) {
        throw new Error('UMD dist file not found');
      }
      
    } catch (error) {
      throw new Error(`Client package validation failed: ${error.message}`);
    }
  }

  async startCLIServer() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 15000);

      this.serverProcess = spawn('npx', ['clp', 'start', '--port', '3006'], {
        stdio: 'pipe'
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if (text.includes('Server running on port 3006')) {
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
      const ws = new WebSocket('ws://localhost:3006');
      
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

  async createTestHTML() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe Test</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>Console Log Pipe Test</h1>
    <p>Open browser console to see test results</p>
    <button onclick="runTests()">Run Tests</button>
    
    <script src="./node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.umd.js"></script>
    <script>
        function runTests() {
            console.log('🧪 Starting Console Log Pipe Tests');
            
            // Test 1: Check if ConsoleLogPipe is available
            if (typeof ConsoleLogPipe !== 'undefined') {
                console.log('✅ ConsoleLogPipe is available globally');
            } else {
                console.error('❌ ConsoleLogPipe not found');
                return;
            }
            
            // Test 2: Check version
            if (ConsoleLogPipe.version === '1.1.24') {
                console.log('✅ Version check passed: ' + ConsoleLogPipe.version);
            } else {
                console.error('❌ Version check failed: ' + ConsoleLogPipe.version);
            }
            
            // Test 3: Initialize
            try {
                ConsoleLogPipe.init();
                console.log('✅ ConsoleLogPipe initialized successfully');
            } catch (error) {
                console.error('❌ Initialization failed:', error);
                return;
            }
            
            // Test 4: Test different log levels
            console.log('🧪 Test log message');
            console.error('🧪 Test error message');
            console.warn('🧪 Test warning message');
            console.info('🧪 Test info message');
            
            // Test 5: Test object logging
            const testObject = {
                name: 'Test Object',
                timestamp: new Date().toISOString(),
                data: [1, 2, 3, 4, 5]
            };
            console.log('🧪 Test object:', testObject);
            
            // Test 6: Test network request (if available)
            if (typeof fetch !== 'undefined') {
                fetch('https://jsonplaceholder.typicode.com/posts/1')
                    .then(response => response.json())
                    .then(data => {
                        console.log('🧪 Network request test completed:', data.title);
                    })
                    .catch(error => {
                        console.error('🧪 Network request test failed:', error);
                    });
            }
            
            console.log('🎉 All browser tests completed!');
        }
        
        // Auto-run tests when page loads
        window.addEventListener('load', function() {
            setTimeout(runTests, 1000);
        });
    </script>
</body>
</html>`;
    
    writeFileSync('test-page.html', html);
    this.log('Created test HTML page: test-page.html', 'info');
  }

  async runAllTests() {
    this.log('🚀 Starting Basic Package Tests', 'info');
    
    try {
      await this.test('CLI Package Installed', () => this.testCLIPackageInstalled());
      await this.test('CLI Help Command', () => this.testCLIHelp());
      await this.test('Client Package Installed', () => this.testClientPackageInstalled());
      
      this.log('Starting CLI server for integration tests...', 'info');
      await this.startCLIServer();
      await sleep(2000); // Give server time to start
      
      await this.test('WebSocket Connection', () => this.testWebSocketConnection());
      await this.test('Create Test HTML', () => this.createTestHTML());
      
    } finally {
      await this.stopServer();
    }

    this.printResults();
  }

  printResults() {
    this.log('\n📊 Basic Package Test Results:', 'info');
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
      this.log('\n📝 Manual Testing Instructions:', 'info');
      this.log('1. Start the CLI server: npx clp start --port 3006', 'info');
      this.log('2. Open test-page.html in a browser', 'info');
      this.log('3. Check browser console and CLI output for log streaming', 'info');
      this.log('4. Verify logs appear in both browser console and CLI terminal', 'info');
    } else {
      this.log('\n❌ Some tests failed. Please check the errors above.', 'error');
      process.exit(1);
    }
  }
}

// Run tests
const tester = new BasicPackageTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
