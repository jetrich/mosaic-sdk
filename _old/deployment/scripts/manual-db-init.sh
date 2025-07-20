#!/bin/bash
# Manually create databases if init script didn't run

echo "=== Manual Database Initialization ==="

# Check what databases exist
echo "Current databases:"
docker exec mosaic-postgres psql -U postgres -c "\l" | grep -E "(List of databases|Name|bookstack|woodpecker|plane|postgres)"

echo -e "\nCreating missing databases..."

# Create databases if they don't exist
docker exec mosaic-postgres psql -U postgres <<EOF
-- Create bookstack_prod if not exists
SELECT 'CREATE DATABASE bookstack_prod' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bookstack_prod')\gexec
GRANT ALL PRIVILEGES ON DATABASE bookstack_prod TO postgres;

-- Create woodpecker_prod if not exists  
SELECT 'CREATE DATABASE woodpecker_prod' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'woodpecker_prod')\gexec
GRANT ALL PRIVILEGES ON DATABASE woodpecker_prod TO postgres;

-- Create plane_prod if not exists
SELECT 'CREATE DATABASE plane_prod' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'plane_prod')\gexec
GRANT ALL PRIVILEGES ON DATABASE plane_prod TO postgres;
EOF

echo -e "\nDatabases after creation:"
docker exec mosaic-postgres psql -U postgres -c "\l" | grep -E "(bookstack|woodpecker|plane)"

echo -e "\nDatabase initialization complete!"