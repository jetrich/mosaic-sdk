#!/bin/bash
# setup-host-filesystem.sh - Set up host filesystem for MosAIc Stack Portainer deployment
# This script creates all necessary directories and configuration files in /opt/mosaic/

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== MosAIc Stack Host Filesystem Setup ===${NC}"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root to create directories in /opt/${NC}" 
   echo "Usage: sudo $0"
   exit 1
fi

# Create base directory structure
echo -e "${YELLOW}Creating directory structure in /opt/mosaic...${NC}"
mkdir -p /opt/mosaic/{postgres/{data,config},redis/{data,config},gitea/{data,config},woodpecker/{data,agent_data,config},bookstack/{data,config},plane/{media,static,config},backups,logs}

# Set proper ownership (assuming user ID 1000, adjust if needed)
chown -R 1000:1000 /opt/mosaic
chmod -R 755 /opt/mosaic

echo -e "${GREEN}✓ Directory structure created${NC}"

# PostgreSQL configuration
echo -e "${YELLOW}Creating PostgreSQL configuration...${NC}"
cat > /opt/mosaic/postgres/postgresql.conf << 'EOF'
# PostgreSQL Configuration for MosAIc Stack
# Optimized for multiple databases and concurrent connections

# Connection and Authentication
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Write Ahead Logging (WAL)
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9

# Query Tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Statistics
track_activities = on
track_counts = on
track_io_timing = on
track_functions = pl

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min

# Security
ssl = off  # Disabled for internal container communication
password_encryption = scram-sha-256
EOF

# PostgreSQL database initialization script
cat > /opt/mosaic/postgres/init-databases.sh << 'EOF'
#!/bin/bash
# init-databases.sh - Initialize multiple PostgreSQL databases
# This script is executed during PostgreSQL container startup

set -e
set -u

function create_user_and_database() {
    local database=$1
    echo "  Creating database '$database'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_user_and_database $db
    done
    echo "Multiple databases created"
fi
EOF

chmod +x /opt/mosaic/postgres/init-databases.sh
echo -e "${GREEN}✓ PostgreSQL configuration created${NC}"

# Redis configuration
echo -e "${YELLOW}Creating Redis configuration...${NC}"
cat > /opt/mosaic/redis/redis.conf << 'EOF'
# Redis Configuration for MosAIc Stack
# Optimized for session management and caching

# Network
bind 0.0.0.0
port 6379
protected-mode yes

# General
daemonize no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Replication
replica-serve-stale-data yes
replica-read-only yes

# Security
# requirepass will be set via environment variable

# Limits
maxmemory 256mb
maxmemory-policy allkeys-lru
maxclients 128

# Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency Monitor
latency-monitor-threshold 100

# Advanced Config
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

# Client Output Buffer Limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Database configuration for multiple services
databases 16

# Database allocation:
# 0: Gitea sessions
# 1: Gitea cache
# 2: Plane.so
# 3: BookStack sessions
# 4: BookStack cache
# 5: Woodpecker (if needed)
# 6-15: Available for future use
EOF

echo -e "${GREEN}✓ Redis configuration created${NC}"

# Create backup script
echo -e "${YELLOW}Creating backup script...${NC}"
cat > /opt/mosaic/scripts/backup.sh << 'EOF'
#!/bin/bash
# backup.sh - Backup MosAIc Stack data

set -euo pipefail

BACKUP_DIR="/opt/mosaic/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mosaicstack_backup_${TIMESTAMP}"

echo "Starting MosAIc Stack backup: ${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup PostgreSQL databases
echo "Backing up PostgreSQL databases..."
docker exec mosaicstack-postgres pg_dumpall -U postgres | gzip > "${BACKUP_DIR}/${BACKUP_NAME}/postgres_all.sql.gz"

# Backup Redis data
echo "Backing up Redis data..."
docker exec mosaicstack-redis redis-cli BGSAVE
sleep 5
cp /opt/mosaic/redis/data/dump.rdb "${BACKUP_DIR}/${BACKUP_NAME}/"

# Backup Gitea data
echo "Backing up Gitea data..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/gitea_data.tar.gz" -C /opt/mosaic/gitea data

# Backup configuration files
echo "Backing up configuration files..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/configs.tar.gz" -C /opt/mosaic postgres/postgresql.conf redis/redis.conf

# Create manifest
cat > "${BACKUP_DIR}/${BACKUP_NAME}/manifest.txt" << EOL
MosAIc Stack Backup
Timestamp: ${TIMESTAMP}
Date: $(date)
Files:
- postgres_all.sql.gz (PostgreSQL databases)
- dump.rdb (Redis data)
- gitea_data.tar.gz (Gitea repositories and data)
- configs.tar.gz (Configuration files)
EOL

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}"

# Clean up old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "mosaicstack_backup_*" -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /opt/mosaic/scripts/backup.sh
mkdir -p /opt/mosaic/scripts

echo -e "${GREEN}✓ Backup script created${NC}"

# Create environment template
echo -e "${YELLOW}Creating environment template...${NC}"
cat > /opt/mosaic/environment-template.env << 'EOF'
# MosAIc Stack Environment Variables
# Copy these variables to your Portainer stack environment

# Database Passwords (REQUIRED - Generate strong passwords)
POSTGRES_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# Gitea Configuration
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true

# Woodpecker CI/CD Configuration (REQUIRED - Set up after Gitea is running)
WOODPECKER_GITEA_CLIENT=your_gitea_oauth_client_id
WOODPECKER_GITEA_SECRET=your_gitea_oauth_client_secret
WOODPECKER_AGENT_SECRET=your_woodpecker_agent_secret
WOODPECKER_ADMIN=admin

# Plane.so Configuration (REQUIRED - Generate Django secret key)
PLANE_SECRET_KEY=your_plane_secret_key_here

# Domain Configuration
MOSAICSTACK_DOMAIN=mosaicstack.dev
EOF

echo -e "${GREEN}✓ Environment template created${NC}"

# Create setup instructions
cat > /opt/mosaic/README.md << 'EOF'
# MosAIc Stack Host Setup

This directory contains all configuration files and data for the MosAIc development stack.

## Directory Structure

```
/opt/mosaic/
├── postgres/
│   ├── data/              # PostgreSQL database files
│   ├── postgresql.conf    # PostgreSQL configuration
│   └── init-databases.sh  # Database initialization script
├── redis/
│   ├── data/              # Redis persistent data
│   └── redis.conf         # Redis configuration
├── gitea/
│   ├── data/              # Gitea repositories and app data
│   └── config/            # Gitea configuration files
├── woodpecker/
│   ├── data/              # Woodpecker server data
│   └── agent_data/        # Woodpecker agent data
├── bookstack/
│   └── data/              # BookStack files and config
├── plane/
│   ├── media/             # Plane.so media files
│   └── static/            # Plane.so static files
├── backups/               # Automated backups
├── logs/                  # Application logs
├── scripts/
│   └── backup.sh          # Backup script
└── environment-template.env # Environment variables template
```

## Next Steps

1. Review and set environment variables in Portainer stack deployment
2. Deploy the stack using docker-compose.mosaicstack.yml
3. Configure nginx proxy manager proxy hosts
4. Complete initial service setup (admin users, OAuth, etc.)

## Backup

Run automated backup:
```bash
sudo /opt/mosaic/scripts/backup.sh
```

## Permissions

All directories are owned by user:group 1000:1000 with 755 permissions.
EOF

echo -e "${GREEN}✓ Setup instructions created${NC}"

# Set final permissions
chown -R 1000:1000 /opt/mosaic
chmod -R 755 /opt/mosaic
chmod +x /opt/mosaic/postgres/init-databases.sh
chmod +x /opt/mosaic/scripts/backup.sh

echo
echo -e "${GREEN}=== Host filesystem setup completed! ===${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Review environment variables in ${YELLOW}/opt/mosaic/environment-template.env${NC}"
echo -e "2. Deploy the stack in Portainer with these environment variables"
echo -e "3. Configure nginx proxy manager proxy hosts"
echo -e "4. Access services and complete initial setup"
echo
echo -e "${BLUE}Directories created:${NC}"
find /opt/mosaic -type d | sort
echo
echo -e "${BLUE}Configuration files created:${NC}"
find /opt/mosaic -name "*.conf" -o -name "*.sh" -o -name "*.env" -o -name "*.md" | sort