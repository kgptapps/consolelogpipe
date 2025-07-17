#!/bin/bash

# Console Log Pipe Test Runner
# Automated validation of both npm packages

set -e

echo "🚀 Console Log Pipe Package Validation"
echo "======================================"
echo ""

# Check Node.js version
echo "📋 Environment Check:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Platform: $(uname -s)"
echo ""

# Check if packages exist on npm
echo "🔍 Checking NPM packages..."
if npm view @kansnpms/console-log-pipe-cli version > /dev/null 2>&1; then
    CLI_VERSION=$(npm view @kansnpms/console-log-pipe-cli version)
    echo "✅ CLI package found: v$CLI_VERSION"
else
    echo "❌ CLI package not found on npm"
    exit 1
fi

if npm view @kansnpms/console-log-pipe-client version > /dev/null 2>&1; then
    CLIENT_VERSION=$(npm view @kansnpms/console-log-pipe-client version)
    echo "✅ Client package found: v$CLIENT_VERSION"
else
    echo "❌ Client package not found on npm"
    exit 1
fi

echo ""
echo "🧪 Running Enhanced Test Suite..."
echo "This will:"
echo "  1. Install CLI package globally"
echo "  2. Create test applications (HTML + React)"
echo "  3. Start CLI servers"
echo "  4. Test log streaming functionality"
echo "  5. Generate detailed reports"
echo ""

# Make test files executable
chmod +x automated-test-suite.js
chmod +x enhanced-test-suite.js

# Run the enhanced test suite
node enhanced-test-suite.js

echo ""
echo "✅ Test execution completed!"
echo "📊 Check test-report.md for detailed results"