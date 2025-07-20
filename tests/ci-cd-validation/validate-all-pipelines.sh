#!/bin/bash
# validate-all-pipelines.sh - Run all CI/CD pipeline validations

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo "================================================"
echo -e "${BOLD}MosAIc Stack CI/CD Pipeline Validation Suite${NC}"
echo "================================================"
echo ""
echo "This script will validate CI/CD pipelines for:"
echo "  • Node.js TypeScript"
echo "  • React/Next.js"
echo "  • Python FastAPI"
echo "  • Go"
echo ""

# Track overall results
TOTAL_PIPELINES=4
PASSED_PIPELINES=0
FAILED_PIPELINES=0

# Function to run a pipeline validation
run_pipeline_validation() {
    local name=$1
    local script=$2
    
    echo ""
    echo "================================================"
    echo -e "${BOLD}Running $name Pipeline Validation${NC}"
    echo "================================================"
    
    if [ -f "$script" ]; then
        if bash "$script"; then
            echo -e "\n${GREEN}✓ $name pipeline validation PASSED${NC}"
            ((PASSED_PIPELINES++))
        else
            echo -e "\n${RED}✗ $name pipeline validation FAILED${NC}"
            ((FAILED_PIPELINES++))
        fi
    else
        echo -e "${RED}ERROR: Validation script not found: $script${NC}"
        ((FAILED_PIPELINES++))
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run all validations
run_pipeline_validation "Node.js TypeScript" "$SCRIPT_DIR/validate-node-pipeline.sh"
run_pipeline_validation "React/Next.js" "$SCRIPT_DIR/validate-react-pipeline.sh"
run_pipeline_validation "Python FastAPI" "$SCRIPT_DIR/validate-python-pipeline.sh"
run_pipeline_validation "Go" "$SCRIPT_DIR/validate-go-pipeline.sh"

# Summary report
echo ""
echo ""
echo "================================================"
echo -e "${BOLD}CI/CD Validation Summary Report${NC}"
echo "================================================"
echo ""
echo -e "Total Pipelines Tested: ${BOLD}$TOTAL_PIPELINES${NC}"
echo -e "Passed: ${GREEN}$PASSED_PIPELINES${NC}"
echo -e "Failed: ${RED}$FAILED_PIPELINES${NC}"
echo ""

# Success rate
SUCCESS_RATE=$((PASSED_PIPELINES * 100 / TOTAL_PIPELINES))
echo -n "Success Rate: "
if [ $SUCCESS_RATE -eq 100 ]; then
    echo -e "${GREEN}${BOLD}100%${NC} 🎉"
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo -e "${YELLOW}${SUCCESS_RATE}%${NC}"
else
    echo -e "${RED}${SUCCESS_RATE}%${NC}"
fi

echo ""
echo "================================================"
echo -e "${BOLD}Common CI/CD Features Validated${NC}"
echo "================================================"
echo ""
echo "✓ Dependency Management"
echo "  - npm/yarn for Node.js projects"
echo "  - pip/poetry for Python"
echo "  - go modules for Go"
echo ""
echo "✓ Code Quality"
echo "  - Linting (ESLint, Flake8, golangci-lint)"
echo "  - Type checking (TypeScript, mypy)"
echo "  - Code formatting (Prettier, Black, gofmt)"
echo ""
echo "✓ Testing"
echo "  - Unit tests with coverage"
echo "  - Integration tests"
echo "  - E2E tests (Playwright for web apps)"
echo "  - Performance/benchmark tests"
echo ""
echo "✓ Security"
echo "  - Dependency vulnerability scanning"
echo "  - SAST (Bandit, gosec)"
echo "  - Security headers validation"
echo ""
echo "✓ Build & Deploy"
echo "  - Multi-stage Docker builds"
echo "  - Cross-platform builds (Go)"
echo "  - Production optimizations"
echo "  - Health checks"
echo ""
echo "✓ Documentation"
echo "  - API documentation (Swagger/OpenAPI)"
echo "  - Code documentation"
echo "  - README files"
echo ""

# Recommendations
if [ $FAILED_PIPELINES -gt 0 ]; then
    echo "================================================"
    echo -e "${BOLD}Recommendations${NC}"
    echo "================================================"
    echo ""
    echo "Some pipelines failed validation. Common issues to check:"
    echo ""
    echo "1. Missing dependencies:"
    echo "   - Ensure all required tools are installed"
    echo "   - Check package.json, requirements.txt, go.mod"
    echo ""
    echo "2. Configuration issues:"
    echo "   - Verify .woodpecker.yml syntax"
    echo "   - Check environment variables"
    echo "   - Ensure correct file paths"
    echo ""
    echo "3. Code quality:"
    echo "   - Fix linting errors"
    echo "   - Resolve type checking issues"
    echo "   - Address security vulnerabilities"
    echo ""
    echo "4. Test failures:"
    echo "   - Ensure all tests pass locally"
    echo "   - Check test coverage thresholds"
    echo "   - Verify test dependencies"
    echo ""
fi

# Final status
echo ""
if [ $FAILED_PIPELINES -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ All CI/CD pipelines are properly configured!${NC}"
    echo "The test projects demonstrate best practices for CI/CD."
    exit 0
else
    echo -e "${RED}${BOLD}❌ Some pipelines need attention.${NC}"
    echo "Please review the failures above and fix the issues."
    exit 1
fi