#!/usr/bin/env node

/**
 * Test using the simple browser.js implementation directly
 * This should work since it's the same code that works in browsers
 */

// Simulate browser environment for WebSocket
global.WebSocket = require('ws');

// Load the simple implementation directly
const ConsoleLogPipeSimple = require('./packages/client/src/browser.js');

console.log('🧪 Testing Simple Implementation (Known Working)\n');

async function testSimpleImplementation() {
  try {
    console.log('🔌 Connecting with simple implementation...');

    // Use the simple implementation with correct parameters
    await ConsoleLogPipeSimple.init({
      serverPort: 3003, // Simple implementation uses serverPort
      serverHost: 'localhost',
    });

    console.log('✅ Connected successfully!\n');

    // Wait for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📝 Sending test logs with simple implementation:');
    console.log('');

    // Test logs - these should appear in CLI
    console.log('🟢 SIMPLE: This log should appear in CLI terminal');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.warn('🟡 SIMPLE: Warning from simple implementation');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.error('🔴 SIMPLE: Error from simple implementation');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('📊 SIMPLE: Object test', {
      implementation: 'simple',
      working: true,
      timestamp: new Date().toISOString(),
    });

    console.log('');
    console.log('🎉 Simple implementation test completed!');
    console.log('📋 Check CLI terminal - these logs should appear');

    // Clean up
    ConsoleLogPipeSimple.restore();
  } catch (error) {
    console.error('❌ Simple implementation test failed:', error.message);
  }
}

// Run the test
testSimpleImplementation().catch(console.error);
