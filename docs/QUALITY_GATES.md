# 🛡️ Quality Gates & Pre-Commit Checks

This document outlines the comprehensive quality control system implemented to prevent low-quality
code from entering the repository.

## 🚨 **STRICT Quality Enforcement**

Our quality system has **MULTIPLE LAYERS** of protection:

### 1. **Pre-Commit Hooks** (Local Protection)

**Runs on every `git commit`:**

- ✅ **Linting** - ESLint with auto-fix
- ✅ **Code Formatting** - Prettier formatting
- ✅ **Type Checking** - TypeScript validation
- ✅ **Unit Tests** - Tests for changed files
- ✅ **Security Audit** - NPM vulnerability check
- ✅ **Commit Message** - Conventional commit format

**Commands:**

```bash
# Run all pre-commit checks manually
npm run precommit:full

# Individual checks
npm run precommit:lint
npm run precommit:types
npm run precommit:tests
npm run precommit:security
```

### 2. **Pre-Push Hooks** (Final Local Gate)

**Runs on every `git push`:**

- 🧪 **Full Test Suite** - All unit & integration tests
- 🔍 **Type Checking** - Complete TypeScript validation
- 📝 **Linting** - Full codebase linting
- 🎨 **Format Check** - Code formatting validation
- 🔒 **Security Audit** - High-level vulnerability check
- 🏗️ **Build Validation** - All packages must build
- 📊 **Test Coverage** - Coverage requirements must be met

### 3. **GitHub Actions CI** (Remote Validation)

**Runs on every push/PR:**

- 🔄 **Multi-Node Testing** - Node.js 18 & 20
- 🧪 **Comprehensive Testing** - Unit, integration, E2E
- 🔍 **Code Quality** - Linting, formatting, type checking
- 🔒 **Security Analysis** - CodeQL security scanning
- 📊 **Coverage Reports** - Test coverage analysis
- 🏗️ **Build Verification** - Package building validation

### 4. **Release Quality Gates** (Release Protection)

**Runs before any release:**

- 🚨 **STRICT Quality Gates** - ALL checks must pass
- 🔍 **CI Status Verification** - Current CI must be green
- 📦 **Package Validation** - All packages must build
- 🧪 **Full Test Suite** - 100% test execution
- 🔒 **Security Audit** - Zero high-severity vulnerabilities

## 🛠️ **Developer Commands**

### Quick Quality Checks

```bash
# Check everything (recommended before commit)
npm run quality:check

# Fix auto-fixable issues
npm run quality:fix

# Full quality validation (includes coverage)
npm run quality:full
```

### Test Commands

```bash
# Run tests for changed files only
npm run test:changed

# Run unit tests only
npm run test:unit

# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage
```

### Manual Hook Testing

```bash
# Test pre-commit hook
.husky/pre-commit

# Test pre-push hook
.husky/pre-push
```

## 🚫 **What Gets Blocked**

### Pre-Commit Blocks:

- ❌ Linting errors
- ❌ Type errors
- ❌ Formatting issues
- ❌ Failing tests for changed files
- ❌ Security vulnerabilities
- ❌ Invalid commit messages

### Pre-Push Blocks:

- ❌ Any failing tests
- ❌ Build failures
- ❌ Low test coverage
- ❌ High-severity security issues

### Release Blocks:

- ❌ Failing CI pipelines
- ❌ Any quality gate failures
- ❌ Incomplete test coverage
- ❌ Security vulnerabilities

## 🔧 **Troubleshooting**

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit (NOT RECOMMENDED)
git commit --no-verify

# Skip pre-push (NOT RECOMMENDED)
git push --no-verify
```

### Fix Common Issues

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Update snapshots
npm test -- --updateSnapshot

# Clear cache
npm run clean
```

## 📊 **Quality Metrics**

Our quality gates enforce:

- **Test Coverage**: >90% (branches, functions, lines)
- **Security**: Zero high-severity vulnerabilities
- **Code Style**: 100% ESLint compliance
- **Type Safety**: 100% TypeScript compliance
- **Build Success**: 100% package build success

## 🎯 **Benefits**

1. **Prevents Broken Code** - Catches issues before they reach the repository
2. **Maintains Standards** - Enforces consistent code quality
3. **Reduces CI Failures** - Most issues caught locally
4. **Improves Reliability** - Higher confidence in releases
5. **Developer Experience** - Clear feedback on quality issues

## 🚀 **Getting Started**

1. **Install dependencies**: `npm install`
2. **Set up hooks**: `npm run prepare`
3. **Test quality gates**: `npm run quality:check`
4. **Make a commit**: Quality gates will run automatically!

---

**Remember**: Quality gates are there to help you ship better code! 🚀
