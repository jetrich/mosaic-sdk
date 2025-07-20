#!/bin/bash
# Fix database creation with explicit commands

echo "=== Creating Missing Databases ==="

# Create bookstack_prod
echo "Creating bookstack_prod..."
docker exec mosaic-postgres psql -U postgres -c "CREATE DATABASE bookstack_prod;" 2>&1 || echo "Database may already exist"

# Create woodpecker_prod
echo "Creating woodpecker_prod..."
docker exec mosaic-postgres psql -U postgres -c "CREATE DATABASE woodpecker_prod;" 2>&1 || echo "Database may already exist"

# Create plane_prod
echo "Creating plane_prod..."
docker exec mosaic-postgres psql -U postgres -c "CREATE DATABASE plane_prod;" 2>&1 || echo "Database may already exist"

# Grant privileges
echo -e "\nGranting privileges..."
docker exec mosaic-postgres psql -U postgres <<EOF
GRANT ALL PRIVILEGES ON DATABASE bookstack_prod TO postgres;
GRANT ALL PRIVILEGES ON DATABASE woodpecker_prod TO postgres;
GRANT ALL PRIVILEGES ON DATABASE plane_prod TO postgres;
EOF

# Verify
echo -e "\nVerifying databases:"
docker exec mosaic-postgres psql -U postgres -c "\l" | grep -E "(bookstack|woodpecker|plane|gitea)"