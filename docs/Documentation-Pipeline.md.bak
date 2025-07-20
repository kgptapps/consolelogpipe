# 📚 Documentation Pipeline

Automated documentation update system for Console Log Pipe project.

## 🚀 Overview

The documentation pipeline automatically updates version numbers, badges, and references across all
documentation files when new releases are created or when manually triggered.

## 🔧 Components

### 1. GitHub Actions Workflow (`.github/workflows/docs-update.yml`)

**Triggers:**

- ✅ **Automatic**: When new release tags are pushed (`v*`)
- ✅ **Automatic**: When GitHub releases are published
- ✅ **Manual**: Via GitHub Actions UI with custom parameters

**What it updates:**

- Version numbers in all README files
- Package version references
- Installation examples
- Test expectations
- Coverage badges
- Build status badges

### 2. Local Update Script (`scripts/update-docs.sh`)

**Usage:**

```bash
# Update to specific version
./scripts/update-docs.sh 2.3.1

# Preview changes without applying
./scripts/update-docs.sh 2.3.1 --dry-run

# Use current package.json version
./scripts/update-docs.sh

# Preview with current version
./scripts/update-docs.sh --dry-run
```

**NPM Scripts:**

```bash
# Update docs to current package.json version
npm run docs:update

# Preview changes without applying
npm run docs:preview
```

## 📋 Files Updated

### Main Documentation

- `README.md` - Main project version and status
- `docs/Package-Index.md` - Package versions and links
- `docs/Simple-QA-Test.md` - Test version expectations

### Package Documentation

- `packages/cli/README.md` - CLI package version
- `packages/client/README.md` - Client library version
- `packages/storage/README.md` - Storage package version

### Version References

- All `*.md` files with npm package version references (`@x.y.z`)
- Installation examples and code snippets
- Test expectations and validation scripts

## 🎯 Manual Trigger Options

### GitHub Actions UI

1. Go to **Actions** → **Documentation Update**
2. Click **Run workflow**
3. Configure options:
   - **Version**: Target version (e.g., `2.3.1`)
   - **Update Type**: `version`, `badges`, or `all`
   - **Commit Message**: Custom message (optional)

### Command Line

```bash
# Trigger via GitHub CLI
gh workflow run docs-update.yml \
  -f version=2.3.1 \
  -f update_type=all \
  -f commit_message="docs: update for hotfix release"
```

## 🔄 Automatic Triggers

### On Release Tag Push

```bash
git tag v2.3.1
git push origin v2.3.1
# → Automatically updates docs to version 2.3.1
```

### On GitHub Release

When a release is published through GitHub UI or API, documentation is automatically updated to
match the release version.

## 📊 Update Types

### `version` (Default)

- Updates version numbers in all documentation
- Updates package references
- Updates test expectations

### `badges`

- Updates coverage badges
- Updates build status badges
- Updates other dynamic badges

### `all`

- Combines `version` + `badges`
- Updates package links and references
- Most comprehensive update

## 🛠️ Customization

### Adding New Files

To include additional files in documentation updates, modify:

1. **GitHub Actions**: Update `.github/workflows/docs-update.yml`
2. **Local Script**: Update `scripts/update-docs.sh`

### Custom Patterns

Add new regex patterns for version updates:

```bash
# In update-docs.sh
update_file "path/to/file.md" \
    "pattern-to-match" \
    "replacement-pattern" \
    "description"
```

## 🔍 Verification

### Dry Run Mode

Always test changes first:

```bash
npm run docs:preview
# or
./scripts/update-docs.sh --dry-run
```

### Git Status Check

After updates, verify changes:

```bash
git diff --name-only
git diff README.md
```

## 🚨 Troubleshooting

### Common Issues

**Script not executable:**

```bash
chmod +x scripts/update-docs.sh
```

**Version format errors:**

- Use semantic versioning: `X.Y.Z` or `X.Y.Z-suffix`
- Don't include `v` prefix in version parameter

**No changes detected:**

- Check if files already have the target version
- Verify regex patterns match current format
- Use `--dry-run` to see what would be matched

### Debug Mode

Enable verbose output:

```bash
# Add debug flag to script
DEBUG=1 ./scripts/update-docs.sh 2.3.1 --dry-run
```

## 📈 Best Practices

### Release Workflow

1. **Update code** and tests
2. **Run tests** to ensure quality
3. **Update package.json** versions
4. **Create release tag** (triggers automatic doc updates)
5. **Verify documentation** was updated correctly

### Manual Updates

1. **Always use dry-run** first
2. **Review changes** before committing
3. **Test updated documentation** for accuracy
4. **Commit with descriptive message**

### Version Management

- Keep all packages synchronized to same version
- Use semantic versioning consistently
- Update documentation immediately after version changes

## 🎉 Benefits

- ✅ **Consistency**: All docs stay in sync with releases
- ✅ **Automation**: Reduces manual documentation maintenance
- ✅ **Accuracy**: Eliminates version mismatch errors
- ✅ **Efficiency**: Saves time on routine updates
- ✅ **Reliability**: Automated triggers prevent forgotten updates
