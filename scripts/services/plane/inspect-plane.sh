#!/bin/bash
# Inspect Plane container configuration

echo "=== Plane Container Inspection ==="
echo

echo "1. Backend Command & Entrypoint:"
docker inspect mosaic-plane-backend | jq '.[0].Config.Cmd, .[0].Config.Entrypoint' 2>/dev/null

echo -e "\n2. Frontend Command & Entrypoint:"
docker inspect mosaic-plane-frontend | jq '.[0].Config.Cmd, .[0].Config.Entrypoint' 2>/dev/null

echo -e "\n3. Worker Command & Entrypoint:"
docker inspect mosaic-plane-worker | jq '.[0].Config.Cmd, .[0].Config.Entrypoint' 2>/dev/null

echo -e "\n4. Exit codes:"
echo "Backend: $(docker inspect mosaic-plane-backend | jq '.[0].State.ExitCode' 2>/dev/null)"
echo "Frontend: $(docker inspect mosaic-plane-frontend | jq '.[0].State.ExitCode' 2>/dev/null)"
echo "Worker: $(docker inspect mosaic-plane-worker | jq '.[0].State.ExitCode' 2>/dev/null)"

echo -e "\n5. Test if we can run bash in backend:"
docker run --rm --entrypoint /bin/bash makeplane/plane-backend:latest -c "echo 'Container has bash'" 2>&1 || echo "No bash available"

echo -e "\n6. Test what's in the container:"
docker run --rm --entrypoint /bin/sh makeplane/plane-backend:latest -c "ls -la /" 2>&1 | head -20