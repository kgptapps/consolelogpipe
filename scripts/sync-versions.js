#!/usr/bin/env node

/**
 * Sync Versions Script
 *
 * Reads version from version.json and updates all package.json files
 * and version tests to maintain consistency across the monorepo.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Read the master version
function readMasterVersion() {
  try {
    const versionFile = path.join(__dirname, '..', 'version.json');
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    return versionData.version;
  } catch (error) {
    logError(`Failed to read version.json: ${error.message}`);
    process.exit(1);
  }
}

// Update package.json file
function updatePackageJson(filePath, version) {
  try {
    const packageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const oldVersion = packageData.version;

    if (oldVersion === version) {
      log(
        `  ${path.relative(process.cwd(), filePath)}: ${version} (no change)`
      );
      return false;
    }

    packageData.version = version;
    fs.writeFileSync(filePath, `${JSON.stringify(packageData, null, 2)}\n`);
    logSuccess(
      `  ${path.relative(process.cwd(), filePath)}: ${oldVersion} → ${version}`
    );
    return true;
  } catch (error) {
    logError(`  Failed to update ${filePath}: ${error.message}`);
    return false;
  }
}

// Update version test file
function updateVersionTest(filePath, version) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const versionRegex =
      /expect\(([^)]+\.version)\)\.toBe\(['"`]([^'"`]+)['"`]\)/;
    const match = content.match(versionRegex);

    if (!match) {
      logWarning(
        `  No version test found in ${path.relative(process.cwd(), filePath)}`
      );
      return false;
    }

    const oldVersion = match[2];
    if (oldVersion === version) {
      log(
        `  ${path.relative(process.cwd(), filePath)}: ${version} (no change)`
      );
      return false;
    }

    content = content.replace(versionRegex, `expect($1).toBe('${version}')`);
    fs.writeFileSync(filePath, content);
    logSuccess(
      `  ${path.relative(process.cwd(), filePath)}: ${oldVersion} → ${version}`
    );
    return true;
  } catch (error) {
    logError(`  Failed to update ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  log('🔄 Console Log Pipe Version Sync', 'bold');
  log('================================', 'bold');

  const masterVersion = readMasterVersion();
  logInfo(`Master version: ${masterVersion}`);
  console.log();

  let totalUpdates = 0;

  // Package.json files to update
  const packageFiles = [
    'package.json',
    'packages/cli/package.json',
    'packages/client/package.json',
    'packages/storage-monitor/package.json',
  ];

  log('📦 Updating package.json files:', 'blue');
  packageFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      if (updatePackageJson(filePath, masterVersion)) {
        totalUpdates++;
      }
    } else {
      logWarning(`  File not found: ${file}`);
    }
  });

  console.log();

  // Test files to update
  const testFiles = ['packages/client/tests/index.test.js'];

  log('🧪 Updating version tests:', 'blue');
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      if (updateVersionTest(filePath, masterVersion)) {
        totalUpdates++;
      }
    } else {
      logWarning(`  File not found: ${file}`);
    }
  });

  console.log();
  log('================================', 'bold');

  if (totalUpdates > 0) {
    logSuccess(
      `🎉 Version sync complete! Updated ${totalUpdates} files to v${masterVersion}`
    );
    console.log();
    logInfo('Next steps:');
    log('  1. Review changes: git diff');
    log('  2. Test build: npm run build');
    log('  3. Run tests: npm test');
    log(
      `  4. Commit changes: git add . && git commit -m "chore: sync versions to v${masterVersion}"`
    );
  } else {
    logInfo('✨ All versions are already in sync!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { readMasterVersion, updatePackageJson, updateVersionTest };
