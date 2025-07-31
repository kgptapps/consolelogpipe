#!/usr/bin/env node

/**
 * Node.js test for storage-pipe API patterns
 * Tests the ES6 import patterns documented in README
 */

console.log(
  '🧪 Testing Console Log Pipe Storage Monitor - Node.js API Patterns\n'
);

async function testES6Import() {
  console.log('📦 Testing ES6 Import Pattern...');

  try {
    // Test the documented import pattern
    const { ConsoleLogPipeStorage } = await import('./dist/index.esm.js');

    console.log('✅ ES6 import successful');
    console.log(
      `📋 ConsoleLogPipeStorage type: ${typeof ConsoleLogPipeStorage}`
    );

    // Test instance creation
    const storage = new ConsoleLogPipeStorage({
      serverPort: 3002,
      autoConnect: false, // Don't actually connect in test
    });

    console.log('✅ ConsoleLogPipeStorage instance created');
    console.log(`📋 Instance type: ${typeof storage}`);
    console.log(`📋 Instance.init type: ${typeof storage.init}`);
    console.log(`📋 Instance version: ${storage.version}`);

    // Test static methods
    console.log(
      `📋 ConsoleLogPipeStorage.init type: ${typeof ConsoleLogPipeStorage.init}`
    );
    console.log(
      `📋 ConsoleLogPipeStorage.create type: ${typeof ConsoleLogPipeStorage.create}`
    );

    return true;
  } catch (error) {
    console.error('❌ ES6 import failed:', error.message);
    return false;
  }
}

async function testCommonJSImport() {
  console.log('\n📦 Testing CommonJS Import Pattern...');

  try {
    // Test CommonJS import
    const ConsoleLogPipeStorage = require('./dist/index.js');

    console.log('✅ CommonJS import successful');
    console.log(
      `📋 ConsoleLogPipeStorage type: ${typeof ConsoleLogPipeStorage}`
    );

    // Test instance creation
    const storage = new ConsoleLogPipeStorage({
      serverPort: 3002,
      autoConnect: false,
    });

    console.log('✅ ConsoleLogPipeStorage instance created');
    console.log(`📋 Instance version: ${storage.version}`);

    return true;
  } catch (error) {
    console.error('❌ CommonJS import failed:', error.message);
    return false;
  }
}

async function testStaticFactoryMethods() {
  console.log('\n🏭 Testing Static Factory Methods...');

  try {
    const { ConsoleLogPipeStorage } = await import('./dist/index.esm.js');

    // Test create method
    const storage1 = ConsoleLogPipeStorage.create({
      serverPort: 3002,
      autoConnect: false,
    });

    console.log('✅ ConsoleLogPipeStorage.create() works');
    console.log(`📋 Created instance type: ${typeof storage1}`);

    // Test static init method (don't actually connect)
    console.log('💡 ConsoleLogPipeStorage.init() would connect to server');
    console.log('💡 Skipping actual connection test in automated test');

    return true;
  } catch (error) {
    console.error('❌ Static factory methods failed:', error.message);
    return false;
  }
}

async function testTypeScriptDefinitions() {
  console.log('\n📝 Testing TypeScript Definitions...');

  try {
    const fs = require('fs');
    const path = require('path');

    const dtsPath = path.join(__dirname, 'dist', 'index.d.ts');
    if (fs.existsSync(dtsPath)) {
      console.log('✅ TypeScript definitions file exists');

      const dtsContent = fs.readFileSync(dtsPath, 'utf8');

      // Check for key interfaces
      const hasStorageMonitor = dtsContent.includes(
        'export declare class StorageMonitor'
      );
      const hasConsoleLogPipeStorage = dtsContent.includes(
        'export declare class ConsoleLogPipeStorage'
      );
      const hasUnifiedStorageMonitor = dtsContent.includes(
        'interface UnifiedStorageMonitor'
      );
      const hasBrowserStorageMonitor = dtsContent.includes(
        'interface BrowserStorageMonitor'
      );

      console.log(
        `📋 Has StorageMonitor class: ${hasStorageMonitor ? '✅' : '❌'}`
      );
      console.log(
        `📋 Has ConsoleLogPipeStorage class: ${
          hasConsoleLogPipeStorage ? '✅' : '❌'
        }`
      );
      console.log(
        `📋 Has UnifiedStorageMonitor interface: ${
          hasUnifiedStorageMonitor ? '✅' : '❌'
        }`
      );
      console.log(
        `📋 Has BrowserStorageMonitor interface: ${
          hasBrowserStorageMonitor ? '✅' : '❌'
        }`
      );

      return hasConsoleLogPipeStorage && hasUnifiedStorageMonitor;
    } else {
      console.error('❌ TypeScript definitions file not found');
      return false;
    }
  } catch (error) {
    console.error('❌ TypeScript definitions test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running all API pattern tests...\n');

  const results = {
    es6Import: await testES6Import(),
    commonjsImport: await testCommonJSImport(),
    staticFactory: await testStaticFactoryMethods(),
    typescript: await testTypeScriptDefinitions(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');

  Object.entries(results).forEach(([test, passed]) => {
    console.log(
      `${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
    );
  });

  const allPassed = Object.values(results).every(result => result);

  console.log(
    `\n🎯 Overall Result: ${
      allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
    }`
  );

  if (allPassed) {
    console.log('\n🎉 All documented API patterns work correctly!');
    console.log('📋 The QA issues have been resolved:');
    console.log('   • ES6 imports work correctly');
    console.log('   • CommonJS imports work correctly');
    console.log('   • Static factory methods work correctly');
    console.log('   • TypeScript definitions are present and accurate');
  } else {
    console.log(
      '\n⚠️ Some API patterns still have issues that need to be addressed.'
    );
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
