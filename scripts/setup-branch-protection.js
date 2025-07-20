#!/usr/bin/env node

/**
 * Script to set up branch protection rules for main branch
 * Requires GitHub CLI (gh) to be installed and authenticated
 */

const { execSync } = require('child_process');

const REPO = 'kgptapps/consolelogpipe';
const BRANCH = 'main';

const REQUIRED_STATUS_CHECKS = [
  'Code Quality & Security',
  'Test Suite (18)',
  'Test Suite (20)',
  'CodeQL Security Analysis',
];

const PROTECTION_RULES = {
  required_status_checks: {
    strict: true,
    contexts: REQUIRED_STATUS_CHECKS,
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
  },
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
};

function setupBranchProtection() {
  console.log('🛡️ Setting up branch protection for', BRANCH, 'branch...');

  try {
    // Check if gh CLI is available
    execSync('gh --version', { stdio: 'pipe' });
    console.log('✅ GitHub CLI found');

    // Set up branch protection
    const command =
      `gh api repos/${REPO}/branches/${BRANCH}/protection ` +
      `--method PUT ` +
      `--field required_status_checks='${JSON.stringify(
        PROTECTION_RULES.required_status_checks
      )}' ` +
      `--field enforce_admins=${PROTECTION_RULES.enforce_admins} ` +
      `--field required_pull_request_reviews='${JSON.stringify(
        PROTECTION_RULES.required_pull_request_reviews
      )}' ` +
      `--field restrictions=${PROTECTION_RULES.restrictions} ` +
      `--field allow_force_pushes=${PROTECTION_RULES.allow_force_pushes} ` +
      `--field allow_deletions=${PROTECTION_RULES.allow_deletions}`;

    execSync(command, { stdio: 'inherit' });
    console.log('✅ Branch protection rules applied successfully!');

    console.log('\n🔒 Protection Rules Applied:');
    console.log('- Require status checks to pass before merging');
    console.log('- Require branches to be up to date before merging');
    console.log('- Require pull request reviews before merging');
    console.log('- Dismiss stale reviews when new commits are pushed');
    console.log('- Prevent force pushes');
    console.log('- Prevent branch deletion');
    console.log('\n📋 Required Status Checks:');
    REQUIRED_STATUS_CHECKS.forEach(check => {
      console.log(`  - ${check}`);
    });
  } catch (error) {
    if (error.message.includes('gh: command not found')) {
      console.error('❌ GitHub CLI (gh) not found. Please install it first:');
      console.error('   https://cli.github.com/');
    } else {
      console.error('❌ Failed to set up branch protection:', error.message);
      console.error('\nYou can manually set up branch protection in GitHub:');
      console.error(`   https://github.com/${REPO}/settings/branches`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  setupBranchProtection();
}

module.exports = { setupBranchProtection };
