#!/bin/bash
# Script to check Gitea database and user status

echo "=== Checking Gitea Database Status ==="

# Check if gitea_prod database exists
echo -e "\n1. Checking if gitea_prod database exists:"
docker exec mosaic-postgres psql -U postgres -c "\l" | grep gitea_prod

# Check tables in gitea_prod
echo -e "\n2. Checking tables in gitea_prod database:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "\dt" 2>/dev/null | head -20

# Check if user table exists and has data
echo -e "\n3. Checking users in Gitea:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "SELECT id, name, email, is_admin, created_unix FROM \"user\" LIMIT 10;" 2>/dev/null

# Count users
echo -e "\n4. Total number of users:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "SELECT COUNT(*) as user_count FROM \"user\";" 2>/dev/null

# Check repositories
echo -e "\n5. Checking repositories:"
docker exec mosaic-postgres psql -U postgres -d gitea_prod -c "SELECT COUNT(*) as repo_count FROM repository;" 2>/dev/null

# Check Gitea config location
echo -e "\n6. Checking Gitea configuration:"
ls -la /opt/mosaic/gitea/config/app.ini 2>/dev/null || echo "app.ini not found"

# Check if Gitea thinks it's installed
echo -e "\n7. Checking Gitea installation status:"
docker exec mosaic-gitea cat /data/gitea/conf/app.ini 2>/dev/null | grep -i "INSTALL_LOCK" || echo "Could not check install lock"

echo -e "\n=== End of Database Check ==="