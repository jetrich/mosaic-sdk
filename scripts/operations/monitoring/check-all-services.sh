#!/bin/bash
# Check status of all MosAIc stack services

echo "=== MosAIc Stack Service Status Check ==="
echo

# 1. Check databases
echo "1. PostgreSQL Databases:"
docker exec mosaic-postgres psql -U postgres -c "\l" | grep -E "(bookstack_prod|woodpecker_prod|plane_prod|postgres)"

echo -e "\n2. BookStack Database Tables:"
docker exec mosaic-postgres psql -U postgres -d bookstack_prod -c "\dt" 2>&1 | head -5

echo -e "\n3. Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mosaic-|NAMES)"

echo -e "\n4. BookStack Logs (last 20 lines):"
docker logs mosaic-bookstack 2>&1 | tail -20

echo -e "\n5. Plane Frontend Logs (last 10 lines):"
docker logs mosaic-plane-frontend 2>&1 | tail -10

echo -e "\n6. Plane Backend Logs (last 10 lines):"
docker logs mosaic-plane-backend 2>&1 | tail -10

echo -e "\n7. Check BookStack APP_KEY:"
docker exec mosaic-bookstack printenv APP_KEY 2>/dev/null || echo "APP_KEY not set"

echo -e "\n8. Test BookStack Web Access:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080 || echo "BookStack not responding"

echo -e "\n9. Test Plane Frontend Access:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3001 || echo "Plane frontend not responding"

echo -e "\n10. Redis Connection Test:"
docker exec mosaic-redis redis-cli -a ${REDIS_PASSWORD} ping 2>/dev/null || echo "Redis auth failed"