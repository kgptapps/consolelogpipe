# Console Log Pipe - Simple Quality Test

**Version:** 2.3.1 **Test Duration:** 15 minutes **Status:** Production Ready ✅

## 🎯 Quick Overview

Console Log Pipe streams browser console logs and storage changes to your CLI terminal in real-time.
Test all core functionality with this simple guide.

## 📋 Pre-Test Setup (2 minutes)

### Install Required Packages

```bash
# Install CLI globally
npm install -g @kansnpms/console-log-pipe-cli

# Verify installation
clp --version
# Expected: 2.3.1
```

### Create Test Project

```bash
# Create test directory
mkdir clp-test && cd clp-test
npm init -y

# Install client packages
npm install @kansnpms/console-log-pipe-client
npm install @kansnpms/console-log-pipe-storage-beta
```

## 🧪 Core Tests (10 minutes)

### Test 1: CLI Basic Functionality (2 minutes)

**Objective:** Verify CLI commands work correctly

**Steps:**

1. Run help command: `clp --help`
2. Check version: `clp --version`
3. Start server: `clp start --port 3001`

**Expected Results:**

- Help shows available commands
- Version displays `2.3.1`
- Server starts with message: "Console Log Pipe server started on port 3001"
- No error messages

**Pass/Fail:** \***\*\_\_\_\*\***

### Test 2: Browser Integration (3 minutes)

**Objective:** Test console log streaming from browser to CLI

**Setup:** Create `test.html` file:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CLP Test</title>
  </head>
  <body>
    <h1>Console Log Pipe Test</h1>
    <button onclick="testLogs()">Test Console Logs</button>

    <script type="module">
      import ConsoleLogPipe from './node_modules/@kansnpms/console-log-pipe-client/dist/console-log-pipe.esm.js';

      ConsoleLogPipe.init({ port: 3001 });

      window.testLogs = function () {
        console.log('✅ Test log message');
        console.error('❌ Test error message');
        console.warn('⚠️ Test warning message');
        console.info('ℹ️ Test info message');
      };
    </script>
  </body>
</html>
```

**Steps:**

1. Ensure CLI server is running: `clp start --port 3001`
2. Serve HTML file: `python -m http.server 8000` (or `npx serve .`)
3. Open browser: `http://localhost:8000/test.html`
4. Click "Test Console Logs" button
5. Check CLI terminal for log messages

**Expected Results:**

- All 4 log messages appear in CLI terminal
- Messages show correct log levels (log, error, warn, info)
- Real-time delivery (< 1 second delay)
- Structured, readable output

**Pass/Fail:** \***\*\_\_\_\*\***

### Test 3: Network Request Monitoring (2 minutes)

**Objective:** Verify network request capture functionality

**Setup:** Add to `test.html` (inside script tag):

```javascript
window.testNetwork = function () {
  fetch('https://jsonplaceholder.typicode.com/posts/1')
    .then(response => response.json())
    .then(data => console.log('Fetch successful:', data));
};
```

**Add button to HTML:**

```html
<button onclick="testNetwork()">Test Network Requests</button>
```

**Steps:**

1. Refresh browser page
2. Click "Test Network Requests" button
3. Check CLI terminal for network request details

**Expected Results:**

- Network request appears in CLI terminal
- Request details include URL and method
- Response data is captured
- No errors in browser console

**Pass/Fail:** \***\*\_\_\_\*\***

### Test 4: Storage Monitor (3 minutes)

**Objective:** Test browser storage monitoring functionality

**Steps:**

1. Open new terminal window
2. Start storage monitor: `clp storage --port 3002`
3. Add storage test to `test.html`:

```javascript
// Add to script section
import StorageMonitor from './node_modules/@kansnpms/console-log-pipe-storage-beta/dist/storage-monitor.umd.js';
StorageMonitor.init({ serverPort: 3002 });

window.testStorage = function () {
  localStorage.setItem('test-key', 'test-value');
  sessionStorage.setItem('session-key', 'session-value');
  document.cookie = 'test-cookie=cookie-value';

  setTimeout(() => {
    localStorage.setItem('test-key', 'modified-value');
    localStorage.removeItem('test-key');
  }, 2000);
};
```

**Add button:**

```html
<button onclick="testStorage()">Test Storage Monitor</button>
```

**Steps:**

1. Refresh browser page
2. Click "Test Storage Monitor" button
3. Check storage monitor terminal for storage changes

**Expected Results:**

- Storage changes appear in storage monitor terminal
- Color-coded output (green=add, yellow=modify, red=delete)
- localStorage, sessionStorage, and cookie changes captured
- Real-time updates

**Pass/Fail:** \***\*\_\_\_\*\***

## 🔧 Error Handling Tests (3 minutes)

### Test 5: Port Conflict Handling

**Steps:**

1. Start first server: `clp start --port 3001`
2. Try to start second server on same port: `clp start --port 3001`

**Expected Results:**

- Clear error message about port being in use
- First server continues running
- No crashes or hangs

**Pass/Fail:** \***\*\_\_\_\*\***

### Test 6: Invalid Port Handling

**Steps:**

1. Test invalid ports:
   - `clp start --port abc`
   - `clp start --port 99999`

**Expected Results:**

- Clear error messages for invalid ports
- Helpful suggestions for valid port ranges
- No crashes

**Pass/Fail:** \***\*\_\_\_\*\***

## 📊 Test Results Summary

### Overall Results

- **Total Tests:** 6
- **Passed:** **\_** / 6
- **Failed:** **\_** / 6
- **Pass Rate:** **\_**%

### Critical Issues Found

1. ***
2. ***
3. ***

### System Status

- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor Issues (specify): **\*\***\_\_\_\_**\*\***
- [ ] ❌ Major Issues (specify): **\*\***\_\_\_\_**\*\***

## 🎯 Quick Validation Checklist

**Before marking as PASSED, verify:**

- [ ] CLI installs without errors
- [ ] Version shows 2.3.1
- [ ] Console logs stream to CLI terminal
- [ ] Network requests are captured
- [ ] Storage changes are monitored
- [ ] Error handling works properly
- [ ] No crashes or hangs during testing

## 📞 Support

- **Issues:** https://github.com/kgptapps/consolelogpipe/issues
- **Documentation:** https://github.com/kgptapps/consolelogpipe#readme

---

**Tester:** \***\*\*\*\*\***\_\***\*\*\*\*\***  
**Date:** \***\*\*\*\*\***\_\***\*\*\*\*\***  
**Environment:** \***\*\*\*\*\***\_\***\*\*\*\*\***  
**Overall Status:** ⭐⭐⭐⭐⭐ (Rate 1-5 stars)
