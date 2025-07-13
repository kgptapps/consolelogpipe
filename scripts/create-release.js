#!/usr/bin/env node

/**
 * Create Release Script
 *
 * This script helps create a new release with proper version bumping
 * and triggers the GitHub Actions workflow for automated NPM publishing.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  const clientPackage = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../packages/client/package.json'),
      'utf8'
    )
  );
  return clientPackage.version;
}

function bumpVersion(type = 'patch') {
  console.log(`🔄 Bumping ${type} version...`);

  // Update client package version
  execSync(`cd packages/client && npm version ${type}`, { stdio: 'inherit' });

  const newVersion = getCurrentVersion();
  console.log(`✅ Version bumped to: ${newVersion}`);

  return newVersion;
}

function createGitTag(version) {
  const tag = `v${version}`;
  console.log(`🏷️  Creating git tag: ${tag}`);

  execSync(`git add .`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: release ${tag}"`, { stdio: 'inherit' });
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
  execSync(`git push origin main`, { stdio: 'inherit' });
  execSync(`git push origin ${tag}`, { stdio: 'inherit' });

  console.log(`✅ Tag ${tag} created and pushed`);
  return tag;
}

function createGitHubRelease(tag, version) {
  console.log(`🚀 Creating GitHub release: ${tag}`);

  const releaseNotes = `
# Console Log Pipe ${version}

## 🎉 What's New

- Updated client library with latest features
- Enhanced AI-friendly development capabilities
- Improved documentation and examples

## 📦 Installation

\`\`\`bash
npm install @kansnpms/console-log-pipe-client@${version}
\`\`\`

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@kansnpms/console-log-pipe-client)
- [Documentation](https://github.com/kgptapps/consolelogpipe#readme)
- [Issues](https://github.com/kgptapps/consolelogpipe/issues)

---

**Full Changelog**: https://github.com/kgptapps/consolelogpipe/compare/v${getCurrentPreviousVersion()}...${tag}
  `.trim();

  try {
    execSync(
      `gh release create ${tag} --title "Console Log Pipe ${version}" --notes "${releaseNotes}"`,
      {
        stdio: 'inherit',
      }
    );
    console.log(`✅ GitHub release created: ${tag}`);
  } catch (error) {
    console.log(
      `⚠️  Could not create GitHub release automatically. Please create it manually at:`
    );
    console.log(
      `   https://github.com/kgptapps/consolelogpipe/releases/new?tag=${tag}`
    );
  }
}

function getCurrentPreviousVersion() {
  try {
    const tags = execSync('git tag --sort=-version:refname', {
      encoding: 'utf8',
    });
    const tagList = tags
      .trim()
      .split('\n')
      .filter(tag => tag.startsWith('v'));
    return tagList[0] ? tagList[0].substring(1) : '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // patch, minor, major

  console.log('🚀 Console Log Pipe Release Creator');
  console.log('=====================================');

  try {
    // Check if we're in a clean git state
    try {
      execSync('git diff --exit-code', { stdio: 'pipe' });
      execSync('git diff --cached --exit-code', { stdio: 'pipe' });
    } catch {
      console.error(
        '❌ Git working directory is not clean. Please commit or stash changes first.'
      );
      process.exit(1);
    }

    // Bump version
    const newVersion = bumpVersion(versionType);

    // Create git tag and push
    const tag = createGitTag(newVersion);

    // Create GitHub release (triggers the workflow)
    createGitHubRelease(tag, newVersion);

    console.log('\n🎉 Release process completed!');
    console.log(`📦 Version: ${newVersion}`);
    console.log(`🏷️  Tag: ${tag}`);
    console.log(`🔄 GitHub Actions will now:`);
    console.log(`   1. Run tests and validation`);
    console.log(`   2. Publish to NPM automatically`);
    console.log(`   3. Create release assets`);
    console.log(`   4. Update documentation`);
    console.log(`\n🔗 Monitor progress at:`);
    console.log(`   https://github.com/kgptapps/consolelogpipe/actions`);
  } catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { bumpVersion, createGitTag, createGitHubRelease };
