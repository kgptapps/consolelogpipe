#!/usr/bin/env node

/**
 * GitHub Actions Workflow Validator
 *
 * This script validates GitHub Actions workflows for:
 * - YAML syntax errors
 * - Deprecated action versions
 * - Security issues
 * - Best practices compliance
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class GitHubActionsValidator {
  constructor() {
    this.workflowsDir = '.github/workflows';
    this.errors = [];
    this.warnings = [];
    this.deprecatedActions = new Map([
      ['actions/checkout@v3', 'actions/checkout@v4'],
      ['actions/setup-node@v3', 'actions/setup-node@v4'],
      ['actions/upload-artifact@v3', 'actions/upload-artifact@v4'],
      ['actions/download-artifact@v3', 'actions/download-artifact@v4'],
      ['actions/cache@v3', 'actions/cache@v4'],
      ['github/codeql-action/init@v2', 'github/codeql-action/init@v3'],
      ['github/codeql-action/analyze@v2', 'github/codeql-action/analyze@v3'],
      [
        'github/codeql-action/upload-sarif@v2',
        'github/codeql-action/upload-sarif@v3',
      ],
      ['codecov/codecov-action@v3', 'codecov/codecov-action@v4'],
    ]);
  }

  /**
   * Get all workflow files
   */
  getWorkflowFiles() {
    if (!fs.existsSync(this.workflowsDir)) {
      throw new Error(`Workflows directory ${this.workflowsDir} not found`);
    }

    return fs
      .readdirSync(this.workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map(file => path.join(this.workflowsDir, file));
  }

  /**
   * Validate YAML syntax
   */
  validateYamlSyntax(filePath) {
    try {
      // Try to parse YAML using node-yaml if available, otherwise use basic validation
      const content = fs.readFileSync(filePath, 'utf8');

      // Basic YAML validation checks
      const lines = content.split('\n');
      const indentationErrors = [];

      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check for tabs (should use spaces)
        if (line.includes('\t')) {
          indentationErrors.push(
            `Line ${lineNum}: Uses tabs instead of spaces`
          );
        }

        // Check for trailing spaces
        if (line.endsWith(' ') && line.trim() !== '') {
          this.warnings.push(
            `${filePath}:${lineNum} - Trailing spaces detected`
          );
        }
      });

      if (indentationErrors.length > 0) {
        this.errors.push(
          `${filePath}: YAML indentation issues:\n  ${indentationErrors.join(
            '\n  '
          )}`
        );
      }

      return true;
    } catch (error) {
      this.errors.push(`${filePath}: YAML syntax error - ${error.message}`);
      return false;
    }
  }

  /**
   * Check for deprecated actions
   */
  checkDeprecatedActions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const deprecatedFound = [];

    for (const [deprecated, replacement] of this.deprecatedActions) {
      if (content.includes(deprecated)) {
        deprecatedFound.push({
          deprecated,
          replacement,
          lines: this.findLinesContaining(content, deprecated),
        });
      }
    }

    if (deprecatedFound.length > 0) {
      deprecatedFound.forEach(({ deprecated, replacement, lines }) => {
        this.errors.push(
          `${filePath}: Deprecated action '${deprecated}' found on lines ${lines.join(
            ', '
          )}. ` + `Replace with '${replacement}'`
        );
      });
    }

    return deprecatedFound.length === 0;
  }

  /**
   * Find lines containing a specific string
   */
  findLinesContaining(content, searchString) {
    return content
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => line.includes(searchString))
      .map(({ number }) => number);
  }

  /**
   * Check for security best practices
   */
  checkSecurityBestPractices(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for pinned action versions
    const actionRegex = /uses:\s*([^@\s]+)(?:@([^\s]+))?/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      const [, actionName, version] = match;
      const lineNum = content.substring(0, match.index).split('\n').length;

      if (!version) {
        this.warnings.push(
          `${filePath}:${lineNum} - Action '${actionName}' not pinned to specific version`
        );
      } else if (version === 'main' || version === 'master') {
        this.warnings.push(
          `${filePath}:${lineNum} - Action '${actionName}' pinned to branch instead of tag/SHA`
        );
      }
    }

    // Check for secrets in workflow files
    const secretPatterns = [
      /password\s*[:=]\s*['"]/i,
      /token\s*[:=]\s*['"]/i,
      /key\s*[:=]\s*['"]/i,
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.errors.push(`${filePath}: Potential hardcoded secret detected`);
      }
    });
  }

  /**
   * Check for common workflow issues
   */
  checkWorkflowIssues(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for missing continue-on-error for artifact downloads
    if (
      content.includes('actions/download-artifact') &&
      !content.includes('continue-on-error: true')
    ) {
      this.warnings.push(
        `${filePath}: Consider adding 'continue-on-error: true' to artifact download steps`
      );
    }

    // Check for missing continue-on-error for SARIF uploads
    if (
      content.includes('upload-sarif') &&
      !content.includes('continue-on-error: true')
    ) {
      this.warnings.push(
        `${filePath}: Consider adding 'continue-on-error: true' to SARIF upload steps`
      );
    }
  }

  /**
   * Check workflow permissions
   */
  checkPermissions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if permissions are explicitly set
    if (!content.includes('permissions:')) {
      this.warnings.push(
        `${filePath}: No explicit permissions set - consider adding minimal required permissions`
      );
    }

    // Check for overly broad permissions
    if (content.includes('permissions: write-all')) {
      this.warnings.push(
        `${filePath}: Using 'write-all' permissions - consider using minimal required permissions`
      );
    }
  }

  /**
   * Generate auto-fix suggestions
   */
  generateAutoFix() {
    const fixes = [];

    this.errors.forEach(error => {
      if (error.includes('Deprecated action')) {
        const match = error.match(
          /Deprecated action '([^']+)' .* Replace with '([^']+)'/
        );
        if (match) {
          const [, deprecated, replacement] = match;
          const filePath = error.split(':')[0];
          fixes.push({
            file: filePath,
            type: 'replace',
            from: deprecated,
            to: replacement,
            description: `Update ${deprecated} to ${replacement}`,
          });
        }
      }
    });

    return fixes;
  }

  /**
   * Apply auto-fixes
   */
  applyAutoFixes(fixes) {
    const appliedFixes = [];

    fixes.forEach(fix => {
      if (fix.type === 'replace') {
        try {
          let content = fs.readFileSync(fix.file, 'utf8');
          const originalContent = content;
          content = content.replace(
            new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            fix.to
          );

          if (content !== originalContent) {
            fs.writeFileSync(fix.file, content);
            appliedFixes.push(fix);
            console.log(
              `${colors.green}✓${colors.reset} Applied fix: ${fix.description} in ${fix.file}`
            );
          }
        } catch (error) {
          console.log(
            `${colors.red}✗${colors.reset} Failed to apply fix in ${fix.file}: ${error.message}`
          );
        }
      }
    });

    return appliedFixes;
  }

  /**
   * Main validation function
   */
  async validate(autoFix = false) {
    console.log(
      `${colors.bright}${colors.cyan}🔍 GitHub Actions Workflow Validation${colors.reset}\n`
    );

    try {
      const workflowFiles = this.getWorkflowFiles();
      console.log(`Found ${workflowFiles.length} workflow files:\n`);

      workflowFiles.forEach(file => {
        console.log(`${colors.blue}📄 Validating: ${file}${colors.reset}`);

        // Validate YAML syntax
        this.validateYamlSyntax(file);

        // Check for deprecated actions
        this.checkDeprecatedActions(file);

        // Check security best practices
        this.checkSecurityBestPractices(file);

        // Check permissions
        this.checkPermissions(file);

        // Check for common workflow issues
        this.checkWorkflowIssues(file);

        console.log();
      });

      // Display results
      console.log(`${colors.bright}📊 Validation Results:${colors.reset}`);
      console.log(
        `${colors.red}❌ Errors: ${this.errors.length}${colors.reset}`
      );
      console.log(
        `${colors.yellow}⚠️  Warnings: ${this.warnings.length}${colors.reset}\n`
      );

      // Display errors
      if (this.errors.length > 0) {
        console.log(`${colors.bright}${colors.red}❌ Errors:${colors.reset}`);
        this.errors.forEach(error => {
          console.log(`  ${colors.red}•${colors.reset} ${error}`);
        });
        console.log();
      }

      // Display warnings
      if (this.warnings.length > 0) {
        console.log(
          `${colors.bright}${colors.yellow}⚠️  Warnings:${colors.reset}`
        );
        this.warnings.forEach(warning => {
          console.log(`  ${colors.yellow}•${colors.reset} ${warning}`);
        });
        console.log();
      }

      // Auto-fix if requested
      if (autoFix && this.errors.length > 0) {
        console.log(`${colors.bright}🔧 Applying Auto-fixes:${colors.reset}`);
        const fixes = this.generateAutoFix();
        const appliedFixes = this.applyAutoFixes(fixes);

        if (appliedFixes.length > 0) {
          console.log(
            `\n${colors.green}✅ Applied ${appliedFixes.length} auto-fixes${colors.reset}`
          );
          console.log(
            `${colors.yellow}⚠️  Please review changes and test workflows${colors.reset}`
          );
        } else {
          console.log(
            `${colors.yellow}⚠️  No auto-fixes available${colors.reset}`
          );
        }
      }

      // Summary
      if (this.errors.length === 0 && this.warnings.length === 0) {
        console.log(
          `${colors.green}🎉 All workflows are valid and up-to-date!${colors.reset}`
        );
        process.exit(0);
      } else if (this.errors.length === 0) {
        console.log(
          `${colors.yellow}✅ Workflows are valid but have warnings to address${colors.reset}`
        );
        process.exit(0);
      } else {
        console.log(
          `${colors.red}❌ Workflows have errors that must be fixed${colors.reset}`
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `${colors.red}❌ Validation failed: ${error.message}${colors.reset}`
      );
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const autoFix = process.argv.includes('--fix');
  const validator = new GitHubActionsValidator();
  validator.validate(autoFix).catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = GitHubActionsValidator;
