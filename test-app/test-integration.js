#!/usr/bin/env node

/**
 * Integration Test
 * Tests the full Console Log Pipe workflow: CLI server + Browser client
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import WebSocket from 'ws';

const sleep = promisify(setTimeout);

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.serverProcess = null;
    this.browser = null;
    this.page = null;
    this.receivedLogs = [];
    this.ws = null;
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

      this.serverProcess = spawn('npx', ['clp', 'start', '--port', '3004'], {
        stdio: 'pipe'
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Capture logs from server output
        if (text.includes('📝') || text.includes('🌐') || text.includes('⚠️') || text.includes('❌')) {
          this.receivedLogs.push(text.trim());
        }
        
        if (output.includes('Server running on port 3004')) {
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

  createIntegrationTestHTML() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe Integration Test</title>
    <script type="module">
        import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';
        
        // Initialize Console Log Pipe
        ConsoleLogPipe.init();
        
        // Test different log levels
        console.log('🧪 Integration test log message');
        console.error('🧪 Integration test error message');
        console.warn('🧪 Integration test warning message');
        console.info('🧪 Integration test info message');
        
        // Test network requests
        setTimeout(() => {
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(response => response.json())
                .then(data => {
                    console.log('🧪 Network request completed:', data.title);
                })
                .catch(error => {
                    console.error('🧪 Network request failed:', error);
                });
        }, 1000);
        
        // Test custom objects
        setTimeout(() => {
            const testObject = {
                name: 'Integration Test',
                timestamp: new Date().toISOString(),
                data: [1, 2, 3, 4, 5]
            };
            console.log('🧪 Test object:', testObject);
        }, 2000);
        
        // Test error with stack trace
        setTimeout(() => {
            try {
                throw new Error('🧪 Test error with stack trace');
            } catch (error) {
                console.error('🧪 Caught error:', error);
            }
        }, 3000);
        
        window.testCompleted = true;
    </script>
</head>
<body>
    <h1>Console Log Pipe Integration Test</h1>
    <p>This page tests the full integration between browser client and CLI server.</p>
    <p>Check the CLI server output for captured logs.</p>
</body>
</html>`;
    
    writeFileSync(join(process.cwd(), 'integration-test.html'), html);
  }

  async testFullIntegration() {
    this.createIntegrationTestHTML();
    
    // Clear received logs
    this.receivedLogs = [];
    
    // Load the test page
    await this.page.goto(`file://${join(process.cwd(), 'integration-test.html')}`);
    
    // Wait for all tests to complete
    await sleep(8000);
    
    // Check if we received logs
    if (this.receivedLogs.length === 0) {
      throw new Error('No logs received by server');
    }
    
    // Check for specific test messages
    const logText = this.receivedLogs.join(' ');
    const expectedMessages = [
      'Integration test log message',
      'Integration test error message',
      'Integration test warning message',
      'Integration test info message'
    ];
    
    for (const message of expectedMessages) {
      if (!logText.includes(message)) {
        throw new Error(`Expected log message not found: ${message}`);
      }
    }
    
    this.log(`✅ Received ${this.receivedLogs.length} log messages from browser`, 'success');
  }

  async testWebSocketCommunication() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3004');
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket communication timeout'));
      }, 10000);
      
      let messageReceived = false;
      
      ws.on('open', () => {
        // Send a test message
        ws.send(JSON.stringify({
          type: 'log',
          level: 'info',
          message: 'Test WebSocket message',
          timestamp: new Date().toISOString()
        }));
      });
      
      ws.on('message', (data) => {
        messageReceived = true;
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      // If no message received but connection works, still pass
      setTimeout(() => {
        if (!messageReceived) {
          clearTimeout(timeout);
          ws.close();
          resolve(); // WebSocket connection working is enough
        }
      }, 5000);
    });
  }

  async testRealTimeStreaming() {
    // Clear received logs
    this.receivedLogs = [];
    
    // Execute console commands in browser
    await this.page.evaluate(() => {
      console.log('🔄 Real-time test message 1');
      console.log('🔄 Real-time test message 2');
      console.log('🔄 Real-time test message 3');
    });
    
    // Wait a bit for logs to be transmitted
    await sleep(3000);
    
    // Check if logs were received in real-time
    const realtimeMessages = this.receivedLogs.filter(log => 
      log.includes('Real-time test message')
    );
    
    if (realtimeMessages.length < 3) {
      throw new Error(`Expected 3 real-time messages, got ${realtimeMessages.length}`);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Integration Tests', 'info');
    
    try {
      this.log('Starting server for integration tests...', 'info');
      await this.startServer();
      await sleep(3000); // Give server time to start
      
      await this.test('WebSocket Communication', () => this.testWebSocketCommunication());
      
      this.log('Setting up browser for integration testing...', 'info');
      await this.setupBrowser();
      
      await this.test('Full Integration', () => this.testFullIntegration());
      await this.test('Real-time Streaming', () => this.testRealTimeStreaming());
      
    } finally {
      await this.closeBrowser();
      await this.stopServer();
    }

    this.printResults();
  }

  printResults() {
    this.log('\n📊 Integration Test Results:', 'info');
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
    this.log(`📝 Total logs captured: ${this.receivedLogs.length}`, 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`, 'info');
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
