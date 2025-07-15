#!/usr/bin/env node

/**
 * Manual Test for Console Log Pipe Packages
 * Simple verification that packages are installed and working
 */

const { spawn } = require('child_process');
const { writeFileSync, existsSync } = require('fs');
const path = require('path');

class ManualTester {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkCLIPackage() {
    this.log('Checking CLI Package...', 'info');
    
    return new Promise((resolve, reject) => {
      const process = spawn('npx', ['clp', '--version'], { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.includes('1.1.24')) {
          this.log(`CLI Package: ✅ Version ${output.trim()}`, 'success');
          this.results.push('✅ CLI Package installed and working');
          resolve();
        } else {
          this.log(`CLI Package: ❌ Failed (code: ${code}, output: ${output})`, 'error');
          this.results.push('❌ CLI Package failed');
          reject(new Error('CLI package check failed'));
        }
      });
      
      process.on('error', (error) => {
        this.log(`CLI Package: ❌ Error: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async checkClientPackage() {
    this.log('Checking Client Package...', 'info');
    
    try {
      const clientPath = path.join(process.cwd(), 'node_modules', '@kansnpms', 'console-log-pipe-client');
      const packageJsonPath = path.join(clientPath, 'package.json');
      const distPath = path.join(clientPath, 'dist');
      
      if (!existsSync(packageJsonPath)) {
        throw new Error('Client package.json not found');
      }
      
      if (!existsSync(distPath)) {
        throw new Error('Client dist directory not found');
      }
      
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.version !== '1.1.24') {
        throw new Error(`Expected version 1.1.24, got ${packageJson.version}`);
      }
      
      // Check dist files
      const files = ['console-log-pipe.esm.js', 'console-log-pipe.cjs.js', 'console-log-pipe.umd.js'];
      for (const file of files) {
        const filePath = path.join(distPath, file);
        if (!existsSync(filePath)) {
          throw new Error(`Dist file not found: ${file}`);
        }
      }
      
      this.log(`Client Package: ✅ Version ${packageJson.version}`, 'success');
      this.results.push('✅ Client Package installed and working');
      
    } catch (error) {
      this.log(`Client Package: ❌ ${error.message}`, 'error');
      this.results.push('❌ Client Package failed');
      throw error;
    }
  }

  createTestHTML() {
    this.log('Creating test HTML file...', 'info');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe Manual Test</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { padding: 10px 20px; margin: 5px; font-size: 16px; cursor: pointer; }
        .log-output { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Console Log Pipe Manual Test</h1>
        
        <div class="info status">
            <strong>Instructions:</strong>
            <ol>
                <li>Start the CLI server: <code>npx clp start test-app --port 3007</code></li>
                <li>Click the "Run Tests" button below</li>
                <li>Check both browser console and CLI terminal for logs</li>
                <li>Verify logs appear in both places</li>
            </ol>
        </div>
        
        <button onclick="runTests()">🚀 Run Tests</button>
        <button onclick="clearLogs()">🧹 Clear Logs</button>
        
        <div id="status"></div>
        <div id="logs" class="log-output"></div>
    </div>

    <script src="./node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.umd.js"></script>
    <script>
        let logCount = 0;
        
        function updateStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.className = 'status ' + type;
            statusDiv.innerHTML = message;
        }
        
        function addLog(message) {
            const logsDiv = document.getElementById('logs');
            const timestamp = new Date().toISOString();
            logsDiv.innerHTML += timestamp + ': ' + message + '\\n';
            logsDiv.scrollTop = logsDiv.scrollHeight;
        }
        
        function clearLogs() {
            document.getElementById('logs').innerHTML = '';
            console.clear();
            logCount = 0;
        }
        
        function runTests() {
            updateStatus('🧪 Running tests...', 'info');
            addLog('=== Starting Console Log Pipe Tests ===');
            
            try {
                // Test 1: Check if ConsoleLogPipe is available
                if (typeof ConsoleLogPipe !== 'undefined') {
                    addLog('✅ ConsoleLogPipe is available globally');
                    console.log('✅ ConsoleLogPipe is available globally');
                } else {
                    addLog('❌ ConsoleLogPipe not found');
                    console.error('❌ ConsoleLogPipe not found');
                    updateStatus('❌ ConsoleLogPipe not found', 'error');
                    return;
                }
                
                // Test 2: Check version
                if (ConsoleLogPipe.version === '1.1.24') {
                    addLog('✅ Version check passed: ' + ConsoleLogPipe.version);
                    console.log('✅ Version check passed: ' + ConsoleLogPipe.version);
                } else {
                    addLog('❌ Version check failed: ' + ConsoleLogPipe.version);
                    console.error('❌ Version check failed: ' + ConsoleLogPipe.version);
                }
                
                // Test 3: Initialize
                ConsoleLogPipe.init({
                    applicationName: 'test-app',
                    port: 3007
                });
                addLog('✅ ConsoleLogPipe initialized successfully');
                console.log('✅ ConsoleLogPipe initialized successfully');
                
                // Test 4: Test different log levels
                setTimeout(() => {
                    console.log('🧪 Test log message #' + (++logCount));
                    console.error('🧪 Test error message #' + (++logCount));
                    console.warn('🧪 Test warning message #' + (++logCount));
                    console.info('🧪 Test info message #' + (++logCount));
                    
                    addLog('✅ Sent 4 different log level messages');
                }, 1000);
                
                // Test 5: Test object logging
                setTimeout(() => {
                    const testObject = {
                        name: 'Test Object',
                        timestamp: new Date().toISOString(),
                        data: [1, 2, 3, 4, 5],
                        nested: { key: 'value', number: 42 }
                    };
                    console.log('🧪 Test object #' + (++logCount) + ':', testObject);
                    addLog('✅ Sent object log message');
                }, 2000);
                
                // Test 6: Test network request
                setTimeout(() => {
                    fetch('https://jsonplaceholder.typicode.com/posts/1')
                        .then(response => response.json())
                        .then(data => {
                            console.log('🧪 Network request completed #' + (++logCount) + ':', data.title);
                            addLog('✅ Network request test completed');
                        })
                        .catch(error => {
                            console.error('🧪 Network request failed #' + (++logCount) + ':', error);
                            addLog('❌ Network request test failed');
                        });
                }, 3000);
                
                // Test 7: Test error with stack trace
                setTimeout(() => {
                    try {
                        throw new Error('🧪 Test error with stack trace #' + (++logCount));
                    } catch (error) {
                        console.error('🧪 Caught error #' + (++logCount) + ':', error);
                        addLog('✅ Error with stack trace test completed');
                    }
                }, 4000);
                
                setTimeout(() => {
                    updateStatus('🎉 All tests completed! Check CLI terminal for captured logs.', 'success');
                    addLog('=== Tests completed! Total messages sent: ' + logCount + ' ===');
                }, 5000);
                
            } catch (error) {
                addLog('❌ Test failed: ' + error.message);
                console.error('❌ Test failed:', error);
                updateStatus('❌ Test failed: ' + error.message, 'error');
            }
        }
        
        // Auto-run tests when page loads (after a delay)
        window.addEventListener('load', function() {
            updateStatus('Ready to test! Click "Run Tests" button.', 'info');
        });
    </script>
</body>
</html>`;
    
    writeFileSync('manual-test.html', html);
    this.log('Created manual-test.html', 'success');
    this.results.push('✅ Test HTML file created');
  }

  async runAllChecks() {
    this.log('🚀 Starting Manual Package Verification', 'info');
    this.log('='.repeat(60), 'info');
    
    try {
      await this.checkCLIPackage();
      await this.checkClientPackage();
      this.createTestHTML();
      
      this.log('='.repeat(60), 'info');
      this.log('📊 Verification Results:', 'info');
      this.results.forEach(result => this.log(result, 'info'));
      
      this.log('='.repeat(60), 'info');
      this.log('🎉 All package checks passed!', 'success');
      this.log('', 'info');
      this.log('📝 Next Steps for Manual Testing:', 'info');
      this.log('1. Start CLI server: npx clp start test-app --port 3007', 'info');
      this.log('2. Open manual-test.html in your browser', 'info');
      this.log('3. Click "Run Tests" button', 'info');
      this.log('4. Verify logs appear in both browser console and CLI terminal', 'info');
      this.log('5. Check that real-time streaming is working', 'info');
      
    } catch (error) {
      this.log('='.repeat(60), 'info');
      this.log('❌ Verification failed:', 'error');
      this.log(error.message, 'error');
      process.exit(1);
    }
  }
}

// Run verification
const tester = new ManualTester();
tester.runAllChecks();
