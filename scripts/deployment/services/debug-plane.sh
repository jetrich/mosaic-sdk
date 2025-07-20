#!/bin/bash
# Debug Plane.so container issues

echo "=== Debugging Plane.so Containers ==="
echo

echo "1. Plane Backend Logs:"
docker logs mosaic-plane-backend 2>&1 | head -30

echo -e "\n2. Plane Frontend Logs:"
docker logs mosaic-plane-frontend 2>&1 | head -30

echo -e "\n3. Plane Worker Logs:"
docker logs mosaic-plane-worker 2>&1 | head -30

echo -e "\n4. Check Plane environment variables:"
docker exec mosaic-plane-backend printenv | grep -E "(DATABASE_URL|REDIS_URL|SECRET_KEY)" | head -5

echo -e "\n5. Test database connection from Plane:"
docker exec mosaic-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'plane_prod';" 2>&1

echo -e "\n6. Plane container inspect (exit codes):"
docker inspect mosaic-plane-backend | grep -A5 "State"