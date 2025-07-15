# Console Log Pipe Test Application

This test application validates the functionality of the published Console Log Pipe packages:
- `@kansnpms/console-log-pipe-cli` - CLI tool for running the log server
- `@kansnpms/console-log-pipe-client` - Browser client library for log streaming

## Quick Start

```bash
# Navigate to test directory
cd test-app

# Install dependencies (including Console Log Pipe packages)
npm install

# Run all tests
npm run test:all
```

## Individual Tests

### CLI Package Test
Tests the CLI tool functionality:
```bash
npm run test:cli
```

**Tests:**
- ✅ Package installation verification
- ✅ CLI command availability (`clp` and `console-log-pipe`)
- ✅ Version check (should be 1.1.24)
- ✅ Help output validation
- ✅ Server startup functionality

### Browser Client Test
Tests the browser client library:
```bash
npm run test:browser
```

**Tests:**
- ✅ Package import verification
- ✅ API availability check
- ✅ Version validation
- ✅ Client initialization
- ✅ Browser integration with Puppeteer
- ✅ WebSocket connection to server

### Integration Test
Tests the full workflow (CLI server + Browser client):
```bash
npm run test
```

**Tests:**
- ✅ WebSocket communication between browser and server
- ✅ Full integration: browser logs → server capture
- ✅ Real-time log streaming
- ✅ Multiple log levels (log, error, warn, info)
- ✅ Network request capture
- ✅ Object logging
- ✅ Error with stack trace

## Manual Testing

### Start Server Manually
```bash
npm run start:server
```
This starts the Console Log Pipe server on port 3001.

### Development Mode
```bash
npm run dev
```
This runs both the server and browser tests concurrently.

## Test Results

Each test suite provides detailed output:
- ✅ **PASS** - Test completed successfully
- ❌ **FAIL** - Test failed with error details
- 📊 **Summary** - Total tests, passed, and failed counts

## Package Versions

The test application installs and validates:
- CLI Package: `@kansnpms/console-log-pipe-cli@^1.1.24`
- Client Package: `@kansnpms/console-log-pipe-client@^1.1.24`

## Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- Internet connection (for network request tests)

## Troubleshooting

### Package Not Found
If packages are not found, ensure they are published to NPM:
```bash
npm view @kansnpms/console-log-pipe-cli
npm view @kansnpms/console-log-pipe-client
```

### Server Port Conflicts
Tests use different ports to avoid conflicts:
- CLI test: port 3002
- Browser test: port 3003  
- Integration test: port 3004

### Browser Tests Failing
Ensure you have the required dependencies:
```bash
npm install puppeteer
```

## Expected Output

Successful test run should show:
```
🚀 Starting CLI Package Tests
✅ Package Installation - PASSED
✅ CLI Command Available - PASSED
✅ CLI Help Output - PASSED
✅ Server Start - PASSED

🚀 Starting Browser Client Package Tests
✅ Package Import - PASSED
✅ WebSocket Connection - PASSED
✅ Browser Integration - PASSED

🚀 Starting Integration Tests
✅ WebSocket Communication - PASSED
✅ Full Integration - PASSED
✅ Real-time Streaming - PASSED

📊 All tests completed successfully!
```
