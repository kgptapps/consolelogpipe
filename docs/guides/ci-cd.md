# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for
Console Log Pipe.

## 🔄 Overview

The CI/CD pipeline is built using GitHub Actions and provides:

- Automated testing on every push and pull request
- Code quality checks and security scanning
- Automated dependency updates
- Release automation
- Performance monitoring

## 🚀 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`/`develop`, Pull Requests

**Jobs:**

- **Code Quality & Security** - Linting, type checking, formatting, security audit
- **Test Suite** - Unit and integration tests across Node.js 16, 18, 20
- **Build** - Package building and artifact generation
- **E2E Tests** - End-to-end testing (when implemented)
- **Performance Tests** - Performance benchmarking on main branch
- **Bundle Size Analysis** - Track package sizes and comment on PRs

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:** Git tags (`v*`), GitHub releases

**Jobs:**

- **Validate Release** - Full test suite and security audit
- **Publish to NPM** - Automated package publishing to @kansnpms organization
- **Create Release Assets** - Generate platform-specific binaries and packages
- **Update Documentation** - Auto-update docs and version badges
- **Notify Release** - Success/failure notifications

### 3. Dependency Updates (`.github/workflows/dependency-updates.yml`)

**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch

**Jobs:**

- **Security Updates** - Automated security vulnerability fixes
- **Dependency Updates** - Weekly dependency updates with testing
- **Lerna Package Updates** - Monitor package changes and create status reports

### 4. Code Quality (`.github/workflows/code-quality.yml`)

**Triggers:** Push, PR, Weekly schedule (Sundays 2 AM UTC)

**Jobs:**

- **Code Analysis** - ESLint with SARIF output for GitHub Security tab
- **Security Scanning** - NPM audit and Snyk integration
- **Coverage Analysis** - Test coverage reporting with threshold enforcement
- **Performance Analysis** - Bundle size analysis and performance benchmarks

### 5. CodeQL Security (`.github/workflows/codeql.yml`)

**Triggers:** Push, PR, Daily schedule (6 AM UTC)

**Jobs:**

- **Code Analysis** - GitHub's CodeQL security analysis
- **Security Checks** - Additional security pattern detection
- **License Compliance** - License compatibility checking

## 📊 Quality Gates

### Code Quality Requirements

- ✅ ESLint passes with no errors
- ✅ TypeScript compilation successful
- ✅ Prettier formatting enforced
- ✅ Test coverage ≥90% (statements, branches, functions, lines)

### Security Requirements

- ✅ No high/critical npm audit vulnerabilities
- ✅ CodeQL security analysis passes
- ✅ No secrets detected in code
- ✅ License compatibility verified

### Performance Requirements

- ✅ Bundle size within acceptable limits
- ✅ Performance benchmarks meet targets
- ✅ No significant performance regressions

## 🔧 Configuration

### Required Secrets

- `NPM_TOKEN` - NPM publishing token for @kansnpms organization
- `SNYK_TOKEN` - Snyk security scanning token (optional)

### Branch Protection

- **main** branch requires:
  - Status checks: Code Quality & Security, Test Suite, Build Packages
  - 1 approving review
  - Code owner reviews
  - Up-to-date branches
- **develop** branch requires:
  - Status checks: Code Quality & Security, Test Suite
  - 1 approving review

## 📈 Monitoring & Reporting

### Coverage Reports

- Uploaded to Codecov for tracking trends
- Coverage artifacts stored for 30 days
- PR comments show coverage changes

### Security Reports

- SARIF files uploaded to GitHub Security tab
- Security summary artifacts for review
- Automated security update PRs

### Performance Reports

- Bundle size tracking and PR comments
- Performance benchmark artifacts
- Trend analysis for regressions

## 🚨 Troubleshooting

### Common Issues

#### 1. Test Failures

```bash
# Run tests locally
npm run test:all

# Check specific package
cd packages/client && npm test
```

#### 2. Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

#### 3. Security Audit Failures

```bash
# Check vulnerabilities
npm audit

# Apply fixes
npm audit fix
```

#### 4. Coverage Below Threshold

```bash
# Run coverage report
npm run test:coverage

# Check specific package coverage
cd packages/client && npm run test:coverage
```

### Workflow Debugging

- Check GitHub Actions logs for detailed error messages
- Review artifact uploads for additional context
- Use workflow dispatch for manual testing

## 🔄 Release Process

### Automated Release

1. Create git tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Create GitHub release from tag
4. CI/CD automatically publishes to NPM

### Manual Release

1. Update versions: `npm run version`
2. Build packages: `npm run build`
3. Run tests: `npm run test:all`
4. Publish: `npm run publish`

## 📝 Best Practices

### Commit Messages

- Use conventional commits format
- Commitlint enforces: `type(scope): description`
- Examples: `feat(client): add log filtering`, `fix(cli): resolve startup issue`

### Pull Requests

- Use provided PR template
- Ensure all checks pass before requesting review
- Include tests for new features
- Update documentation as needed

### Dependencies

- Review automated dependency update PRs promptly
- Test thoroughly before merging major updates
- Monitor security advisories

## 🔗 Related Documentation

- [NPM Publishing Guide](./npm-publishing.md)
- [Testing Guide](./testing.md)
- [Security Guidelines](./security.md)
- [Contributing Guide](./contributing.md)
