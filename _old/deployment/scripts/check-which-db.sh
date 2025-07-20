#!/bin/bash
# Check which database contains Gitea data

echo "=== Checking for Gitea data in databases ==="

echo -e "\n1. Checking 'postgres' database for Gitea tables:"
docker exec mosaic-postgres psql -U postgres -d postgres -c "\dt" 2>/dev/null | grep -E "(user|repository|issue)" | head -10

echo -e "\n2. Checking 'gitea_prod' database for Gitea tables:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "\dt" 2>/dev/null | grep -E "(user|repository|issue)" | head -10

echo -e "\n3. Checking users in 'postgres' database:"
docker exec mosaic-postgres psql -U postgres -d postgres -c "SELECT id, name, email, is_admin FROM \"user\" LIMIT 5;" 2>/dev/null

echo -e "\n4. Checking users in 'gitea_prod' database:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "SELECT id, name, email, is_admin FROM \"user\" LIMIT 5;" 2>/dev/null

echo -e "\n5. Repository count in 'postgres' database:"
docker exec mosaic-postgres psql -U postgres -d postgres -c "SELECT COUNT(*) as repo_count FROM repository;" 2>/dev/null

echo -e "\n6. Repository count in 'gitea_prod' database:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "SELECT COUNT(*) as repo_count FROM repository;" 2>/dev/null