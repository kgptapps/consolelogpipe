#!/usr/bin/env node

/**
 * CLI Package Test
 * Tests the @kansnpms/console-log-pipe-cli package functionality
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CLITester {
  constructor() {
    this.testResults = [];
    this.serverProcess = null;
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

  async testPackageInstallation() {
    const { stdout } = await execAsync('npm list @kansnpms/console-log-pipe-cli');
    if (!stdout.includes('@kansnpms/console-log-pipe-cli')) {
      throw new Error('CLI package not found in node_modules');
    }
  }

  async testCLICommand() {
    try {
      const { stdout } = await execAsync('npx clp --version');
      if (!stdout.includes('1.1.24')) {
        throw new Error(`Expected version 1.1.24, got: ${stdout}`);
      }
    } catch (error) {
      // Try alternative command
      const { stdout } = await execAsync('npx console-log-pipe --version');
      if (!stdout.includes('1.1.24')) {
        throw new Error(`Expected version 1.1.24, got: ${stdout}`);
      }
    }
  }

  async testCLIHelp() {
    const { stdout } = await execAsync('npx clp --help');
    const expectedCommands = ['start', 'Options:', '--port', '--help', '--version'];
    
    for (const cmd of expectedCommands) {
      if (!stdout.includes(cmd)) {
        throw new Error(`Help output missing expected command: ${cmd}`);
      }
    }
  }

  async testServerStart() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.serverProcess) {
          this.serverProcess.kill();
        }
        reject(new Error('Server start timeout'));
      }, 10000);

      this.serverProcess = spawn('npx', ['clp', 'start', '--port', '3002'], {
        stdio: 'pipe'
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server running on port 3002')) {
          clearTimeout(timeout);
          this.serverProcess.kill();
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

  async runAllTests() {
    this.log('🚀 Starting CLI Package Tests', 'info');
    
    await this.test('Package Installation', () => this.testPackageInstallation());
    await this.test('CLI Command Available', () => this.testCLICommand());
    await this.test('CLI Help Output', () => this.testCLIHelp());
    await this.test('Server Start', () => this.testServerStart());

    this.printResults();
  }

  printResults() {
    this.log('\n📊 CLI Test Results:', 'info');
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
    this.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`, 'info');
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests
const tester = new CLITester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
