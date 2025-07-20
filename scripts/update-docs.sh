#!/bin/bash

# Documentation Update Script
# Usage: ./scripts/update-docs.sh [version] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERSION=""
DRY_RUN=false
CURRENT_DIR=$(pwd)

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [version] [--dry-run]"
    echo ""
    echo "Arguments:"
    echo "  version     Version to update documentation to (e.g., 2.3.1)"
    echo "  --dry-run   Show what would be changed without making changes"
    echo ""
    echo "Examples:"
    echo "  $0 2.3.1                    # Update docs to version 2.3.1"
    echo "  $0 2.3.1 --dry-run          # Preview changes for version 2.3.1"
    echo "  $0 --dry-run                # Preview changes with current package version"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                print_error "Too many arguments"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Get version from package.json if not provided
if [[ -z "$VERSION" ]]; then
    if [[ -f "package.json" ]]; then
        VERSION=$(node -p "require('./package.json').version")
        print_status "Using version from package.json: $VERSION"
    else
        print_error "No version specified and package.json not found"
        show_usage
        exit 1
    fi
fi

# Validate version format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$ ]]; then
    print_error "Invalid version format: $VERSION"
    print_error "Expected format: X.Y.Z or X.Y.Z-suffix"
    exit 1
fi

print_status "Updating documentation to version: $VERSION"

if [[ "$DRY_RUN" == true ]]; then
    print_warning "DRY RUN MODE - No changes will be made"
fi

# Function to update file
update_file() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    local description="$4"

    if [[ ! -f "$file" ]]; then
        print_warning "File not found: $file"
        return
    fi

    if [[ "$DRY_RUN" == true ]]; then
        local matches=$(grep -E "$pattern" "$file" 2>/dev/null | wc -l || echo "0")
        matches=$(echo "$matches" | tr -d ' ')
        if [[ "$matches" -gt 0 ]]; then
            print_status "Would update $file: $description ($matches matches)"
            grep -n -E "$pattern" "$file" 2>/dev/null | head -3 || true
        fi
    else
        local before_count=$(grep -E "$pattern" "$file" 2>/dev/null | wc -l || echo "0")
        before_count=$(echo "$before_count" | tr -d ' ')

        if [[ "$before_count" -gt 0 ]]; then
            # Use different approach for macOS vs Linux sed
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|$pattern|$replacement|g" "$file"
            else
                sed -i "s|$pattern|$replacement|g" "$file"
            fi
            print_success "Updated $file: $description ($before_count matches)"
        fi
    fi
}

# Update main README.md
print_status "Updating main README.md..."
update_file "README.md" \
    "\\*\\*Current Version:\\*\\* \`[^\`]*\`" \
    "**Current Version:** \`$VERSION\`" \
    "main version reference"

# Update package READMEs
for package in cli client storage; do
    readme_file="packages/$package/README.md"
    if [[ -f "$readme_file" ]]; then
        print_status "Updating $package README..."
        update_file "$readme_file" \
            "\\*\\*Version:\\*\\* [0-9]+\\.[0-9]+\\.[0-9]+[^|]*" \
            "**Version:** $VERSION" \
            "package version"
    fi
done

# Update documentation files
print_status "Updating documentation files..."

# Package Index
update_file "docs/Package-Index.md" \
    "Current Version:\\*\\* \`[^\`]*\`" \
    "Current Version:** \`$VERSION\`" \
    "package index version"

# Simple QA Test
update_file "docs/Simple-QA-Test.md" \
    "\\*\\*Version:\\*\\* [0-9]+\\.[0-9]+\\.[0-9]+[^|]*" \
    "**Version:** $VERSION" \
    "QA test version"

update_file "docs/Simple-QA-Test.md" \
    "Expected: [0-9]+\\.[0-9]+\\.[0-9]+" \
    "Expected: $VERSION" \
    "expected version in tests"

update_file "docs/Simple-QA-Test.md" \
    "Version shows [0-9]+\\.[0-9]+\\.[0-9]+" \
    "Version shows $VERSION" \
    "version check expectations"

# Update installation examples in project files only
print_status "Updating installation examples..."
for file in README.md docs/*.md packages/*/README.md; do
    if [[ -f "$file" ]]; then
        update_file "$file" \
            "@[0-9]+\\.[0-9]+\\.[0-9]+" \
            "@$VERSION" \
            "npm package version references"
    fi
done

# Show summary
if [[ "$DRY_RUN" == true ]]; then
    print_warning "DRY RUN COMPLETE - No changes were made"
    print_status "Run without --dry-run to apply changes"
else
    print_success "Documentation update complete!"
    
    # Check if there are any changes
    if git diff --quiet; then
        print_warning "No changes were made to tracked files"
    else
        print_status "Changed files:"
        git diff --name-only | sed 's/^/  - /'
        
        print_status "To commit these changes, run:"
        echo "  git add ."
        echo "  git commit -m \"docs: update documentation to version $VERSION\""
    fi
fi
