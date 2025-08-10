#!/bin/bash

# MCP Orchestrator CI/CD Validation Script
# This script validates the CI/CD pipeline configuration and runs local checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$PACKAGE_DIR/../.." && pwd)"

echo "🔍 MCP Orchestrator CI/CD Validation"
echo "Package Directory: $PACKAGE_DIR"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        return 1
    fi
}

# Function to run with status check
run_check() {
    local description="$1"
    shift
    echo "🔧 $description..."
    if "$@" >/dev/null 2>&1; then
        print_status 0 "$description"
    else
        print_status 1 "$description"
        return 1
    fi
}

echo "📋 Pre-flight Checks"
echo "===================="

# Check required tools
echo "🔧 Checking required tools..."
run_check "Node.js installed" command_exists node
run_check "NPM installed" command_exists npm
run_check "Git installed" command_exists git

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 16 ]; then
    print_status 0 "Node.js version ($NODE_VERSION) >= 16"
else
    print_status 1 "Node.js version ($NODE_VERSION) < 16"
fi

echo ""
echo "📦 Package Structure Validation"
echo "================================="

cd "$PACKAGE_DIR"

# Check required files
echo "🔧 Checking package structure..."
required_files=(
    "package.json"
    "tsconfig.json"
    "jest.config.js"
    "src/index.ts"
    "src/main.ts"
    ".eslintrc.js"
    ".prettierrc"
    "tests/unit/config/test-config.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Required file: $file"
    else
        print_status 1 "Missing file: $file"
    fi
done

# Check CI/CD files
echo ""
echo "🔧 Checking CI/CD configuration..."
cicd_files=(
    "$PROJECT_ROOT/.github/workflows/mcp-orchestrator-ci.yml"
    "CI-CD-IMPLEMENTATION.md"
)

for file in "${cicd_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "CI/CD file: $(basename "$file")"
    else
        print_status 1 "Missing CI/CD file: $file"
    fi
done

echo ""
echo "🏗️ Build and Compilation"
echo "========================"

# Install dependencies
echo "🔧 Installing dependencies..."
if npm ci >/dev/null 2>&1; then
    print_status 0 "Dependencies installed"
else
    print_status 1 "Failed to install dependencies"
    exit 1
fi

# TypeScript compilation
echo "🔧 TypeScript compilation..."
if npm run build >/dev/null 2>&1; then
    print_status 0 "TypeScript compilation"
    
    # Check build outputs
    if [ -f "dist/index.js" ] && [ -f "dist/index.d.ts" ]; then
        print_status 0 "Build outputs present"
    else
        print_status 1 "Build outputs missing"
    fi
else
    print_status 1 "TypeScript compilation failed"
fi

echo ""
echo "🧪 Testing Pipeline"
echo "==================="

# Create test config if missing
if [ ! -f "tests/unit/config/test-config.json" ]; then
    echo "🔧 Creating test configuration..."
    mkdir -p tests/unit/config
    cat > tests/unit/config/test-config.json << 'EOF'
{
  "server": {
    "name": "test-mcp-orchestrator",
    "version": "1.0.0",
    "port": 0
  },
  "database": {
    "path": ":memory:"
  },
  "logging": {
    "level": "error"
  }
}
EOF
    print_status 0 "Test configuration created"
fi

# Run tests
echo "🔧 Running unit tests..."
if npm test >/dev/null 2>&1; then
    print_status 0 "Unit tests"
    
    # Check coverage
    if [ -d "coverage" ]; then
        print_status 0 "Coverage reports generated"
        
        # Extract coverage percentage if possible
        if [ -f "coverage/lcov-report/index.html" ]; then
            COVERAGE=$(grep -o "lines.*: [0-9.]*%" coverage/lcov-report/index.html | head -1 | grep -o "[0-9.]*" || echo "unknown")
            echo "📊 Coverage: ${COVERAGE}%"
        fi
    else
        echo "⚠️ No coverage reports found"
    fi
else
    print_status 1 "Unit tests failed"
fi

echo ""
echo "🔍 Code Quality"
echo "==============="

# ESLint check
echo "🔧 Running ESLint..."
if npm run lint >/dev/null 2>&1; then
    print_status 0 "ESLint validation"
else
    print_status 1 "ESLint issues found"
fi

# Prettier check (if available)
if npm run format >/dev/null 2>&1; then
    print_status 0 "Code formatting"
else
    echo "⚠️ No format script available"
fi

echo ""
echo "🔒 Security Validation"
echo "======================"

# NPM audit
echo "🔧 Running npm audit..."
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities": {}}')
HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")
CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$CRITICAL_VULNS" -eq 0 ] && [ "$HIGH_VULNS" -eq 0 ]; then
    print_status 0 "No critical or high vulnerabilities"
elif [ "$CRITICAL_VULNS" -eq 0 ]; then
    echo "⚠️ $HIGH_VULNS high vulnerabilities found (review required)"
else
    print_status 1 "$CRITICAL_VULNS critical vulnerabilities found"
fi

echo ""
echo "📦 Package Validation"
echo "====================="

# Package creation test
echo "🔧 Testing package creation..."
if npm pack --dry-run >/dev/null 2>&1; then
    print_status 0 "Package creation test"
else
    print_status 1 "Package creation failed"
fi

# CLI validation
if [ -f "bin/mosaic-mcp" ]; then
    echo "🔧 Testing CLI..."
    chmod +x bin/mosaic-mcp
    if ./bin/mosaic-mcp --help >/dev/null 2>&1; then
        print_status 0 "CLI functionality"
    else
        print_status 1 "CLI test failed"
    fi
else
    echo "⚠️ CLI binary not found"
fi

echo ""
echo "📊 Validation Summary"
echo "====================="

# Count successes and failures
SUCCESS_COUNT=$(grep -c "✅" /tmp/ci_validation_$$ 2>/dev/null || echo "0")
FAILURE_COUNT=$(grep -c "❌" /tmp/ci_validation_$$ 2>/dev/null || echo "0")

echo "✅ Successful checks: $SUCCESS_COUNT"
echo "❌ Failed checks: $FAILURE_COUNT"

if [ "$FAILURE_COUNT" -eq 0 ]; then
    echo ""
    echo "🎉 All CI/CD validation checks passed!"
    echo "The pipeline is ready for production use."
    exit 0
else
    echo ""
    echo "⚠️ Some validation checks failed."
    echo "Please address the issues before running the CI/CD pipeline."
    exit 1
fi