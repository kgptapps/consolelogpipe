#!/bin/bash

# Pre-Push Quality Gate Script
# Runs comprehensive quality checks before allowing push
# Prevents version inconsistencies and quality issues

set -e

echo "🔍 Pre-Push Quality Gate"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall success
OVERALL_SUCCESS=true

# Function to report check results
report_check() {
    local check_name="$1"
    local success="$2"
    local details="$3"
    
    if [ "$success" = "true" ]; then
        echo -e "✅ ${GREEN}$check_name${NC}"
    else
        echo -e "❌ ${RED}$check_name${NC}"
        if [ -n "$details" ]; then
            echo -e "   ${YELLOW}$details${NC}"
        fi
        OVERALL_SUCCESS=false
    fi
}

# 1. Version Consistency Check
echo "🔢 Checking version consistency..."
ROOT_VERSION=$(node -p "require('./package.json').version")
CLI_VERSION=$(node -p "require('./packages/cli/package.json').version")
CLIENT_VERSION=$(node -p "require('./packages/client/package.json').version")
STORAGE_VERSION=$(node -p "require('./packages/storage-monitor/package.json').version")

if [ "$ROOT_VERSION" = "$CLI_VERSION" ] && [ "$ROOT_VERSION" = "$CLIENT_VERSION" ] && [ "$ROOT_VERSION" = "$STORAGE_VERSION" ]; then
    report_check "Version Consistency" "true"
else
    report_check "Version Consistency" "false" "Versions don't match: Root=$ROOT_VERSION, CLI=$CLI_VERSION, Client=$CLIENT_VERSION, Storage=$STORAGE_VERSION"
fi

# 2. Version Test Consistency Check
echo ""
echo "🧪 Checking version test consistency..."
TEST_VERSION=$(grep -o "toBe('.*')" packages/client/tests/index.test.js | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" || echo "NOT_FOUND")

if [ "$TEST_VERSION" = "$ROOT_VERSION" ]; then
    report_check "Version Test Consistency" "true"
else
    report_check "Version Test Consistency" "false" "Test expects version '$TEST_VERSION' but package version is '$ROOT_VERSION'"
fi

# 3. Build Check
echo ""
echo "🏗️ Running build check..."
if npm run build > /dev/null 2>&1; then
    report_check "Build" "true"
else
    report_check "Build" "false" "Build failed - run 'npm run build' to see details"
fi

# 4. Test Check
echo ""
echo "🧪 Running tests..."
if npm test > /dev/null 2>&1; then
    report_check "Tests" "true"
else
    report_check "Tests" "false" "Tests failed - run 'npm test' to see details"
fi

# 5. Lint Check
echo ""
echo "🔍 Running lint check..."
if npm run lint > /dev/null 2>&1; then
    report_check "Lint" "true"
else
    report_check "Lint" "false" "Lint failed - run 'npm run lint' to see details"
fi

# 6. Package Lock Consistency
echo ""
echo "📦 Checking package-lock.json consistency..."
if npm ci > /dev/null 2>&1; then
    report_check "Package Lock Consistency" "true"
else
    report_check "Package Lock Consistency" "false" "package-lock.json is out of sync - run 'npm install' to fix"
fi

# Final result
echo ""
echo "========================"
if [ "$OVERALL_SUCCESS" = "true" ]; then
    echo -e "🎉 ${GREEN}All quality checks passed!${NC}"
    echo ""
    exit 0
else
    echo -e "💥 ${RED}Quality gate failed!${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "   • Version mismatch: Update all package.json versions to match"
    echo "   • Test version mismatch: Update version test in packages/client/tests/index.test.js"
    echo "   • Build/test failures: Fix the underlying issues"
    echo "   • Package lock: Run 'npm install' to sync package-lock.json"
    echo ""
    exit 1
fi
