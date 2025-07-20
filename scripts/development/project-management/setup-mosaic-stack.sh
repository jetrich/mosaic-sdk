#!/bin/bash
# MosAIc Stack Interactive Setup Script
# Epic E.058 - Feature F.058.02: Interactive setup for easy deployment
# This script guides users through the complete setup process

set -e

# Script configuration
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
DOCKER_COMPOSE_FILE="docker-compose.mosaicstack-portainer.yml"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
BOLD='\033[1m'
RESET='\033[0m'

# Default values
DEFAULT_DATA_PATH="/opt/mosaic"
DEFAULT_DOMAIN="localhost"
USE_EXTERNAL_NPM="false"
VERBOSE_MODE="false"

# Track setup progress
SETUP_STEPS_COMPLETED=0
SETUP_STEPS_TOTAL=10

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${RESET}"
}

# Function to print section headers
print_header() {
    local title=$1
    echo
    print_color "$CYAN" "=============================================="
    print_color "$CYAN" "$title"
    print_color "$CYAN" "=============================================="
    echo
}

# Function to print progress
print_progress() {
    local step=$1
    local description=$2
    SETUP_STEPS_COMPLETED=$((SETUP_STEPS_COMPLETED + 1))
    print_color "$BLUE" "[Step $SETUP_STEPS_COMPLETED/$SETUP_STEPS_TOTAL] $description"
}

# Function to print success message
print_success() {
    print_color "$GREEN" "✓ $1"
}

# Function to print error message
print_error() {
    print_color "$RED" "✗ $1"
}

# Function to print warning message
print_warning() {
    print_color "$YELLOW" "⚠ $1"
}

# Function to print info message
print_info() {
    print_color "$WHITE" "ℹ $1"
}

# Function to ask yes/no questions
ask_yes_no() {
    local prompt=$1
    local default=${2:-"n"}
    local response
    
    if [[ $default == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    read -p "$prompt" response
    response=${response:-$default}
    
    if [[ $response =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to prompt for input with default
prompt_input() {
    local prompt=$1
    local default=$2
    local response
    
    if [[ -n $default ]]; then
        read -p "$prompt [$default]: " response
        echo "${response:-$default}"
    else
        read -p "$prompt: " response
        echo "$response"
    fi
}

# Function to validate domain name
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$ ]] || [[ $domain == "localhost" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to generate secure password
generate_password() {
    local length=${1:-24}
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-$length
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker version
check_docker_version() {
    local required_version=$1
    local current_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
    
    if [[ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" == "$required_version" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check port availability
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to wait for service health
wait_for_service() {
    local service_name=$1
    local max_attempts=${2:-30}
    local attempt=0
    
    print_info "Waiting for $service_name to be healthy..."
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker ps --filter "name=$service_name" --filter "health=healthy" --format "{{.Names}}" | grep -q "$service_name"; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo
    print_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to create directory with proper permissions
create_directory() {
    local dir=$1
    local owner=${2:-"$USER"}
    
    if [[ ! -d "$dir" ]]; then
        print_info "Creating directory: $dir"
        sudo mkdir -p "$dir"
        sudo chown -R "$owner:$owner" "$dir"
        print_success "Directory created: $dir"
    else
        print_info "Directory already exists: $dir"
    fi
}

# Main setup flow
main() {
    print_header "MosAIc Stack Interactive Setup v$SCRIPT_VERSION"
    
    print_info "This script will guide you through setting up the MosAIc Stack"
    print_info "including Gitea, BookStack, Woodpecker CI/CD, and supporting services."
    echo
    
    if ! ask_yes_no "Do you want to continue with the setup?" "y"; then
        print_info "Setup cancelled by user"
        exit 0
    fi
    
    # Step 1: Check prerequisites
    print_progress 1 "Checking prerequisites"
    check_prerequisites
    
    # Step 2: Configure installation paths
    print_progress 2 "Configuring installation paths"
    configure_paths
    
    # Step 3: Configure domain and SSL
    print_progress 3 "Configuring domain and SSL settings"
    configure_domain
    
    # Step 4: Configure external services
    print_progress 4 "Configuring external services"
    configure_external_services
    
    # Step 5: Generate passwords
    print_progress 5 "Generating secure passwords"
    generate_passwords
    
    # Step 6: Create environment file
    print_progress 6 "Creating environment configuration"
    create_env_file
    
    # Step 7: Create directory structure
    print_progress 7 "Creating directory structure"
    create_directories
    
    # Step 8: Configure Docker networks
    print_progress 8 "Configuring Docker networks"
    configure_networks
    
    # Step 9: Start services
    print_progress 9 "Starting MosAIc Stack services"
    start_services
    
    # Step 10: Post-setup configuration
    print_progress 10 "Performing post-setup configuration"
    post_setup_configuration
    
    # Final summary
    print_summary
}

# Check prerequisites
check_prerequisites() {
    local errors=0
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed"
        errors=$((errors + 1))
    else
        print_success "Docker is installed"
        
        # Check Docker version
        if ! check_docker_version "24.0.0"; then
            print_warning "Docker version is below 24.0.0. Some features may not work."
        fi
    fi
    
    # Check Docker Compose
    if ! command_exists docker || ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose v2 is not installed"
        errors=$((errors + 1))
    else
        print_success "Docker Compose is installed"
    fi
    
    # Check required tools
    local required_tools=("openssl" "curl" "jq" "git")
    for tool in "${required_tools[@]}"; do
        if ! command_exists "$tool"; then
            print_error "$tool is not installed"
            errors=$((errors + 1))
        else
            print_success "$tool is installed"
        fi
    done
    
    # Check required ports
    local required_ports=(3000 2222 6875 8080 5432 6379 3306)
    print_info "Checking port availability..."
    for port in "${required_ports[@]}"; do
        if ! check_port $port; then
            print_warning "Port $port is already in use"
        fi
    done
    
    # Check disk space
    local available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_space -lt 50 ]]; then
        print_warning "Less than 50GB of disk space available"
    else
        print_success "${available_space}GB of disk space available"
    fi
    
    if [[ $errors -gt 0 ]]; then
        print_error "Prerequisites check failed. Please install missing components."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Configure installation paths
configure_paths() {
    print_info "Where should MosAIc Stack data be stored?"
    DATA_PATH=$(prompt_input "Data directory path" "$DEFAULT_DATA_PATH")
    
    # Validate path
    if [[ ! "$DATA_PATH" =~ ^/ ]]; then
        print_error "Path must be absolute (start with /)"
        exit 1
    fi
    
    print_info "MosAIc Stack will be installed at: $DATA_PATH"
}

# Configure domain and SSL
configure_domain() {
    print_info "Configure domain settings for your MosAIc Stack"
    
    DOMAIN=$(prompt_input "Primary domain (e.g., mosaicstack.dev)" "$DEFAULT_DOMAIN")
    
    if ! validate_domain "$DOMAIN"; then
        print_error "Invalid domain name"
        exit 1
    fi
    
    if [[ "$DOMAIN" != "localhost" ]]; then
        # Configure subdomains
        print_info "Configuring subdomains..."
        GIT_DOMAIN=$(prompt_input "Gitea domain" "git.$DOMAIN")
        DOCS_DOMAIN=$(prompt_input "BookStack domain" "docs.$DOMAIN")
        CI_DOMAIN=$(prompt_input "Woodpecker domain" "ci.$DOMAIN")
        MONITOR_DOMAIN=$(prompt_input "Monitoring domain" "monitor.$DOMAIN")
        
        # Ask about SSL
        if ask_yes_no "Do you want to use SSL/TLS?" "y"; then
            USE_SSL="true"
            if ask_yes_no "Use Let's Encrypt for automatic SSL?" "y"; then
                USE_LETSENCRYPT="true"
                LETSENCRYPT_EMAIL=$(prompt_input "Email for Let's Encrypt notifications" "")
            else
                USE_LETSENCRYPT="false"
                print_info "You'll need to provide your own SSL certificates"
            fi
        else
            USE_SSL="false"
        fi
    else
        # Localhost setup
        GIT_DOMAIN="localhost"
        DOCS_DOMAIN="localhost"
        CI_DOMAIN="localhost"
        MONITOR_DOMAIN="localhost"
        USE_SSL="false"
    fi
}

# Configure external services
configure_external_services() {
    # NPM (nginx-proxy-manager)
    if ask_yes_no "Do you have an external nginx-proxy-manager instance?" "n"; then
        USE_EXTERNAL_NPM="true"
        NPM_NETWORK=$(prompt_input "NPM Docker network name" "nginx-proxy-manager_default")
    else
        USE_EXTERNAL_NPM="false"
        print_info "Traefik will be configured for reverse proxy"
    fi
    
    # External services
    if ask_yes_no "Do you want to use any external services?" "n"; then
        if ask_yes_no "Use external PostgreSQL?" "n"; then
            EXTERNAL_POSTGRES="true"
            POSTGRES_HOST=$(prompt_input "PostgreSQL host" "")
            POSTGRES_PORT=$(prompt_input "PostgreSQL port" "5432")
        else
            EXTERNAL_POSTGRES="false"
        fi
        
        if ask_yes_no "Use external Redis?" "n"; then
            EXTERNAL_REDIS="true"
            REDIS_HOST=$(prompt_input "Redis host" "")
            REDIS_PORT=$(prompt_input "Redis port" "6379")
        else
            EXTERNAL_REDIS="false"
        fi
    else
        EXTERNAL_POSTGRES="false"
        EXTERNAL_REDIS="false"
    fi
}

# Generate secure passwords
generate_passwords() {
    print_info "Generating secure passwords..."
    
    # Generate passwords
    POSTGRES_PASSWORD=$(generate_password 32)
    REDIS_PASSWORD=$(generate_password 32)
    MARIADB_ROOT_PASSWORD=$(generate_password 32)
    MARIADB_PASSWORD=$(generate_password 32)
    GITEA_ADMIN_PASSWORD=$(generate_password 24)
    BOOKSTACK_DB_PASS=$(generate_password 24)
    WOODPECKER_AGENT_SECRET=$(generate_password 32)
    
    print_success "Secure passwords generated"
    
    # Option to view passwords
    if ask_yes_no "Do you want to view the generated passwords?" "n"; then
        echo
        print_color "$YELLOW" "Generated Passwords (save these securely!):"
        echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
        echo "REDIS_PASSWORD=$REDIS_PASSWORD"
        echo "MARIADB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD"
        echo "MARIADB_PASSWORD=$MARIADB_PASSWORD"
        echo "GITEA_ADMIN_PASSWORD=$GITEA_ADMIN_PASSWORD"
        echo "BOOKSTACK_DB_PASS=$BOOKSTACK_DB_PASS"
        echo "WOODPECKER_AGENT_SECRET=$WOODPECKER_AGENT_SECRET"
        echo
        read -p "Press Enter when you've saved these passwords..."
    fi
}

# Create environment file
create_env_file() {
    local env_file="$DEPLOYMENT_DIR/.env"
    
    print_info "Creating environment configuration..."
    
    # Backup existing .env if it exists
    if [[ -f "$env_file" ]]; then
        local backup_file="${env_file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$env_file" "$backup_file"
        print_info "Existing .env backed up to: $backup_file"
    fi
    
    # Create new .env file
    cat > "$env_file" << EOF
# MosAIc Stack Environment Configuration
# Generated by setup-mosaic-stack.sh on $(date)

# Data paths
DATA_PATH=$DATA_PATH

# Domain configuration
DOMAIN=$DOMAIN
GITEA_DOMAIN=$GIT_DOMAIN
DOCS_DOMAIN=$DOCS_DOMAIN
CI_DOMAIN=$CI_DOMAIN
MONITOR_DOMAIN=$MONITOR_DOMAIN

# SSL configuration
USE_SSL=$USE_SSL
USE_LETSENCRYPT=$USE_LETSENCRYPT
LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL

# Database configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_MULTIPLE_DATABASES=gitea_prod,woodpecker_prod,monitoring_prod

# Redis configuration
REDIS_PASSWORD=$REDIS_PASSWORD

# MariaDB configuration (for BookStack)
MARIADB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD
MARIADB_DATABASE=bookstack
MARIADB_USER=bookstack
MARIADB_PASSWORD=$MARIADB_PASSWORD

# Gitea configuration
GITEA_ADMIN_USER=admin
GITEA_ADMIN_PASSWORD=$GITEA_ADMIN_PASSWORD
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true

# BookStack configuration
BOOKSTACK_DB_HOST=mariadb
BOOKSTACK_DB_DATABASE=bookstack
BOOKSTACK_DB_USERNAME=bookstack
BOOKSTACK_DB_PASS=$BOOKSTACK_DB_PASS
BOOKSTACK_URL=https://$DOCS_DOMAIN

# Woodpecker configuration
WOODPECKER_HOST=https://$CI_DOMAIN
WOODPECKER_ADMIN=admin
WOODPECKER_AGENT_SECRET=$WOODPECKER_AGENT_SECRET

# External services
USE_EXTERNAL_NPM=$USE_EXTERNAL_NPM
NPM_NETWORK=$NPM_NETWORK
EXTERNAL_POSTGRES=$EXTERNAL_POSTGRES
EXTERNAL_REDIS=$EXTERNAL_REDIS

# General settings
TZ=UTC
LOG_LEVEL=info
EOF
    
    # Set secure permissions
    chmod 600 "$env_file"
    
    print_success "Environment configuration created: $env_file"
}

# Create directory structure
create_directories() {
    print_info "Creating directory structure..."
    
    # Base directories
    create_directory "$DATA_PATH"
    
    # Service directories
    local services=(
        "postgres/data"
        "postgres/backups"
        "redis/data"
        "redis/conf"
        "mariadb/data"
        "gitea/data"
        "gitea/config"
        "bookstack/data"
        "bookstack/uploads"
        "woodpecker/data"
        "monitoring/prometheus"
        "monitoring/grafana"
        "backups"
        "logs"
    )
    
    for service in "${services[@]}"; do
        create_directory "$DATA_PATH/$service"
    done
    
    # Create configuration files
    create_config_files
    
    print_success "Directory structure created"
}

# Create configuration files
create_config_files() {
    # Redis configuration
    cat > "$DATA_PATH/redis/conf/redis.conf" << 'EOF'
# Redis configuration for MosAIc Stack
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
always-show-logo no
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
replica-priority 100
maxmemory 256mb
maxmemory-policy allkeys-lru
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
EOF
    
    # PostgreSQL init script for multiple databases
    cat > "$DATA_PATH/postgres/init-databases.sh" << 'EOF'
#!/bin/bash
set -e

# Parse comma-separated database names
IFS=',' read -ra DATABASES <<< "$POSTGRES_MULTIPLE_DATABASES"

# Create each database
for db in "${DATABASES[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE "$db";
        GRANT ALL PRIVILEGES ON DATABASE "$db" TO "$POSTGRES_USER";
EOSQL
done
EOF
    chmod +x "$DATA_PATH/postgres/init-databases.sh"
}

# Configure Docker networks
configure_networks() {
    print_info "Configuring Docker networks..."
    
    # Create internal network
    if ! docker network ls | grep -q "mosaicstack-internal"; then
        docker network create mosaicstack-internal
        print_success "Created mosaicstack-internal network"
    else
        print_info "mosaicstack-internal network already exists"
    fi
    
    # Check external network
    if [[ "$USE_EXTERNAL_NPM" == "true" ]]; then
        if ! docker network ls | grep -q "$NPM_NETWORK"; then
            print_warning "NPM network '$NPM_NETWORK' not found"
            print_info "Make sure nginx-proxy-manager is running"
        else
            print_success "NPM network '$NPM_NETWORK' found"
        fi
    fi
}

# Start services
start_services() {
    print_info "Starting MosAIc Stack services..."
    
    cd "$DEPLOYMENT_DIR/docker"
    
    # Start databases first
    print_info "Starting database services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis mariadb
    
    # Wait for databases
    wait_for_service "mosaic-postgres" 60
    wait_for_service "mosaic-redis" 30
    wait_for_service "mosaic-mariadb" 60
    
    # Start application services
    print_info "Starting application services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d gitea bookstack
    
    # Wait for applications
    wait_for_service "mosaic-gitea" 60
    wait_for_service "mosaic-bookstack" 60
    
    # Start CI/CD
    print_info "Starting CI/CD services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d woodpecker-server
    
    wait_for_service "mosaic-woodpecker-server" 60
    
    print_success "All services started successfully"
}

# Post-setup configuration
post_setup_configuration() {
    print_header "Post-Setup Configuration"
    
    # Gitea configuration
    print_info "Configuring Gitea..."
    configure_gitea
    
    # BookStack configuration
    print_info "Configuring BookStack..."
    configure_bookstack
    
    # Woodpecker configuration
    print_info "Configuring Woodpecker..."
    configure_woodpecker
    
    # Git remote configuration
    if ask_yes_no "Configure Git remotes for existing repositories?" "y"; then
        configure_git_remotes
    fi
}

# Configure Gitea
configure_gitea() {
    local gitea_url="http://localhost:3000"
    if [[ "$USE_SSL" == "true" ]]; then
        gitea_url="https://$GIT_DOMAIN"
    fi
    
    print_info "Gitea is accessible at: $gitea_url"
    print_info "Default admin credentials:"
    print_info "  Username: admin"
    print_info "  Password: $GITEA_ADMIN_PASSWORD"
    echo
    
    if ask_yes_no "Open Gitea in browser?" "y"; then
        if command_exists xdg-open; then
            xdg-open "$gitea_url" 2>/dev/null || true
        elif command_exists open; then
            open "$gitea_url" 2>/dev/null || true
        fi
    fi
    
    print_info "Please complete the following in Gitea:"
    print_info "1. Login with admin credentials"
    print_info "2. Create an organization (e.g., 'mosaic')"
    print_info "3. Generate a personal access token for API access"
    echo
    
    read -p "Press Enter when you've completed Gitea setup..."
}

# Configure BookStack
configure_bookstack() {
    local bookstack_url="http://localhost:6875"
    if [[ "$USE_SSL" == "true" ]]; then
        bookstack_url="https://$DOCS_DOMAIN"
    fi
    
    print_info "BookStack is accessible at: $bookstack_url"
    print_info "Default admin credentials:"
    print_info "  Email: admin@admin.com"
    print_info "  Password: password"
    print_warning "Change the default password immediately!"
    echo
    
    if ask_yes_no "Open BookStack in browser?" "y"; then
        if command_exists xdg-open; then
            xdg-open "$bookstack_url" 2>/dev/null || true
        elif command_exists open; then
            open "$bookstack_url" 2>/dev/null || true
        fi
    fi
}

# Configure Woodpecker
configure_woodpecker() {
    local woodpecker_url="http://localhost:8080"
    if [[ "$USE_SSL" == "true" ]]; then
        woodpecker_url="https://$CI_DOMAIN"
    fi
    
    print_info "Woodpecker is accessible at: $woodpecker_url"
    print_info "Authenticate with your Gitea account"
    echo
    
    print_info "To start a Woodpecker agent:"
    print_color "$CYAN" "docker run -d \\
  --name woodpecker-agent \\
  --restart unless-stopped \\
  -e WOODPECKER_SERVER=mosaic-woodpecker-server:9000 \\
  -e WOODPECKER_AGENT_SECRET=$WOODPECKER_AGENT_SECRET \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  --network mosaicstack-internal \\
  woodpeckerci/woodpecker-agent:latest"
    echo
}

# Configure Git remotes
configure_git_remotes() {
    print_info "Configuring Git remotes for MosAIc repositories..."
    
    local repos=("mosaic-sdk" "mosaic-mcp" "mosaic-dev" "tony")
    local org=$(prompt_input "Gitea organization name" "mosaic")
    
    for repo in "${repos[@]}"; do
        if [[ -d "$PROJECT_ROOT/../$repo" ]]; then
            print_info "Configuring remote for $repo..."
            cd "$PROJECT_ROOT/../$repo"
            
            # Add Gitea remote
            if git remote get-url gitea >/dev/null 2>&1; then
                git remote set-url gitea "ssh://git@$GIT_DOMAIN:2222/$org/$repo.git"
            else
                git remote add gitea "ssh://git@$GIT_DOMAIN:2222/$org/$repo.git"
            fi
            
            print_success "Remote configured for $repo"
        else
            print_warning "Repository $repo not found at ../$repo"
        fi
    done
}

# Print summary
print_summary() {
    print_header "Setup Complete!"
    
    print_success "MosAIc Stack has been successfully installed!"
    echo
    
    print_color "$BOLD" "Service URLs:"
    if [[ "$USE_SSL" == "true" ]]; then
        print_info "Gitea:       https://$GIT_DOMAIN"
        print_info "BookStack:   https://$DOCS_DOMAIN"
        print_info "Woodpecker:  https://$CI_DOMAIN"
        print_info "Monitoring:  https://$MONITOR_DOMAIN"
    else
        print_info "Gitea:       http://localhost:3000"
        print_info "BookStack:   http://localhost:6875"
        print_info "Woodpecker:  http://localhost:8080"
        print_info "Monitoring:  http://localhost:3001"
    fi
    echo
    
    print_color "$BOLD" "SSH Access:"
    print_info "Git SSH:     ssh://git@$GIT_DOMAIN:2222/org/repo.git"
    echo
    
    print_color "$BOLD" "Important Files:"
    print_info "Environment: $DEPLOYMENT_DIR/.env"
    print_info "Compose:     $DEPLOYMENT_DIR/docker/$DOCKER_COMPOSE_FILE"
    print_info "Data:        $DATA_PATH"
    echo
    
    print_color "$BOLD" "Next Steps:"
    print_info "1. Change default passwords in BookStack"
    print_info "2. Configure OAuth in Gitea for Woodpecker"
    print_info "3. Start Woodpecker agents"
    print_info "4. Push repositories to Gitea"
    print_info "5. Enable repositories in Woodpecker"
    print_info "6. Set up automated backups"
    echo
    
    print_color "$BOLD" "Useful Commands:"
    print_info "View logs:    docker compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
    print_info "Stop stack:   docker compose -f $DOCKER_COMPOSE_FILE down"
    print_info "Start stack:  docker compose -f $DOCKER_COMPOSE_FILE up -d"
    print_info "Backup:       $SCRIPT_DIR/backup-mosaic.sh"
    echo
    
    # Save summary to file
    local summary_file="$DEPLOYMENT_DIR/setup-summary-$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "MosAIc Stack Setup Summary"
        echo "Generated: $(date)"
        echo "=========================="
        echo
        echo "Installation Path: $DATA_PATH"
        echo "Primary Domain: $DOMAIN"
        echo
        echo "Service URLs:"
        echo "- Gitea: https://$GIT_DOMAIN"
        echo "- BookStack: https://$DOCS_DOMAIN" 
        echo "- Woodpecker: https://$CI_DOMAIN"
        echo
        echo "Credentials saved in: $DEPLOYMENT_DIR/.env"
    } > "$summary_file"
    
    print_success "Setup summary saved to: $summary_file"
}

# Run main function
main "$@"