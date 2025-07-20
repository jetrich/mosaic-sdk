#!/bin/bash

# MCP Integration Test Runner
# Tests the integration between MosAIc Stack components and MCP server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
MCP_PORT="${MCP_PORT:-3456}"
MCP_HOST="${MCP_HOST:-localhost}"
TEST_TIMEOUT="${TEST_TIMEOUT:-300000}" # 5 minutes
COVERAGE="${COVERAGE:-true}"

echo -e "${BLUE}MosAIc Stack MCP Integration Tests${NC}"
echo "=================================="
echo "MCP Server: $MCP_HOST:$MCP_PORT"
echo "Test Timeout: $TEST_TIMEOUT ms"
echo "Coverage: $COVERAGE"
echo ""

# Check dependencies
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        exit 1
    fi
    
    # Check if test dependencies are installed
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        cd "$PROJECT_ROOT"
        npm install
    fi
    
    # Check if TypeScript is compiled
    if [ ! -d "$PROJECT_ROOT/dist" ]; then
        echo -e "${YELLOW}Building project...${NC}"
        cd "$PROJECT_ROOT"
        npm run build:all
    fi
    
    echo -e "${GREEN}Dependencies OK${NC}"
}

# Start MCP server if not running
start_mcp_server() {
    echo -e "${YELLOW}Checking MCP server status...${NC}"
    
    if ! nc -z $MCP_HOST $MCP_PORT 2>/dev/null; then
        echo -e "${YELLOW}Starting MCP server on port $MCP_PORT...${NC}"
        
        # Start the isolated MCP server
        cd "$PROJECT_ROOT"
        npm run dev:start &
        MCP_PID=$!
        
        # Wait for server to start
        for i in {1..30}; do
            if nc -z $MCP_HOST $MCP_PORT 2>/dev/null; then
                echo -e "${GREEN}MCP server started (PID: $MCP_PID)${NC}"
                break
            fi
            sleep 1
        done
        
        if ! nc -z $MCP_HOST $MCP_PORT 2>/dev/null; then
            echo -e "${RED}Failed to start MCP server${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}MCP server already running${NC}"
    fi
}

# Run integration tests
run_tests() {
    echo -e "\n${BLUE}Running integration tests...${NC}"
    
    cd "$PROJECT_ROOT/tests"
    
    # Set environment variables
    export NODE_ENV=test
    export MCP_HOST=$MCP_HOST
    export MCP_PORT=$MCP_PORT
    export TEST_TIMEOUT=$TEST_TIMEOUT
    
    # Create test report directory
    mkdir -p reports
    
    # Run tests with Jest
    if [ "$COVERAGE" = "true" ]; then
        npx jest --config=jest.config.js \
            --testMatch="**/integration/**/*.test.ts" \
            --coverage \
            --coverageDirectory=reports/coverage \
            --verbose \
            --runInBand
    else
        npx jest --config=jest.config.js \
            --testMatch="**/integration/**/*.test.ts" \
            --verbose \
            --runInBand
    fi
    
    TEST_RESULT=$?
    
    return $TEST_RESULT
}

# Generate test report
generate_report() {
    echo -e "\n${BLUE}Generating test report...${NC}"
    
    if [ -f "$PROJECT_ROOT/tests/reports/test-report.html" ]; then
        echo -e "${GREEN}Test report generated: tests/reports/test-report.html${NC}"
    fi
    
    if [ "$COVERAGE" = "true" ] && [ -d "$PROJECT_ROOT/tests/reports/coverage" ]; then
        echo -e "${GREEN}Coverage report generated: tests/reports/coverage/index.html${NC}"
        
        # Display coverage summary
        if [ -f "$PROJECT_ROOT/tests/reports/coverage/lcov-report/index.html" ]; then
            echo -e "\n${BLUE}Coverage Summary:${NC}"
            # Extract coverage percentages from lcov.info if available
            if [ -f "$PROJECT_ROOT/tests/reports/coverage/lcov.info" ]; then
                node -e "
                const fs = require('fs');
                const lcov = fs.readFileSync('$PROJECT_ROOT/tests/reports/coverage/lcov.info', 'utf8');
                const lines = lcov.match(/LF:(\d+)/g) || [];
                const hits = lcov.match(/LH:(\d+)/g) || [];
                let totalLines = 0, totalHits = 0;
                lines.forEach(l => totalLines += parseInt(l.replace('LF:', '')));
                hits.forEach(h => totalHits += parseInt(h.replace('LH:', '')));
                const coverage = totalLines > 0 ? (totalHits / totalLines * 100).toFixed(2) : 0;
                console.log('Line Coverage: ' + coverage + '%');
                "
            fi
        fi
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    
    # Stop MCP server if we started it
    if [ ! -z "$MCP_PID" ]; then
        echo "Stopping MCP server (PID: $MCP_PID)..."
        kill $MCP_PID 2>/dev/null || true
        wait $MCP_PID 2>/dev/null || true
    fi
}

# Main execution
main() {
    # Set up trap for cleanup
    trap cleanup EXIT
    
    # Run test steps
    check_dependencies
    start_mcp_server
    
    # Run the tests
    if run_tests; then
        echo -e "\n${GREEN}✓ All integration tests passed!${NC}"
        generate_report
        exit 0
    else
        echo -e "\n${RED}✗ Integration tests failed!${NC}"
        generate_report
        exit 1
    fi
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            MCP_PORT="$2"
            shift 2
            ;;
        --host)
            MCP_HOST="$2"
            shift 2
            ;;
        --timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        --no-coverage)
            COVERAGE="false"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --port PORT         MCP server port (default: 3456)"
            echo "  --host HOST         MCP server host (default: localhost)"
            echo "  --timeout MS        Test timeout in milliseconds (default: 300000)"
            echo "  --no-coverage       Disable coverage reporting"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main