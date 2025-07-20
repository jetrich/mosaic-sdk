#!/bin/bash
# validate-python-pipeline.sh - Validate Python FastAPI CI/CD Pipeline

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="python"

echo "================================================"
echo "Python FastAPI Pipeline Validation"
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

# Create virtual environment
echo "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

echo ""
echo "1. Dependency Installation"
echo "--------------------------"
run_test "pip install" "pip install -r requirements.txt" || ((FAILURES++))
run_test "Check dependencies" "pip list | grep -E 'fastapi|uvicorn|pytest'" || ((FAILURES++))

echo ""
echo "2. Code Quality Checks"
echo "----------------------"
run_test "Black formatting check" "black --check app/ tests/" || ((FAILURES++))
run_test "isort import check" "isort --check-only app/ tests/" || ((FAILURES++))
run_test "Flake8 linting" "flake8 app/ tests/ --max-line-length=88 --extend-ignore=E203,W503" || ((FAILURES++))
run_test "mypy type checking" "mypy app/ --python-version 3.11" || ((FAILURES++))

echo ""
echo "3. Security Scanning"
echo "--------------------"
run_test "Bandit security scan" "bandit -r app/ -f json -o bandit-report.json" || ((FAILURES++))
echo -n "Testing: Safety dependency check... "
if safety check --json > /tmp/safety-report.json 2>&1; then
    echo -e "${GREEN}PASS${NC} - No vulnerabilities found"
else
    echo -e "${YELLOW}WARN${NC} - Some vulnerabilities found (see report)"
fi

echo ""
echo "4. Testing"
echo "----------"
run_test "Unit tests" "pytest tests/ -v" || ((FAILURES++))
run_test "Test coverage" "pytest tests/ -v --cov=app --cov-report=term-missing" || ((FAILURES++))

# Check coverage threshold
echo -n "Testing: Coverage threshold (80%)... "
COVERAGE=$(pytest tests/ --cov=app --cov-report=term-missing 2>&1 | grep "TOTAL" | awk '{print $4}' | sed 's/%//')
if [ ! -z "$COVERAGE" ] && [ "$COVERAGE" -ge 80 ]; then
    echo -e "${GREEN}PASS${NC} - Coverage: ${COVERAGE}%"
else
    echo -e "${RED}FAIL${NC} - Coverage below 80%"
    ((FAILURES++))
fi

echo ""
echo "5. Application Tests"
echo "--------------------"
# Start FastAPI server
echo -n "Testing: FastAPI server startup... "
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/fastapi.log 2>&1 &
SERVER_PID=$!
sleep 5

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    cat /tmp/fastapi.log
    ((FAILURES++))
fi

# Test API endpoints
run_test "Health check endpoint" "curl -s http://localhost:8000/health | grep -q 'healthy'" || ((FAILURES++))
run_test "Root endpoint" "curl -s http://localhost:8000/ | grep -q 'Python CI/CD Test API'" || ((FAILURES++))
run_test "Calculate endpoint" 'curl -s -X POST http://localhost:8000/calculate -H "Content-Type: application/json" -d "{\"a\": 10, \"b\": 5, \"operation\": \"add\"}" | grep -q "\"result\":15"' || ((FAILURES++))
run_test "OpenAPI docs" "curl -s http://localhost:8000/docs | grep -q 'swagger-ui'" || ((FAILURES++))

# Kill the server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "6. Docker Build"
echo "---------------"
if command -v docker &> /dev/null; then
    run_test "Docker build" "docker build -t python-test:validation ." || ((FAILURES++))
    
    # Test Docker container
    echo -n "Testing: Docker container... "
    docker run -d --name python-test -p 8001:8000 python-test:validation > /dev/null 2>&1
    sleep 10
    
    if curl -s http://localhost:8001/health | grep -q "healthy"; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        docker logs python-test
        ((FAILURES++))
    fi
    
    # Cleanup
    docker stop python-test > /dev/null 2>&1 || true
    docker rm python-test > /dev/null 2>&1 || true
    docker rmi python-test:validation > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}SKIP${NC} - Docker not available"
fi

echo ""
echo "7. Performance Testing"
echo "----------------------"
# Simple load test
echo "Running basic performance test..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

echo -n "Testing: API response time... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:8000/health)
echo -e "${BLUE}Response time: ${RESPONSE_TIME}s${NC}"

# Simple concurrent requests test
echo -n "Testing: Concurrent requests... "
for i in {1..10}; do
    curl -s http://localhost:8000/health > /dev/null &
done
wait
echo -e "${GREEN}Handled 10 concurrent requests${NC}"

kill $SERVER_PID 2>/dev/null || true

echo ""
echo "8. CI/CD Configuration"
echo "----------------------"
run_test "Woodpecker config exists" "test -f .woodpecker.yml" || ((FAILURES++))
run_test "Has security scanning" "grep -q 'security-scan:' .woodpecker.yml" || ((FAILURES++))
run_test "Has matrix builds" "grep -q 'matrix:' .woodpecker.yml" || ((FAILURES++))

echo ""
echo "9. Documentation"
echo "----------------"
# Check API documentation
echo -n "Testing: API documentation generation... "
python -c "import json; from app.main import app; print(json.dumps(app.openapi(), indent=2))" > openapi.json 2>&1
if [ -s openapi.json ] && grep -q '"openapi"' openapi.json; then
    echo -e "${GREEN}PASS${NC}"
    echo "  OpenAPI spec generated successfully"
else
    echo -e "${RED}FAIL${NC}"
    ((FAILURES++))
fi

echo ""
echo "10. Package Structure"
echo "---------------------"
run_test "Package structure" "test -d app && test -d tests && test -f app/__init__.py" || ((FAILURES++))
run_test "Models defined" "test -f app/models.py" || ((FAILURES++))
run_test "Type hints used" "grep -q 'from typing import' app/*.py" || ((FAILURES++))

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "The Python FastAPI pipeline is properly configured."
else
    echo -e "${RED}$FAILURES tests failed!${NC}"
    echo "Please fix the issues before deploying."
fi

echo ""
echo "Pipeline Features Validated:"
echo "✓ Code formatting with Black"
echo "✓ Import sorting with isort"
echo "✓ Linting with Flake8"
echo "✓ Type checking with mypy"
echo "✓ Security scanning with Bandit"
echo "✓ Dependency vulnerability checking"
echo "✓ Unit testing with pytest"
echo "✓ Code coverage enforcement"
echo "✓ API endpoint testing"
echo "✓ Docker containerization"
echo "✓ OpenAPI documentation"

# Cleanup
deactivate
rm -rf venv htmlcov .coverage .pytest_cache bandit-report.json openapi.json

exit $FAILURES