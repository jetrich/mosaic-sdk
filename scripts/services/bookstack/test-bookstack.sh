#!/bin/bash
# Test BookStack status

echo "=== BookStack Status Check ==="
echo

echo "1. Container status:"
docker ps | grep bookstack

echo -e "\n2. BookStack database check:"
docker exec mosaic-postgres psql -U postgres -d bookstack_prod -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>&1

echo -e "\n3. BookStack web test:"
curl -I http://localhost:8080 2>/dev/null | head -10

echo -e "\n4. BookStack logs (last 20 lines):"
docker logs mosaic-bookstack 2>&1 | tail -20

echo -e "\n5. Check APP_KEY is set:"
docker exec mosaic-bookstack printenv APP_KEY | cut -c1-20 && echo "..."