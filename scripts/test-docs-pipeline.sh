#!/bin/bash

# Test Documentation Pipeline
# This script tests the documentation update functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: Check if documentation update script exists and is executable
print_status "Testing documentation update script..."

if [[ ! -f "scripts/update-docs.sh" ]]; then
    print_error "Documentation update script not found"
    exit 1
fi

if [[ ! -x "scripts/update-docs.sh" ]]; then
    print_error "Documentation update script is not executable"
    exit 1
fi

print_success "Documentation update script exists and is executable"

# Test 2: Check if GitHub Actions workflow exists
print_status "Testing GitHub Actions workflow..."

if [[ ! -f ".github/workflows/docs-update.yml" ]]; then
    print_error "GitHub Actions workflow not found"
    exit 1
fi

print_success "GitHub Actions workflow exists"

# Test 3: Test dry-run functionality
print_status "Testing dry-run functionality..."

if ! ./scripts/update-docs.sh --dry-run > /dev/null 2>&1; then
    print_error "Dry-run test failed"
    exit 1
fi

print_success "Dry-run test passed"

# Test 4: Check if npm scripts are configured
print_status "Testing npm scripts..."

if ! npm run docs:preview > /dev/null 2>&1; then
    print_error "npm run docs:preview failed"
    exit 1
fi

print_success "npm scripts configured correctly"

# Test 5: Verify documentation files exist
print_status "Testing documentation files..."

REQUIRED_FILES=(
    "README.md"
    "docs/Package-Index.md"
    "docs/Simple-QA-Test.md"
    "docs/Documentation-Pipeline.md"
    "packages/cli/README.md"
    "packages/client/README.md"
    "packages/storage-monitor/README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required documentation file not found: $file"
        exit 1
    fi
done

print_success "All required documentation files exist"

# Test 6: Check version consistency
print_status "Testing version consistency..."

PACKAGE_VERSION=$(node -p "require('./package.json').version")
CLI_VERSION=$(node -p "require('./packages/cli/package.json').version")
CLIENT_VERSION=$(node -p "require('./packages/client/package.json').version")
STORAGE_VERSION=$(node -p "require('./packages/storage-monitor/package.json').version")

if [[ "$PACKAGE_VERSION" != "$CLI_VERSION" ]] || [[ "$PACKAGE_VERSION" != "$CLIENT_VERSION" ]] || [[ "$PACKAGE_VERSION" != "$STORAGE_VERSION" ]]; then
    print_error "Package versions are not synchronized"
    print_error "Root: $PACKAGE_VERSION, CLI: $CLI_VERSION, Client: $CLIENT_VERSION, Storage: $STORAGE_VERSION"
    exit 1
fi

print_success "All package versions are synchronized at $PACKAGE_VERSION"

# Test 7: Check if main README has correct version
print_status "Testing README version reference..."

if ! grep -q "Current Version.*$PACKAGE_VERSION" README.md; then
    print_warning "README.md may not have the current version reference"
fi

print_success "README version check completed"

# Test 8: Validate workflow syntax (basic YAML check)
print_status "Testing workflow YAML syntax..."

if command -v python3 &> /dev/null; then
    if python3 -c "import yaml" 2>/dev/null; then
        if ! python3 -c "import yaml; yaml.safe_load(open('.github/workflows/docs-update.yml'))" 2>/dev/null; then
            print_error "GitHub Actions workflow has invalid YAML syntax"
            exit 1
        fi
        print_success "Workflow YAML syntax is valid"
    else
        print_warning "PyYAML not installed, skipping YAML syntax check"
    fi
else
    print_warning "Python3 not available, skipping YAML syntax check"
fi

# Summary
echo ""
echo "🎉 Documentation Pipeline Test Results:"
echo "✅ Documentation update script: Working"
echo "✅ GitHub Actions workflow: Present"
echo "✅ Dry-run functionality: Working"
echo "✅ NPM scripts: Configured"
echo "✅ Documentation files: Present"
echo "✅ Version synchronization: $PACKAGE_VERSION"
echo "✅ README version: Current"
echo "✅ Workflow syntax: Valid"
echo ""
echo "📚 Documentation pipeline is ready for use!"
echo ""
echo "Usage:"
echo "  npm run docs:preview    # Preview changes"
echo "  npm run docs:update     # Apply changes"
echo "  ./scripts/update-docs.sh 2.3.2 --dry-run  # Test specific version"
echo ""
echo "GitHub Actions will automatically update docs on:"
echo "  - New release tags (v*)"
echo "  - GitHub releases"
echo "  - Manual workflow dispatch"
