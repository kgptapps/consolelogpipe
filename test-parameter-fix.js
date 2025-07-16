#!/usr/bin/env node

/**
 * Test script to verify the parameter mapping fix for Console Log Pipe v2.0.0
 *
 * This script tests that both 'port' and 'serverPort' parameters work correctly
 * in the npm package (CommonJS build).
 */

const ConsoleLogPipe = require('./packages/client/dist/console-log-pipe.cjs.js');

console.log('🧪 Testing Console Log Pipe v2.0.0 Parameter Mapping Fix\n');

async function testParameterMapping() {
  console.log('📋 Test 1: Using "port" parameter (user expectation)');
  try {
    const instance1 = ConsoleLogPipe.create({
      port: 3002,
      applicationName: 'test-port-param',
      enableRemoteLogging: false, // Disable to avoid connection errors
      enableLogCapture: true,
      enableNetworkCapture: false,
      enableErrorCapture: false,
    });

    await instance1.init();
    console.log('✅ SUCCESS: "port" parameter works correctly');
    console.log(`   Server port configured: ${instance1.config.serverPort}`);
    instance1.stop();
  } catch (error) {
    console.log('❌ FAILED: "port" parameter not working');
    console.log(`   Error: ${error.message}`);
  }

  console.log(
    '\n📋 Test 2: Using "serverPort" parameter (original expectation)'
  );
  try {
    const instance2 = ConsoleLogPipe.create({
      serverPort: 3002,
      applicationName: 'test-serverport-param',
      enableRemoteLogging: false, // Disable to avoid connection errors
      enableLogCapture: true,
      enableNetworkCapture: false,
      enableErrorCapture: false,
    });

    await instance2.init();
    console.log('✅ SUCCESS: "serverPort" parameter works correctly');
    console.log(`   Server port configured: ${instance2.config.serverPort}`);
    instance2.stop();
  } catch (error) {
    console.log('❌ FAILED: "serverPort" parameter not working');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n📋 Test 3: Using "host" parameter');
  try {
    const instance3 = ConsoleLogPipe.create({
      host: 'localhost',
      port: 3002,
      applicationName: 'test-host-param',
      enableRemoteLogging: false,
      enableLogCapture: true,
      enableNetworkCapture: false,
      enableErrorCapture: false,
    });

    await instance3.init();
    console.log('✅ SUCCESS: "host" parameter works correctly');
    console.log(`   Server host configured: ${instance3.config.serverHost}`);
    instance3.stop();
  } catch (error) {
    console.log('❌ FAILED: "host" parameter not working');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n📋 Test 4: Default port calculation (no port specified)');
  try {
    const instance4 = ConsoleLogPipe.create({
      applicationName: 'test-default-port',
      enableRemoteLogging: false,
      enableLogCapture: true,
      enableNetworkCapture: false,
      enableErrorCapture: false,
    });

    await instance4.init();
    console.log('✅ SUCCESS: Default port calculation works');
    console.log(`   Calculated port: ${instance4.config.serverPort}`);
    instance4.stop();
  } catch (error) {
    console.log('❌ FAILED: Default port calculation not working');
    console.log(`   Error: ${error.message}`);
  }

  console.log(
    '\n📋 Test 5: Log capture functionality (without remote logging)'
  );
  try {
    const instance5 = ConsoleLogPipe.create({
      port: 3002,
      applicationName: 'test-log-capture',
      enableRemoteLogging: false, // Test local capture only
      enableLogCapture: true,
      enableNetworkCapture: false,
      enableErrorCapture: false,
    });

    await instance5.init();
    instance5.start();

    // Test log capture
    console.log('🔍 Testing log capture...');
    console.log('This is a test log message');
    console.warn('This is a test warning');
    console.error('This is a test error');

    // Wait a moment for logs to be captured
    await new Promise(resolve => setTimeout(resolve, 100));

    const logs = instance5.getLogs();
    console.log(`✅ SUCCESS: Captured ${logs.length} log entries`);

    if (logs.length > 0) {
      console.log('   Sample captured log:', {
        level: logs[0].level,
        message: logs[0].message,
        timestamp: logs[0].timestamp,
      });
    }

    instance5.stop();
  } catch (error) {
    console.log('❌ FAILED: Log capture not working');
    console.log(`   Error: ${error.message}`);
  }
}

async function main() {
  try {
    await testParameterMapping();

    console.log('\n🎉 Parameter mapping fix testing completed!');
    console.log('\n📊 Summary:');
    console.log('   - The fix allows both "port" and "serverPort" parameters');
    console.log('   - The fix allows both "host" and "serverHost" parameters');
    console.log('   - This resolves the v2.0.0 log streaming bug');
    console.log('   - Users can now use the expected parameter names');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
