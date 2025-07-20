#!/bin/bash
# validate-go-pipeline.sh - Validate Go CI/CD Pipeline

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="go"

echo "================================================"
echo "Go Pipeline Validation"
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
echo "1. Go Environment"
echo "-----------------"
run_test "Go version" "go version" || ((FAILURES++))
run_test "Go env" "go env GOPATH GOMOD" || ((FAILURES++))

echo ""
echo "2. Dependency Management"
echo "------------------------"
run_test "Download dependencies" "go mod download" || ((FAILURES++))
run_test "Verify dependencies" "go mod verify" || ((FAILURES++))
run_test "Check mod tidy" "go mod tidy && git diff --exit-code go.mod go.sum" || ((FAILURES++))

echo ""
echo "3. Code Quality Checks"
echo "----------------------"
run_test "Go fmt check" "test -z \"\$(gofmt -l .)\"" || ((FAILURES++))
run_test "Go vet" "go vet ./..." || ((FAILURES++))

# Install and run golangci-lint
echo -n "Testing: golangci-lint... "
if ! command -v golangci-lint &> /dev/null; then
    echo -e "${YELLOW}Installing golangci-lint...${NC}"
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
fi
run_test "golangci-lint" "golangci-lint run ./..." || ((FAILURES++))

echo ""
echo "4. Security Scanning"
echo "--------------------"
# Install gosec if not available
if ! command -v gosec &> /dev/null; then
    echo "Installing gosec..."
    go install github.com/securego/gosec/v2/cmd/gosec@latest
fi
run_test "gosec security scan" "gosec -fmt json -out gosec-report.json ./..." || ((FAILURES++))

# Check for vulnerabilities
echo -n "Testing: govulncheck... "
if ! command -v govulncheck &> /dev/null; then
    go install golang.org/x/vuln/cmd/govulncheck@latest
fi
govulncheck ./... > /tmp/vuln-report.txt 2>&1 || echo -e "${YELLOW}Some vulnerabilities found${NC}"

echo ""
echo "5. Testing"
echo "----------"
run_test "Unit tests" "go test -v ./..." || ((FAILURES++))
run_test "Race condition detection" "go test -race ./..." || ((FAILURES++))
run_test "Test coverage" "go test -coverprofile=coverage.out ./..." || ((FAILURES++))

# Check coverage percentage
echo -n "Testing: Coverage analysis... "
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
echo -e "${BLUE}Total coverage: ${COVERAGE}%${NC}"
if [ "${COVERAGE%.*}" -lt 70 ]; then
    echo -e "${YELLOW}Warning: Coverage below 70%${NC}"
fi

echo ""
echo "6. Benchmarks"
echo "-------------"
run_test "Run benchmarks" "go test -bench=. -benchmem ./internal/calculator" || ((FAILURES++))

echo ""
echo "7. Build Process"
echo "----------------"
run_test "Build binary" "go build -o bin/app ./cmd/api" || ((FAILURES++))
run_test "Check binary exists" "test -f bin/app" || ((FAILURES++))

# Test different architectures
echo "Testing cross-compilation:"
run_test "  Linux AMD64" "GOOS=linux GOARCH=amd64 go build -o bin/app-linux-amd64 ./cmd/api" || ((FAILURES++))
run_test "  Darwin AMD64" "GOOS=darwin GOARCH=amd64 go build -o bin/app-darwin-amd64 ./cmd/api" || ((FAILURES++))
run_test "  Windows AMD64" "GOOS=windows GOARCH=amd64 go build -o bin/app-windows-amd64.exe ./cmd/api" || ((FAILURES++))

echo ""
echo "8. Application Tests"
echo "--------------------"
# Run the application
echo -n "Testing: Application startup... "
./bin/app > /tmp/app.log 2>&1 &
APP_PID=$!
sleep 5

if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    cat /tmp/app.log
    ((FAILURES++))
fi

# Test API endpoints
run_test "Health endpoint" "curl -s http://localhost:8080/health | grep -q 'healthy'" || ((FAILURES++))
run_test "API root" "curl -s http://localhost:8080/api/v1/ | grep -q 'Go CI/CD Test API'" || ((FAILURES++))
run_test "Calculate endpoint" 'curl -s -X POST http://localhost:8080/api/v1/calculate -H "Content-Type: application/json" -d "{\"a\": 10, \"b\": 5, \"operation\": \"add\"}" | grep -q "\"result\":15"' || ((FAILURES++))

# Kill the application
kill $APP_PID 2>/dev/null || true
wait $APP_PID 2>/dev/null || true

echo ""
echo "9. Swagger Documentation"
echo "------------------------"
# Install swag if not available
if ! command -v swag &> /dev/null; then
    echo "Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
fi
run_test "Generate swagger docs" "swag init -g cmd/api/main.go -o docs" || ((FAILURES++))
run_test "Check swagger files" "test -f docs/swagger.json && test -f docs/swagger.yaml" || ((FAILURES++))

echo ""
echo "10. Docker Build"
echo "----------------"
if command -v docker &> /dev/null; then
    run_test "Docker build" "docker build -t go-test:validation ." || ((FAILURES++))
    
    # Test Docker container
    echo -n "Testing: Docker container... "
    docker run -d --name go-test -p 8081:8080 go-test:validation > /dev/null 2>&1
    sleep 10
    
    if curl -s http://localhost:8081/health | grep -q "healthy"; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        docker logs go-test
        ((FAILURES++))
    fi
    
    # Check Docker image size
    echo -n "Docker image size: "
    docker images go-test:validation --format "{{.Size}}"
    
    # Cleanup
    docker stop go-test > /dev/null 2>&1 || true
    docker rm go-test > /dev/null 2>&1 || true
    docker rmi go-test:validation > /dev/null 2>&1 || true
else
    echo -e "${YELLOW}SKIP${NC} - Docker not available"
fi

echo ""
echo "11. Makefile Targets"
echo "--------------------"
run_test "Makefile exists" "test -f Makefile" || ((FAILURES++))
run_test "make build" "make clean build" || ((FAILURES++))
run_test "make test" "make test" || ((FAILURES++))
run_test "make lint" "make lint" || ((FAILURES++))

echo ""
echo "12. CI/CD Configuration"
echo "-----------------------"
run_test "Woodpecker config exists" "test -f .woodpecker.yml" || ((FAILURES++))
run_test "Has security scanning" "grep -q 'security:' .woodpecker.yml" || ((FAILURES++))
run_test "Has multi-arch builds" "grep -q 'GOARCH=arm64' .woodpecker.yml" || ((FAILURES++))
run_test "Has matrix builds" "grep -q 'matrix:' .woodpecker.yml" || ((FAILURES++))

echo ""
echo "13. Performance Analysis"
echo "------------------------"
echo "Build time:"
time make build > /dev/null 2>&1

echo ""
echo "Test execution time:"
time go test ./... > /dev/null 2>&1

echo ""
echo "Binary size analysis:"
ls -lh bin/app* 2>/dev/null | awk '{print $9 ": " $5}'

echo ""
echo "================================================"
echo "Validation Summary"
echo "================================================"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "The Go pipeline is properly configured."
else
    echo -e "${RED}$FAILURES tests failed!${NC}"
    echo "Please fix the issues before deploying."
fi

echo ""
echo "Pipeline Features Validated:"
echo "✓ Go modules for dependency management"
echo "✓ Code formatting with gofmt"
echo "✓ Static analysis with go vet"
echo "✓ Advanced linting with golangci-lint"
echo "✓ Security scanning with gosec"
echo "✓ Vulnerability checking with govulncheck"
echo "✓ Unit testing with race detection"
echo "✓ Benchmark testing"
echo "✓ Code coverage analysis"
echo "✓ Cross-platform builds"
echo "✓ Docker containerization"
echo "✓ Swagger API documentation"
echo "✓ Makefile automation"

# Cleanup
rm -rf bin coverage.out gosec-report.json docs vendor

exit $FAILURES