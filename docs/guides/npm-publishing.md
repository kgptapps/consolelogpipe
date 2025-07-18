# Package Publishing Guide

This guide covers the complete process for publishing Console Log Pipe packages to both NPM (under
the `@kansnpms` organization) and GitHub Packages (under the `@kgptapps` organization).

## 📋 Prerequisites

### 1. NPM Account Setup

- Create an NPM account at [npmjs.com](https://www.npmjs.com)
- Join the `kansnpms` organization
- Ensure you have publishing permissions for the organization

### 2. Authentication

```bash
# Login to NPM
npm login

# Verify authentication
npm whoami

# Check organization membership
npm org ls kansnpms
```

### 3. Organization Access

- Visit: https://www.npmjs.com/settings/kansnpms/teams/
- Ensure you're added to the appropriate team with publishing permissions
- Verify package access permissions

## 📦 Package Configuration

All packages are configured under the `@kansnpms` organization:

- `@kansnpms/console-log-pipe-client` - Browser client library
- `console-log-pipe` - Global CLI tool (unscoped)
- Browser extensions (private packages)

## 🚀 Publishing Process

### Manual Publishing

#### 1. Pre-publish Checklist

```bash
# Ensure all tests pass
npm run test:all

# Verify linting
npm run lint

# Check TypeScript compilation
npm run type-check

# Build all packages
npm run build

# Verify package contents
npm pack --dry-run
```

#### 2. Version Management

```bash
# Update versions across all packages
npm run version

# Or manually update specific packages
lerna version --conventional-commits
```

#### 3. Publish Packages

```bash
# Publish all packages
npm run publish

# Or publish specific packages
lerna publish from-package

# Publish with specific tag
lerna publish --dist-tag beta
```

### Automated Publishing (CI/CD)

#### 1. Setup NPM Token

```bash
# Generate NPM token
npm token create --read-only

# Add to GitHub Secrets
# NPM_TOKEN=your_token_here
```

#### 2. GitHub Actions Workflow

The repository includes automated publishing via GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to NPM
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run test:all
      - run: npm run publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📋 Package-Specific Instructions

### Client Library (`@kansnpms/console-log-pipe-client`)

```bash
cd packages/client
npm run build
npm publish --access public
```

### CLI Tool (`console-log-pipe`)

```bash
cd packages/cli
npm run build
npm publish --access public
```

## 🏷️ Version Management

### Semantic Versioning

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Types

```bash
# Patch release (bug fixes)
lerna version patch

# Minor release (new features)
lerna version minor

# Major release (breaking changes)
lerna version major

# Prerelease
lerna version prerelease --preid beta
```

## 🔒 Security & Access Control

### Organization Permissions

- **Owner**: Full access to organization and all packages
- **Member**: Can publish packages they have access to
- **Developer**: Read access to packages

### Package Access

```bash
# Grant access to specific user
npm owner add username @kansnpms/package-name

# Remove access
npm owner rm username @kansnpms/package-name

# List package owners
npm owner ls @kansnpms/package-name
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Authentication Errors

```bash
# Re-authenticate
npm logout
npm login

# Check token validity
npm token list
```

#### 2. Permission Denied

```bash
# Verify organization membership
npm org ls kansnpms

# Check package permissions
npm access ls-packages kansnpms
```

#### 3. Version Conflicts

```bash
# Check current versions
npm view @kansnpms/console-log-pipe-client versions --json

# Force version update
lerna version --force-publish
```

#### 4. Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## 📊 Monitoring & Analytics

### Package Statistics

- View download stats: https://www.npmjs.com/package/@kansnpms/console-log-pipe-client
- Monitor package health: https://snyk.io/advisor/npm-package/@kansnpms/console-log-pipe-client

### Automated Monitoring

```bash
# Set up package monitoring
npm audit

# Security scanning
npm audit fix

# Dependency updates
npm outdated
```

## 🔄 Release Workflow

### 1. Development

- Create feature branch
- Implement changes
- Write tests
- Update documentation

### 2. Testing

- Run full test suite
- Verify in multiple environments
- Performance testing
- Security audit

### 3. Release Preparation

- Update CHANGELOG.md
- Bump versions
- Create release notes
- Tag release

### 4. Publishing

- Automated via GitHub Actions
- Manual verification
- Monitor for issues
- Update documentation

### 5. Post-Release

- Monitor download metrics
- Address user feedback
- Plan next release

## 📞 Support

For publishing issues:

1. Check NPM status: https://status.npmjs.org/
2. Review NPM documentation: https://docs.npmjs.com/
3. Contact organization admin
4. Open GitHub issue for project-specific problems

## 📦 GitHub Packages Publishing

Console Log Pipe packages are also published to GitHub Packages under the `@kgptapps` organization.

### Automated Publishing

GitHub Packages publishing is handled automatically by the GitHub Actions workflow in
`.github/workflows/release.yml`. The workflow:

1. **Configures packages** for GitHub Packages by updating package names:

   - `@kansnpms/console-log-pipe-cli` → `@kgptapps/console-log-pipe-cli`
   - `@kansnpms/console-log-pipe-client` → `@kgptapps/console-log-pipe-client`

2. **Publishes to GitHub Packages** using the `GITHUB_TOKEN`

3. **Restores original package.json** files after publishing

### Manual Publishing to GitHub Packages

If needed, you can manually publish to GitHub Packages:

```bash
# Configure npm for GitHub Packages
echo "@kgptapps:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Authenticate with GitHub token
npm login --registry=https://npm.pkg.github.com

# Update package name temporarily
cd packages/client
sed -i 's/@kansnpms\/console-log-pipe-client/@kgptapps\/console-log-pipe-client/' package.json

# Publish to GitHub Packages
npm publish --registry=https://npm.pkg.github.com

# Restore original package name
git checkout package.json
```

### Installation from GitHub Packages

Users can install from GitHub Packages:

```bash
# Configure registry for @kgptapps scope
echo "@kgptapps:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install packages
npm install @kgptapps/console-log-pipe-client
npm install -g @kgptapps/console-log-pipe-cli
```

## 🔗 Useful Links

- [NPM Organization Dashboard](https://www.npmjs.com/settings/kansnpms)
- [GitHub Packages](https://github.com/kgptapps/consolelogpipe/packages)
- [Package Publishing Documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Packages Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Semantic Versioning](https://semver.org/)
- [Lerna Documentation](https://lerna.js.org/)
- [GitHub Actions for NPM](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
