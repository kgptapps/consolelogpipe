#!/usr/bin/env node

/**
 * Test script to verify log streaming works with the CLI server
 *
 * This script tests the actual streaming functionality that was broken in v2.0.0
 * Run this while the CLI server is running: npx clp start --port 3002
 */

const ConsoleLogPipe = require('./packages/client/dist/console-log-pipe.cjs.js');

console.log('🧪 Testing Console Log Pipe v2.0.0 Log Streaming Fix\n');

async function testLogStreaming() {
  console.log('📡 Connecting to CLI server on port 3002...');

  try {
    // Test the fix: using 'port' parameter (this was broken before the fix)
    const instance = await ConsoleLogPipe.init({
      port: 3002, // This should now work with the fix!
      applicationName: 'streaming-test', // Can be any name now!
      enableMetadata: true,
      enableNetworkCapture: true,
      environment: 'development',
    });

    console.log('✅ Connected successfully to CLI server!');
    console.log('🔄 Starting log streaming test...\n');

    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test different log levels
    console.log('📝 Test log message - should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.warn('⚠️ Test warning message - should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.error('🚨 Test error message - should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.info('ℹ️ Test info message - should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.debug('🔍 Test debug message - should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test with objects
    console.log('📊 Test with object:', {
      test: true,
      number: 42,
      array: [1, 2, 3],
      nested: { key: 'value' },
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test multiple rapid logs
    console.log('🔄 Testing multiple rapid logs...');
    for (let i = 1; i <= 5; i++) {
      console.log(`   Rapid log ${i}/5`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Log streaming test completed!');
    console.log(
      '📋 Check your CLI terminal - all logs above should have appeared there.'
    );
    console.log('🐛 If logs appeared in CLI, the v2.0.0 bug is FIXED! ✅');
    console.log('❌ If logs did NOT appear in CLI, there may be other issues.');

    // Clean shutdown
    instance.stop();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log(
      '   1. Make sure CLI server is running: npx clp start --port 3002'
    );
    console.log('   2. Check if port 3002 is available');
    console.log('   3. Verify the server is accepting connections');

    if (error.code === 'ECONNREFUSED') {
      console.log(
        '   ⚠️ Connection refused - CLI server not running on port 3002'
      );
    }
  }
}

async function main() {
  try {
    await testLogStreaming();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
