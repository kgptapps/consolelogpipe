#!/usr/bin/env node

/**
 * Browser Client Package Test
 * Tests the @kansnpms/console-log-pipe-client package functionality
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import WebSocket from 'ws';

const sleep = promisify(setTimeout);

class BrowserTester {
  constructor() {
    this.testResults = [];
    this.serverProcess = null;
    this.browser = null;
    this.page = null;
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

  async startServer() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 15000);

      this.serverProcess = spawn('npx', ['clp', 'start', '--port', '3003'], {
        stdio: 'pipe'
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server running on port 3003')) {
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

  async setupBrowser() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
  }

  async closeBrowser() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  createTestHTML() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe Test</title>
    <script type="module">
        import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';
        
        window.ConsoleLogPipe = ConsoleLogPipe;
        window.testResults = [];
        
        // Test 1: Package Import
        window.testResults.push({
            name: 'Package Import',
            status: typeof ConsoleLogPipe !== 'undefined' ? 'PASS' : 'FAIL'
        });
        
        // Test 2: API Available
        window.testResults.push({
            name: 'API Available',
            status: typeof ConsoleLogPipe.init === 'function' ? 'PASS' : 'FAIL'
        });
        
        // Test 3: Version Check
        window.testResults.push({
            name: 'Version Check',
            status: ConsoleLogPipe.version === '1.1.24' ? 'PASS' : 'FAIL'
        });
        
        // Test 4: Initialize
        try {
            ConsoleLogPipe.init();
            window.testResults.push({
                name: 'Initialize',
                status: 'PASS'
            });
        } catch (error) {
            window.testResults.push({
                name: 'Initialize',
                status: 'FAIL',
                error: error.message
            });
        }
        
        // Test 5: Console Log Capture
        setTimeout(() => {
            console.log('Test log message');
            console.error('Test error message');
            console.warn('Test warning message');
            console.info('Test info message');
            
            window.testResults.push({
                name: 'Console Log Capture',
                status: 'PASS'
            });
        }, 1000);
        
        // Test 6: Network Request Capture
        setTimeout(() => {
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(response => response.json())
                .then(data => {
                    window.testResults.push({
                        name: 'Network Request Capture',
                        status: 'PASS'
                    });
                })
                .catch(error => {
                    window.testResults.push({
                        name: 'Network Request Capture',
                        status: 'FAIL',
                        error: error.message
                    });
                });
        }, 2000);
    </script>
</head>
<body>
    <h1>Console Log Pipe Test Page</h1>
    <p>Check console for test results</p>
</body>
</html>`;
    
    writeFileSync(join(process.cwd(), 'test.html'), html);
  }

  async testPackageImport() {
    const packagePath = './node_modules/@kansnpms/console-log-pipe-client/package.json';
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    if (packageJson.version !== '1.1.24') {
      throw new Error(`Expected version 1.1.24, got ${packageJson.version}`);
    }
  }

  async testBrowserIntegration() {
    this.createTestHTML();
    
    await this.page.goto(`file://${join(process.cwd(), 'test.html')}`);
    
    // Wait for tests to complete
    await sleep(5000);
    
    const results = await this.page.evaluate(() => window.testResults);
    
    for (const result of results) {
      if (result.status !== 'PASS') {
        throw new Error(`Browser test failed: ${result.name} - ${result.error || 'Unknown error'}`);
      }
    }
  }

  async testWebSocketConnection() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3003');
      
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

  async runAllTests() {
    this.log('🚀 Starting Browser Client Package Tests', 'info');
    
    try {
      await this.test('Package Import', () => this.testPackageImport());
      
      this.log('Starting server for integration tests...', 'info');
      await this.startServer();
      await sleep(2000); // Give server time to start
      
      await this.test('WebSocket Connection', () => this.testWebSocketConnection());
      
      this.log('Setting up browser for testing...', 'info');
      await this.setupBrowser();
      
      await this.test('Browser Integration', () => this.testBrowserIntegration());
      
    } finally {
      await this.closeBrowser();
      await this.stopServer();
    }

    this.printResults();
  }

  printResults() {
    this.log('\n📊 Browser Client Test Results:', 'info');
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
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests
const tester = new BrowserTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
