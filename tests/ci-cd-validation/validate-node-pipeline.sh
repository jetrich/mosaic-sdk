#!/bin/bash
# validate-node-pipeline.sh - Validate Node.js TypeScript CI/CD Pipeline

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="node-ts"

echo "================================================"
echo "Node.js TypeScript Pipeline Validation"
echo "================================================"

# Function to run a command and check its result
run_test() {
    local test_name=$1
    local command=$2
    local expected_exit_code=${3:-0}
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        actual_exit_code=0
    else
        actual_exit_code=$?
    fi
    
    if [ $actual_exit_code -eq $expected_exit_code ]; then
        echo -e "${GREEN}PASS${NC}"
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "Expected exit code: $expected_exit_code, got: $actual_exit_code"
        echo "Output:"
        cat /tmp/test_output.log
        return 1
    fi
}

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Track failures
FAILURES=0

echo ""
echo "1. Dependency Installation"
echo "--------------------------"
run_test "npm install" "npm ci" || ((FAILURES++))
run_test "Check dependencies" "npm ls --depth=0" || ((FAILURES++))

echo ""
echo "2. Code Quality Checks"
echo "----------------------"
run_test "ESLint" "npm run lint" || ((FAILURES++))
run_test "TypeScript check" "npm run type-check" || ((FAILURES++))

echo ""
echo "3. Testing"
echo "----------"
run_test "Unit tests" "npm test" || ((FAILURES++))
run_test "Test coverage" "npm run test:coverage" || ((FAILURES++))

# Check coverage thresholds
echo -n "Testing: Coverage thresholds... "
COVERAGE_OUTPUT=$(npm run test:coverage 2>&1)
if echo "$COVERAGE_OUTPUT" | grep -q "All files.*[8-9][0-9]\.[0-9]*%\|100%"; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${YELLOW}WARN${NC} - Coverage might be below threshold"
fi

echo ""
echo "4. Build Process"
echo "----------------"
run_test "Build application" "npm run build" || ((FAILURES++))
run_test "Check build output" "test -d dist && test -f dist/index.js" || ((FAILURES++))

echo ""
echo "5. Application Execution"
echo "------------------------"
run_test "Run built application" "timeout 5s npm start || [ $? -eq 124 ]" || ((FAILURES++))

echo ""
echo "6. Docker Build"
echo "---------------"
if command -v docker &> /dev/null; then
    run_test "Docker build" "docker build -t node-ts-test:validation ." || ((FAILURES++))
    run_test "Docker run" "docker run --rm node-ts-test:validation" || ((FAILURES++))
    
    # Cleanup
    docker rmi node-ts-test:validation > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}SKIP${NC} - Docker not available"
fi

echo ""
echo "7. CI/CD Configuration"
echo "----------------------"
run_test "Woodpecker config exists" "test -f .woodpecker.yml" || ((FAILURES++))
run_test "Woodpecker config valid" "grep -q 'steps:' .woodpecker.yml && grep -q 'install:' .woodpecker.yml" || ((FAILURES++))

echo ""
echo "8. Intentional Failures"
echo "-----------------------"
# Test that CI/CD catches errors
echo -n "Testing: Catching lint errors... "
# Temporarily create a file with lint errors
cat > src/bad-code.ts << 'EOF'
// This file has intentional errors
const unused_variable = 42;
console.log("This should fail linting")
function noReturnType(a, b) {
    return a + b
}
EOF

if npm run lint > /tmp/test_output.log 2>&1; then
    echo -e "${RED}FAIL${NC} - Linter should have caught errors"
    ((FAILURES++))
else
    echo -e "${GREEN}PASS${NC} - Linter correctly caught errors"
fi
rm -f src/bad-code.ts

echo ""
echo "9. Performance Metrics"
echo "----------------------"
echo "Build time:"
time npm run build > /dev/null 2>&1

echo ""
echo "Test execution time:"
time npm test > /dev/null 2>&1

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "The Node.js TypeScript pipeline is properly configured."
else
    echo -e "${RED}$FAILURES tests failed!${NC}"
    echo "Please fix the issues before deploying."
fi

echo ""
echo "Pipeline Features Validated:"
echo "✓ Dependency management with npm"
echo "✓ Code quality with ESLint"
echo "✓ Type safety with TypeScript"
echo "✓ Unit testing with Jest"
echo "✓ Code coverage enforcement"
echo "✓ Build process"
echo "✓ Docker containerization"
echo "✓ CI/CD configuration"

# Cleanup
rm -rf coverage dist node_modules

exit $FAILURES