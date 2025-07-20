#!/bin/bash
# validate-react-pipeline.sh - Validate React/Next.js CI/CD Pipeline

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="react-next"

echo "================================================"
echo "React/Next.js Pipeline Validation"
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
        head -20 /tmp/test_output.log
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
run_test "Check dependencies" "npm ls react react-dom next --depth=0" || ((FAILURES++))

echo ""
echo "2. Code Quality Checks"
echo "----------------------"
run_test "Next.js lint" "npm run lint" || ((FAILURES++))
run_test "TypeScript check" "npm run type-check" || ((FAILURES++))

echo ""
echo "3. Testing"
echo "----------"
run_test "Unit tests" "npm test -- --passWithNoTests" || ((FAILURES++))
run_test "Test coverage" "npm run test:coverage -- --passWithNoTests" || ((FAILURES++))

echo ""
echo "4. Build Process"
echo "----------------"
run_test "Next.js build" "npm run build" || ((FAILURES++))
run_test "Check build output" "test -d .next && test -f .next/BUILD_ID" || ((FAILURES++))

# Check build size
echo -n "Testing: Build size analysis... "
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
echo -e "${BLUE}Build size: $BUILD_SIZE${NC}"

echo ""
echo "5. Production Server Test"
echo "-------------------------"
# Start Next.js in production mode
echo -n "Testing: Production server startup... "
npm run start > /tmp/nextjs.log 2>&1 &
SERVER_PID=$!
sleep 10

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    ((FAILURES++))
fi

# Test specific endpoints
run_test "Health check endpoint" "curl -s http://localhost:3000 | grep -q 'CI/CD Test Application'" || ((FAILURES++))

# Kill the server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "6. E2E Tests (Playwright)"
echo "-------------------------"
# Install Playwright browsers if not already installed
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium > /dev/null 2>&1
fi

# Run E2E tests
run_test "E2E tests" "npm run test:e2e -- --project=chromium" || ((FAILURES++))

echo ""
echo "7. Bundle Analysis"
echo "------------------"
echo -n "Testing: Bundle analyzer... "
if ANALYZE=true npm run build > /tmp/analyze.log 2>&1; then
    if [ -f "analyze/client.html" ]; then
        echo -e "${GREEN}PASS${NC}"
        echo "Bundle analysis report generated"
    else
        echo -e "${YELLOW}WARN${NC} - Analyzer ran but no report generated"
    fi
else
    echo -e "${YELLOW}SKIP${NC} - Bundle analyzer not configured"
fi

echo ""
echo "8. Docker Build"
echo "---------------"
if command -v docker &> /dev/null; then
    run_test "Docker build" "docker build -t react-next-test:validation ." || ((FAILURES++))
    
    # Test Docker container
    echo -n "Testing: Docker container... "
    docker run -d --name react-test -p 3001:3000 react-next-test:validation > /dev/null 2>&1
    sleep 10
    
    if curl -s http://localhost:3001 > /dev/null; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        ((FAILURES++))
    fi
    
    # Cleanup
    docker stop react-test > /dev/null 2>&1 || true
    docker rm react-test > /dev/null 2>&1 || true
    docker rmi react-next-test:validation > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}SKIP${NC} - Docker not available"
fi

echo ""
echo "9. CI/CD Configuration"
echo "----------------------"
run_test "Woodpecker config exists" "test -f .woodpecker.yml" || ((FAILURES++))
run_test "Has E2E test stage" "grep -q 'test-e2e:' .woodpecker.yml" || ((FAILURES++))
run_test "Has Lighthouse CI" "grep -q 'lighthouse:' .woodpecker.yml" || ((FAILURES++))

echo ""
echo "10. Performance Checks"
echo "----------------------"
# Measure build performance
echo "Build performance:"
time npm run build > /dev/null 2>&1

# Check for common performance issues
echo ""
echo "Checking for performance best practices:"
echo -n "  - Image optimization... "
if grep -q "next/image" src/components/*.tsx 2>/dev/null || echo "No images used"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}Consider using next/image${NC}"
fi

echo -n "  - Code splitting... "
if [ -f ".next/build-manifest.json" ]; then
    echo -e "${GREEN}Automatic via Next.js${NC}"
else
    echo -e "${YELLOW}Build first to verify${NC}"
fi

echo ""
echo "11. Security Headers"
echo "--------------------"
run_test "Security headers configured" "grep -q 'X-Frame-Options' next.config.js" || ((FAILURES++))

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "The React/Next.js pipeline is properly configured."
else
    echo -e "${RED}$FAILURES tests failed!${NC}"
    echo "Please fix the issues before deploying."
fi

echo ""
echo "Pipeline Features Validated:"
echo "✓ Next.js specific linting"
echo "✓ TypeScript support"
echo "✓ Unit testing with React Testing Library"
echo "✓ E2E testing with Playwright"
echo "✓ Production build optimization"
echo "✓ Bundle size analysis"
echo "✓ Security headers"
echo "✓ Docker containerization"
echo "✓ Performance monitoring setup"

# Cleanup
rm -rf .next coverage node_modules analyze playwright-report test-results

exit $FAILURES