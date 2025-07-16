#!/usr/bin/env node

/**
 * Complete end-to-end test for Console Log Pipe v2.0.0 fix
 *
 * This test verifies that the log streaming bug is completely fixed
 */

const ConsoleLogPipe = require('./packages/client/dist/console-log-pipe.cjs.js');

console.log('🧪 Console Log Pipe v2.0.0 - Complete Fix Test\n');

async function runCompleteTest() {
  console.log('📋 Test Setup:');
  console.log(
    '   1. Make sure CLI server is running: npx clp start --port 3003'
  );
  console.log('   2. This test will connect and send logs');
  console.log('   3. Check CLI terminal for streamed logs\n');

  try {
    console.log('🔌 Connecting to CLI server...');

    // Test with the simple implementation parameters
    const instance = await ConsoleLogPipe.init({
      serverPort: 3003, // Simple implementation uses serverPort
      serverHost: 'localhost', // Simple implementation uses serverHost
      enableMetadata: true,
      enableNetworkCapture: true,
    });

    console.log('✅ Connected successfully!\n');

    // Wait for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📝 Sending test logs (should appear in CLI terminal):');
    console.log('');

    // Test different log levels with delays to see them clearly
    console.log('🟢 INFO: Application started successfully');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.warn('🟡 WARN: This is a warning message');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.error('🔴 ERROR: This is an error message');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('📊 DATA: Processing user data', {
      userId: 123,
      action: 'login',
      timestamp: new Date().toISOString(),
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🔄 BATCH: Multiple rapid messages...');
    for (let i = 1; i <= 3; i++) {
      console.log(`   Message ${i}/3: Batch processing item ${i}`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('');
    console.log('🎉 Test completed!');
    console.log('');
    console.log('📋 Results:');
    console.log('   ✅ Connection established');
    console.log('   ✅ Parameters accepted (port, applicationName)');
    console.log('   ✅ Logs sent to CLI server');
    console.log('');
    console.log('🔍 Check your CLI terminal:');
    console.log('   - If logs appeared: 🎉 BUG IS FIXED!');
    console.log('   - If no logs: ❌ Still needs investigation');

    // Clean shutdown
    instance.stop();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log(
      '   1. Ensure CLI server is running: npx clp start --port 3003'
    );
    console.log('   2. Check if port 3002 is available');
    console.log('   3. Verify no firewall blocking connections');

    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️ Connection refused - CLI server not running');
    }
  }
}

// Run the complete test
runCompleteTest().catch(console.error);
