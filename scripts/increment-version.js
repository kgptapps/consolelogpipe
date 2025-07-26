#!/usr/bin/env node

/**
 * Version Increment Script
 *
 * Increments the version in version.json and syncs all packages.
 * Supports patch, minor, and major version increments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Parse version string
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

// Format version object to string
function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

// Increment version based on type
function incrementVersion(version, type) {
  const parsed = parseVersion(version);

  switch (type) {
    case 'patch':
      parsed.patch++;
      break;
    case 'minor':
      parsed.minor++;
      parsed.patch = 0;
      break;
    case 'major':
      parsed.major++;
      parsed.minor = 0;
      parsed.patch = 0;
      break;
    default:
      throw new Error(
        `Invalid increment type: ${type}. Use 'patch', 'minor', or 'major'.`
      );
  }

  return formatVersion(parsed);
}

// Read current version
function readCurrentVersion() {
  try {
    const versionFile = path.join(__dirname, '..', 'version.json');
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    return versionData.version;
  } catch (error) {
    logError(`Failed to read version.json: ${error.message}`);
    process.exit(1);
  }
}

// Update version.json
function updateVersionFile(newVersion) {
  try {
    const versionFile = path.join(__dirname, '..', 'version.json');
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    versionData.version = newVersion;
    fs.writeFileSync(versionFile, `${JSON.stringify(versionData, null, 2)}\n`);
    logSuccess(`Updated version.json to ${newVersion}`);
  } catch (error) {
    logError(`Failed to update version.json: ${error.message}`);
    process.exit(1);
  }
}

// Run sync-versions script
function syncVersions() {
  try {
    logInfo('Running version sync...');
    execSync('npm run sync-versions', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
  } catch (error) {
    logError(`Failed to sync versions: ${error.message}`);
    process.exit(1);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const incrementType = args[0] || 'patch';

  if (!['patch', 'minor', 'major'].includes(incrementType)) {
    logError(`Invalid increment type: ${incrementType}`);
    log('Usage: npm run increment-version [patch|minor|major]');
    log('  patch: 1.0.0 → 1.0.1 (default)');
    log('  minor: 1.0.0 → 1.1.0');
    log('  major: 1.0.0 → 2.0.0');
    process.exit(1);
  }

  log('🚀 Console Log Pipe Version Increment', 'bold');
  log('=====================================', 'bold');
  console.log();

  const currentVersion = readCurrentVersion();
  const newVersion = incrementVersion(currentVersion, incrementType);

  logInfo(`Current version: ${currentVersion}`);
  logInfo(`Increment type: ${incrementType}`);
  logInfo(`New version: ${newVersion}`);
  console.log();

  // Update version.json
  updateVersionFile(newVersion);
  console.log();

  // Sync all packages
  syncVersions();
  console.log();

  log('=====================================', 'bold');
  logSuccess(`🎉 Version incremented from ${currentVersion} to ${newVersion}!`);
  console.log();

  logInfo('Next steps:');
  log('  1. Review changes: git diff');
  log('  2. Build packages: npm run build');
  log('  3. Run tests: npm test');
  log(
    `  4. Commit changes: git add . && git commit -m "chore: increment version to v${newVersion}"`
  );
  log(`  5. Create tag: git tag v${newVersion}`);
  log('  6. Push changes: git push && git push --tags');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { parseVersion, formatVersion, incrementVersion };
