# Console Log Pipe - Quality Assurance Testing Guide

**Version:** 2.3.0-beta.2  
**Date:** July 19, 2025  
**Testing Type:** Beta Release Validation  
**Repository:** https://github.com/kgptapps/consolelogpipe

## 📋 Executive Summary

Console Log Pipe is an AI-friendly web console integration tool that streams browser console logs,
errors, and network requests directly to development environments. This document provides
comprehensive testing procedures for the beta release.

## 🎯 Testing Scope

### Core Components to Test

1. **CLI Tool** (`@kansnpms/console-log-pipe-cli@beta`) - Global command-line interface
2. **Client Library** (`@kansnpms/console-log-pipe-client@beta`) - Browser integration library
3. **Storage Monitor** (`@kansnpms/console-log-pipe-storage-beta@beta`) - Browser storage monitoring
   (Beta)

### Key Features

- ✅ Real-time log streaming via WebSocket
- ✅ Multi-application monitoring support
- ✅ Network request/response capture
- ✅ Browser storage monitoring (localStorage, sessionStorage, cookies, IndexedDB)
- ✅ AI-friendly structured output
- ✅ Cross-platform compatibility (Windows, macOS, Linux)

## 🚀 Pre-Testing Setup

### System Requirements

- **Node.js:** >= 16.0.0
- **NPM:** >= 7.0.0
- **Operating Systems:** Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Installation Commands

```bash
# Install CLI globally (required first)
npm install -g @kansnpms/console-log-pipe-cli@beta

# Install client library for web applications
npm install @kansnpms/console-log-pipe-client@beta

# Install storage monitor (optional beta feature)
npm install @kansnpms/console-log-pipe-storage-beta@beta
```

### Verification Commands

```bash
# Verify CLI installation
clp --version
# Expected: 2.3.0-beta.2

# Verify global command aliases work
console-log-pipe --version
# Expected: 2.3.0-beta.2

# Check help documentation
clp --help
# Expected: Display command options and usage
```

## 🧪 Test Cases

### Test Suite 1: CLI Tool Functionality

#### TC1.1: Basic CLI Operations

**Objective:** Verify CLI installation and basic commands work correctly

**Steps:**

1. Install CLI globally: `npm install -g @kansnpms/console-log-pipe-cli@beta`
2. Run version check: `clp --version`
3. Run help command: `clp --help`
4. Test command aliases: `console-log-pipe --version`

**Expected Results:**

- Version displays as `2.3.0-beta.2`
- Help shows available commands and options
- Both `clp` and `console-log-pipe` commands work

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC1.2: Server Startup and Port Management

**Objective:** Test server startup with different port configurations

**Steps:**

1. Start server: `clp start --port 3001`
2. Verify server starts and displays startup message
3. Test port conflict: Start another instance on same port
4. Stop server with Ctrl+C
5. Test different port: `clp start --port 3002`

**Expected Results:**

- Server starts successfully on specified port
- Clear startup message with port information
- Port conflict handled gracefully
- Clean shutdown with Ctrl+C
- Different ports work independently

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC1.3: Multi-Application Support

**Objective:** Verify multiple server instances can run simultaneously

**Steps:**

1. Open 3 terminal windows
2. Start servers on different ports:
   - Terminal 1: `clp start --port 3001`
   - Terminal 2: `clp start --port 3002`
   - Terminal 3: `clp start --port 3003`
3. Verify all servers run independently
4. Stop all servers

**Expected Results:**

- All three servers start without conflicts
- Each shows distinct port information
- Servers operate independently
- Clean shutdown for all instances

**Pass/Fail:** \***\*\_\_\_\*\***

### Test Suite 2: Client Library Integration

#### TC2.1: NPM Package Installation

**Objective:** Verify client library installs correctly in web projects

**Steps:**

1. Create test directory: `mkdir clp-test && cd clp-test`
2. Initialize npm project: `npm init -y`
3. Install client: `npm install @kansnpms/console-log-pipe-client@beta`
4. Verify package in node_modules and package.json

**Expected Results:**

- Package installs without errors
- Listed in package.json dependencies
- Files present in node_modules/@kansnpms/console-log-pipe-client/

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC2.2: Browser Integration - Basic Setup

**Objective:** Test basic client initialization in browser environment

**Test HTML File:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Console Log Pipe Test</title>
  </head>
  <body>
    <h1>Console Log Pipe Test Page</h1>
    <button onclick="testLogs()">Generate Test Logs</button>

    <script type="module">
      import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';

      // Initialize with server port
      ConsoleLogPipe.init({ port: 3001 });

      window.testLogs = function () {
        console.log('Test log message');
        console.error('Test error message');
        console.warn('Test warning message');
        console.info('Test info message');
      };
    </script>
  </body>
</html>
```

**Steps:**

1. Start CLI server: `clp start --port 3001`
2. Create and serve test HTML file
3. Open in browser and click "Generate Test Logs"
4. Verify logs appear in CLI terminal

**Expected Results:**

- Client initializes without errors
- Console logs appear in CLI terminal in real-time
- All log levels (log, error, warn, info) captured
- Structured, readable output in terminal

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC2.3: Network Request Monitoring

**Objective:** Verify network request/response capture functionality

**Test HTML Addition:**

```html
<button onclick="testNetworkRequests()">Test Network Requests</button>

<script>
  window.testNetworkRequests = function () {
    // Test fetch request
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => response.json())
      .then(data => console.log('Fetch successful:', data));

    // Test XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/users/1');
    xhr.onload = () => console.log('XHR successful:', xhr.responseText);
    xhr.send();
  };
</script>
```

**Steps:**

1. Add network test code to HTML file
2. Click "Test Network Requests" button
3. Verify network requests appear in CLI terminal
4. Check request/response details are captured

**Expected Results:**

- Network requests captured and displayed
- Request details (URL, method, headers) shown
- Response data included
- Both fetch() and XMLHttpRequest captured

**Pass/Fail:** \***\*\_\_\_\*\***

### Test Suite 3: Storage Monitor (Beta Feature)

#### TC3.1: Storage Monitor Installation

**Objective:** Verify storage monitor package installs correctly

**Steps:**

1. Install storage monitor: `npm install @kansnpms/console-log-pipe-storage-beta@beta`
2. Verify CLI recognizes storage command: `clp storage --help`
3. Check package dependencies are satisfied

**Expected Results:**

- Package installs without dependency conflicts
- CLI shows storage command in help
- Storage monitor ready for use

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC3.2: Storage Monitoring - Basic Functionality

**Objective:** Test real-time browser storage monitoring

**Steps:**

1. Start storage monitor: `clp storage --port 3002`
2. Create test HTML with storage operations:

```html
<button onclick="testStorage()">Test Storage Operations</button>

<script type="module">
  import StorageMonitor from './node_modules/@kansnpms/console-log-pipe-storage-beta/dist/storage-monitor.umd.js';

  await StorageMonitor.init({ serverPort: 3002 });

  window.testStorage = function () {
    // Test localStorage
    localStorage.setItem('test-key', 'test-value');
    localStorage.setItem('user-data', JSON.stringify({ name: 'John', age: 30 }));

    // Test sessionStorage
    sessionStorage.setItem('session-key', 'session-value');

    // Test cookies
    document.cookie = 'test-cookie=cookie-value; path=/';

    // Modify existing items
    localStorage.setItem('test-key', 'modified-value');

    // Delete items
    localStorage.removeItem('user-data');
  };
</script>
```

3. Click "Test Storage Operations"
4. Verify storage changes appear in CLI with color coding

**Expected Results:**

- Storage monitor connects successfully
- localStorage changes captured (green=add, yellow=modify, red=delete)
- sessionStorage changes captured
- Cookie changes captured
- Color-coded output in terminal
- Real-time updates without page refresh

**Pass/Fail:** \***\*\_\_\_\*\***

### Test Suite 4: Cross-Platform Compatibility

#### TC4.1: Windows Compatibility

**Objective:** Verify functionality on Windows systems

**Steps:**

1. Test on Windows 10/11 system
2. Install CLI via PowerShell and Command Prompt
3. Run basic functionality tests
4. Test with Windows-specific paths and characters

**Expected Results:**

- Installation works in both PowerShell and CMD
- CLI commands execute properly
- File paths handled correctly
- No Windows-specific errors

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC4.2: macOS Compatibility

**Objective:** Verify functionality on macOS systems

**Steps:**

1. Test on macOS 10.15+ system
2. Install CLI via Terminal
3. Run basic functionality tests
4. Test with macOS-specific paths

**Expected Results:**

- Installation works in Terminal
- CLI commands execute properly
- Unix paths handled correctly
- No macOS-specific errors

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC4.3: Linux Compatibility

**Objective:** Verify functionality on Linux systems

**Steps:**

1. Test on Ubuntu 18.04+ or similar distribution
2. Install CLI via terminal
3. Run basic functionality tests
4. Test with Linux-specific paths and permissions

**Expected Results:**

- Installation works in terminal
- CLI commands execute properly
- Linux paths and permissions handled correctly
- No Linux-specific errors

**Pass/Fail:** \***\*\_\_\_\*\***

### Test Suite 5: Error Handling and Edge Cases

#### TC5.1: Network Connectivity Issues

**Objective:** Test behavior when network connectivity is poor or interrupted

**Steps:**

1. Start CLI server
2. Initialize client in browser
3. Simulate network interruption (disconnect WiFi)
4. Generate logs during disconnection
5. Restore network connection
6. Verify reconnection and log delivery

**Expected Results:**

- Client handles disconnection gracefully
- Logs queued during disconnection
- Automatic reconnection when network restored
- Queued logs delivered after reconnection
- No data loss or corruption

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC5.2: Invalid Port Handling

**Objective:** Test CLI behavior with invalid port configurations

**Steps:**

1. Test invalid port numbers:
   - `clp start --port 0`
   - `clp start --port 99999`
   - `clp start --port abc`
   - `clp start` (no port specified)
2. Verify error messages are clear and helpful

**Expected Results:**

- Clear error messages for invalid ports
- Helpful suggestions for valid port ranges
- CLI doesn't crash or hang
- Graceful error handling

**Pass/Fail:** \***\*\_\_\_\*\***

#### TC5.3: Large Data Volume Handling

**Objective:** Test system performance with high-volume logging

**Test Code:**

```javascript
// Generate high-volume logs
function generateHighVolumeTest() {
  for (let i = 0; i < 1000; i++) {
    console.log(`High volume test log ${i}:`, {
      timestamp: new Date().toISOString(),
      data: 'x'.repeat(100),
      iteration: i,
    });
  }
}
```

**Steps:**

1. Start CLI server
2. Initialize client
3. Run high-volume test function
4. Monitor CLI terminal and browser performance
5. Verify all logs are captured

**Expected Results:**

- All logs captured without loss
- No significant performance degradation
- Memory usage remains reasonable
- No browser or CLI crashes

**Pass/Fail:** \***\*\_\_\_\*\***

## 📊 Test Results Summary

### Overall Test Results

- **Total Test Cases:** **\_**
- **Passed:** **\_**
- **Failed:** **\_**
- **Blocked:** **\_**
- **Pass Rate:** **\_**%

### Critical Issues Found

1. ***
2. ***
3. ***

### Recommendations

1. ***
2. ***
3. ***

## 🔍 Additional Testing Notes

### Browser Compatibility Matrix

| Browser | Version | Status | Notes  |
| ------- | ------- | ------ | ------ |
| Chrome  | 90+     | \_\_\_ | **\_** |
| Firefox | 88+     | \_\_\_ | **\_** |
| Safari  | 14+     | \_\_\_ | **\_** |
| Edge    | 90+     | \_\_\_ | **\_** |

### Performance Benchmarks

- **Startup Time:** **\_** seconds
- **Log Delivery Latency:** **\_** ms
- **Memory Usage (CLI):** **\_** MB
- **Memory Usage (Browser):** **\_** MB

## 📞 Support Information

- **Repository:** https://github.com/kgptapps/consolelogpipe
- **Issues:** https://github.com/kgptapps/consolelogpipe/issues
- **Documentation:** https://github.com/kgptapps/consolelogpipe#readme

## 🎯 Quick Start Testing Checklist

For rapid validation, complete these essential tests first:

### ✅ 5-Minute Smoke Test

1. **Install CLI:** `npm install -g @kansnpms/console-log-pipe-cli@beta`
2. **Start Server:** `clp start --port 3001`
3. **Create Test HTML:** Copy TC2.2 test file
4. **Generate Logs:** Click test button, verify logs appear in terminal
5. **Test Network:** Click network test button, verify requests captured

### ✅ 10-Minute Core Feature Test

1. Complete 5-minute smoke test
2. **Install Storage Monitor:** `npm install @kansnpms/console-log-pipe-storage-beta@beta`
3. **Test Storage Monitoring:** `clp storage --port 3002`
4. **Multi-Port Test:** Run both servers simultaneously
5. **Error Handling:** Test invalid port, verify error messages

## 📋 Test Environment Setup Scripts

### Automated Test Environment Setup

```bash
#!/bin/bash
# setup-test-env.sh

echo "Setting up Console Log Pipe test environment..."

# Create test directory
mkdir -p clp-qa-test
cd clp-qa-test

# Install packages
echo "Installing packages..."
npm init -y
npm install @kansnpms/console-log-pipe-client@beta
npm install @kansnpms/console-log-pipe-storage-beta@beta

# Create test HTML file
cat > test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Console Log Pipe QA Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        button { margin: 10px; padding: 10px 20px; font-size: 16px; }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h1>Console Log Pipe QA Test Suite</h1>

    <div class="test-section">
        <h2>Basic Logging Test</h2>
        <button onclick="testBasicLogs()">Test Basic Logs</button>
        <button onclick="testErrorLogs()">Test Error Logs</button>
    </div>

    <div class="test-section">
        <h2>Network Request Test</h2>
        <button onclick="testNetworkRequests()">Test Network Requests</button>
    </div>

    <div class="test-section">
        <h2>Storage Monitor Test</h2>
        <button onclick="testStorageOperations()">Test Storage Operations</button>
    </div>

    <div class="test-section">
        <h2>High Volume Test</h2>
        <button onclick="testHighVolume()">Generate 100 Logs</button>
    </div>

    <script type="module">
        import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';

        // Initialize Console Log Pipe
        ConsoleLogPipe.init({ port: 3001 });
        console.log('Console Log Pipe initialized for QA testing');

        // Basic logging tests
        window.testBasicLogs = function() {
            console.log('✅ Basic log message');
            console.info('ℹ️ Info message with data:', { test: true, timestamp: new Date() });
            console.warn('⚠️ Warning message');
        };

        window.testErrorLogs = function() {
            console.error('❌ Error message');
            console.error('❌ Error with stack trace:', new Error('Test error'));
            try {
                throw new Error('Caught error test');
            } catch (e) {
                console.error('❌ Caught error:', e);
            }
        };

        // Network request tests
        window.testNetworkRequests = function() {
            console.log('🌐 Starting network request tests...');

            // Test fetch
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(response => response.json())
                .then(data => console.log('✅ Fetch successful:', data))
                .catch(err => console.error('❌ Fetch failed:', err));

            // Test XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://jsonplaceholder.typicode.com/users/1');
            xhr.onload = () => console.log('✅ XHR successful:', JSON.parse(xhr.responseText));
            xhr.onerror = () => console.error('❌ XHR failed');
            xhr.send();
        };

        // Storage operations test
        window.testStorageOperations = function() {
            console.log('💾 Starting storage operations test...');

            // localStorage operations
            localStorage.setItem('qa-test-string', 'Hello QA Team!');
            localStorage.setItem('qa-test-object', JSON.stringify({
                tester: 'QA Team',
                timestamp: new Date().toISOString(),
                testId: Math.random().toString(36).substr(2, 9)
            }));

            // sessionStorage operations
            sessionStorage.setItem('qa-session-test', 'Session data for QA');

            // Cookie operations
            document.cookie = 'qa-test-cookie=QA-Testing-Value; path=/';

            // Modify existing data
            setTimeout(() => {
                localStorage.setItem('qa-test-string', 'Modified by QA Test!');
                console.log('💾 Storage operations completed');
            }, 1000);

            // Clean up after 5 seconds
            setTimeout(() => {
                localStorage.removeItem('qa-test-object');
                sessionStorage.clear();
                console.log('💾 Storage cleanup completed');
            }, 5000);
        };

        // High volume test
        window.testHighVolume = function() {
            console.log('🚀 Starting high volume test...');
            for (let i = 1; i <= 100; i++) {
                console.log(`📊 High volume log ${i}/100:`, {
                    iteration: i,
                    timestamp: new Date().toISOString(),
                    randomData: Math.random().toString(36).substr(2, 10)
                });
            }
            console.log('🚀 High volume test completed');
        };
    </script>

    <!-- Storage Monitor Integration -->
    <script type="module">
        try {
            const StorageMonitor = await import('./node_modules/@kansnpms/console-log-pipe-storage-beta/dist/storage-monitor.umd.js');
            await StorageMonitor.default.init({ serverPort: 3002 });
            console.log('🍪 Storage Monitor initialized for QA testing');
        } catch (error) {
            console.warn('⚠️ Storage Monitor not available (run: clp storage --port 3002)');
        }
    </script>
</body>
</html>
EOF

echo "✅ Test environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Install CLI globally: npm install -g @kansnpms/console-log-pipe-cli@beta"
echo "2. Start main server: clp start --port 3001"
echo "3. Start storage monitor: clp storage --port 3002"
echo "4. Open test.html in your browser"
echo "5. Run the test buttons and verify output in terminals"
```

### Windows PowerShell Setup

```powershell
# setup-test-env.ps1
Write-Host "Setting up Console Log Pipe test environment for Windows..." -ForegroundColor Green

# Create test directory
New-Item -ItemType Directory -Force -Path "clp-qa-test"
Set-Location "clp-qa-test"

# Install packages
Write-Host "Installing packages..." -ForegroundColor Yellow
npm init -y
npm install @kansnpms/console-log-pipe-client@beta
npm install @kansnpms/console-log-pipe-storage-beta@beta

Write-Host "✅ Test environment setup complete!" -ForegroundColor Green
Write-Host "Run the bash script content above to create test.html file" -ForegroundColor Yellow
```

## 🐛 Known Issues and Workarounds

### Issue 1: Port Already in Use

**Symptom:** Error when starting CLI server **Workaround:** Use different port or kill existing
process **Command:** `lsof -ti:3001 | xargs kill -9` (macOS/Linux) or `netstat -ano | findstr :3001`
(Windows)

### Issue 2: Module Import Errors

**Symptom:** Browser console shows module import errors **Workaround:** Serve HTML file via local
server (not file://) **Command:** `python -m http.server 8000` or `npx serve .`

### Issue 3: Storage Monitor Connection Issues

**Symptom:** Storage monitor fails to connect **Workaround:** Ensure CLI storage server is running
first **Command:** `clp storage --port 3002` before loading web page

## 📈 Performance Expectations

### Baseline Performance Metrics

- **CLI Startup Time:** < 2 seconds
- **WebSocket Connection:** < 500ms
- **Log Delivery Latency:** < 100ms
- **Memory Usage (CLI):** < 50MB
- **Memory Usage (Browser Client):** < 10MB
- **Network Overhead:** < 1KB per log message

### Load Testing Targets

- **Concurrent Connections:** Up to 10 browser tabs
- **Log Volume:** 1000 logs/minute per connection
- **Storage Operations:** 100 operations/minute
- **Network Requests:** 50 requests/minute

---

**Document Version:** 1.0 **Last Updated:** July 19, 2025 **Tester Name:**
****\*\*****\_****\*\***** **Date Completed:** **\*\*\*\***\_\_\_**\*\*\*\*** **Signature:**
****\*\*****\_\_\_****\*\*****
