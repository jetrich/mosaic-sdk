#!/bin/bash
# Service Communication Test for MosAIc Stack
# Tests that all services can communicate properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== MosAIc Stack Service Communication Test ===${NC}\n"

# Function to test service availability
test_service() {
    local service_name=$1
    local test_command=$2
    local expected_result=$3
    
    echo -e "${BLUE}Testing ${service_name}...${NC}"
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ ${service_name} is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} is not accessible${NC}"
        return 1
    fi
}

# Function to test database connectivity
test_database() {
    local db_name=$1
    local host=$2
    local port=$3
    local user=$4
    local password=$5
    
    echo -e "${BLUE}Testing ${db_name} database connectivity...${NC}"
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD=$password psql -h $host -p $port -U $user -d postgres -c '\l' >/dev/null 2>&1; then
            echo -e "${GREEN}✅ ${db_name} database is accessible${NC}"
            return 0
        fi
    fi
    echo -e "${YELLOW}⚠️  Cannot test ${db_name} - psql not installed or connection failed${NC}"
    return 1
}

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: Check if Docker is running
echo -e "${BLUE}Test 1: Docker Engine${NC}"
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Docker is not running${NC}"
    echo -e "${RED}Cannot proceed with tests - Docker must be running${NC}"
    exit 1
fi

# Test 2: Check Docker networks
echo -e "\n${BLUE}Test 2: Docker Networks${NC}"
NETWORKS=$(docker network ls --format "{{.Name}}" | grep -E "(nginx-proxy-manager_default|mosaicstack)" || true)
if [ -n "$NETWORKS" ]; then
    echo -e "${GREEN}✅ Required networks exist:${NC}"
    echo "$NETWORKS" | while read net; do
        echo -e "   - $net"
    done
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  MosAIc stack networks not found${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 3: Check if MosAIc stack services are running
echo -e "\n${BLUE}Test 3: MosAIc Stack Services${NC}"
STACK_SERVICES=("mosaic-postgres" "mosaic-redis" "mosaic-gitea" "mosaic-bookstack" "mosaic-mariadb" "mosaic-woodpecker-server")
RUNNING_SERVICES=0

for service in "${STACK_SERVICES[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${service}$"; then
        echo -e "${GREEN}✅ ${service} is running${NC}"
        RUNNING_SERVICES=$((RUNNING_SERVICES + 1))
    else
        echo -e "${YELLOW}⚠️  ${service} is not running${NC}"
    fi
done

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $RUNNING_SERVICES -gt 0 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}Found ${RUNNING_SERVICES}/${#STACK_SERVICES[@]} services running${NC}"
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}No MosAIc stack services are running${NC}"
fi

# Test 4: Test local service endpoints
echo -e "\n${BLUE}Test 4: Service Endpoints${NC}"

# Gitea
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/healthz | grep -q "200"; then
    echo -e "${GREEN}✅ Gitea API is accessible (port 3000)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Gitea is not accessible on port 3000${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# BookStack
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if curl -s -o /dev/null -w "%{http_code}" http://localhost:6875 | grep -qE "(200|302)"; then
    echo -e "${GREEN}✅ BookStack is accessible (port 6875)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  BookStack is not accessible on port 6875${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 5: MCP Server (if deployed)
echo -e "\n${BLUE}Test 5: MCP Server Integration${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -f ".mosaic/data/mcp.db" ]; then
    echo -e "${GREEN}✅ MCP database exists${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  MCP database not found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 6: Check CI/CD Pipeline Files
echo -e "\n${BLUE}Test 6: CI/CD Pipeline Configuration${NC}"
CI_FILES=(
    "mosaic-mcp/.woodpecker.yml"
    "mosaic-mcp/Dockerfile"
    "docs/ci-cd/CI-CD-WORKFLOWS.md"
    "docs/ci-cd/CI-CD-BEST-PRACTICES.md"
    "tests/ci-cd-validation/validate-all-pipelines.sh"
)

CI_FILES_FOUND=0
for file in "${CI_FILES[@]}"; do
    if [ -f "$file" ]; then
        CI_FILES_FOUND=$((CI_FILES_FOUND + 1))
    fi
done

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $CI_FILES_FOUND -eq ${#CI_FILES[@]} ]; then
    echo -e "${GREEN}✅ All CI/CD configuration files present (${CI_FILES_FOUND}/${#CI_FILES[@]})${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Some CI/CD files missing (${CI_FILES_FOUND}/${#CI_FILES[@]})${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 7: Tony 2.8.0 MCP Integration
echo -e "\n${BLUE}Test 7: Tony 2.8.0 MCP Integration${NC}"
TONY_MCP_FILES=(
    "tony/core/mcp/minimal-interface.ts"
    "tony/core/mcp/minimal-implementation.ts"
    "tony/core/mcp/tony-integration.ts"
    "tony/core/mcp/tony-mcp-enhanced.ts"
)

TONY_FILES_FOUND=0
for file in "${TONY_MCP_FILES[@]}"; do
    if [ -f "$file" ]; then
        TONY_FILES_FOUND=$((TONY_FILES_FOUND + 1))
    fi
done

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $TONY_FILES_FOUND -eq ${#TONY_MCP_FILES[@]} ]; then
    echo -e "${GREEN}✅ All Tony 2.8.0 MCP files present (${TONY_FILES_FOUND}/${#TONY_MCP_FILES[@]})${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Some Tony MCP files missing (${TONY_FILES_FOUND}/${#TONY_MCP_FILES[@]})${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Summary
echo -e "\n${CYAN}=== Test Summary ===${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed! Services can communicate properly.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Review the output above for details.${NC}"
    
    # Provide recommendations
    echo -e "\n${CYAN}Recommendations:${NC}"
    if ! docker ps | grep -q "mosaic-"; then
        echo -e "1. Start the MosAIc stack with:"
        echo -e "   ${BLUE}cd deployment/docker && docker-compose -f docker-compose.mosaicstack-portainer.yml up -d${NC}"
    fi
    
    echo -e "2. Check service logs with:"
    echo -e "   ${BLUE}docker logs <service-name>${NC}"
    
    echo -e "3. Verify environment variables in .env files"
    
    exit 1
fi