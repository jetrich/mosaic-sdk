#!/bin/bash
# MosAIc Stack Deployment Validation Script
# Ensures all prerequisites are met before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
    echo -e "ℹ️  $1"
}

# Validation checks
ERRORS=0
WARNINGS=0

echo "=========================================="
echo "MosAIc Stack Deployment Validation"
echo "=========================================="
echo

# Check if running from correct directory
if [ ! -f "docker-compose.mosaicstack-fixed.yml" ]; then
    log_error "Not in deployment directory. Run from mosaic-sdk/deployment/"
    exit 1
fi

# Check for .env file
if [ -f ".env" ]; then
    log_success "Environment file exists"
    # Source it for validation
    set -a
    source .env
    set +a
else
    log_error "Missing .env file. Copy .env.example to .env and configure"
    ERRORS=$((ERRORS + 1))
fi

# Check required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "WOODPECKER_AGENT_SECRET"
    "PLANE_SECRET_KEY"
)

echo
echo "Checking required environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Missing required variable: $var"
        ERRORS=$((ERRORS + 1))
    else
        # Check for default/weak passwords
        if [[ "${!var}" == *"password"* ]] || [[ "${!var}" == "changeme" ]]; then
            log_warning "$var appears to use a weak password"
            WARNINGS=$((WARNINGS + 1))
        else
            log_success "$var is set"
        fi
    fi
done

# Check Docker
echo
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    log_success "Docker is installed: $(docker --version)"
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_error "Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    log_success "Docker Compose is installed: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    log_success "Docker Compose plugin is installed"
else
    log_error "Docker Compose is not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check networks
echo
echo "Checking Docker networks..."
if docker network ls | grep -q "nginx-proxy-manager_default"; then
    log_success "External network 'nginx-proxy-manager_default' exists"
else
    log_warning "External network 'nginx-proxy-manager_default' does not exist"
    log_info "Run: docker network create nginx-proxy-manager_default"
    WARNINGS=$((WARNINGS + 1))
fi

# Check required configuration files
echo
echo "Checking configuration files..."
CONFIG_FILES=(
    "config/postgres/init-databases.sh"
    "config/postgres/postgresql.conf"
    "config/redis/redis.conf"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Configuration file exists: $file"
    else
        log_error "Missing configuration file: $file"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check ports availability (only if not using external network properly)
echo
echo "Checking port availability..."
PORTS=(3000 2222 8000 8080 3001)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $port is already in use"
        WARNINGS=$((WARNINGS + 1))
    else
        log_success "Port $port is available"
    fi
done

# Check disk space
echo
echo "Checking disk space..."
REQUIRED_GB=10
AVAILABLE_GB=$(df -BG /opt 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//' || echo "0")
if [ "$AVAILABLE_GB" -ge "$REQUIRED_GB" ]; then
    log_success "Sufficient disk space available: ${AVAILABLE_GB}GB"
else
    log_warning "Low disk space: ${AVAILABLE_GB}GB available, ${REQUIRED_GB}GB recommended"
    WARNINGS=$((WARNINGS + 1))
fi

# Validate Docker Compose syntax
echo
echo "Validating Docker Compose configuration..."
if docker-compose -f docker-compose.mosaicstack-fixed.yml config > /dev/null 2>&1; then
    log_success "Docker Compose configuration is valid"
else
    log_error "Docker Compose configuration has errors"
    docker-compose -f docker-compose.mosaicstack-fixed.yml config
    ERRORS=$((ERRORS + 1))
fi

# Check data directories
echo
echo "Checking data directories..."
DATA_DIRS=(
    "/opt/mosaic/postgres/data"
    "/opt/mosaic/redis/data"
    "/opt/mosaic/gitea/data"
    "/opt/mosaic/gitea/config"
    "/opt/mosaic/woodpecker/data"
    "/opt/mosaic/bookstack/data"
    "/opt/mosaic/plane/media"
    "/opt/mosaic/plane/static"
)

for dir in "${DATA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Data directory exists: $dir"
    else
        log_info "Data directory will be created: $dir"
    fi
done

# Summary
echo
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        log_success "All validation checks passed! Ready to deploy."
    else
        log_warning "Validation passed with warnings. Review before deploying."
    fi
    echo
    echo "To deploy the stack, run:"
    echo "  docker-compose -f docker-compose.mosaicstack-fixed.yml up -d"
    echo
    echo "To view logs:"
    echo "  docker-compose -f docker-compose.mosaicstack-fixed.yml logs -f"
    exit 0
else
    log_error "Validation failed with $ERRORS errors. Fix issues before deploying."
    exit 1
fi