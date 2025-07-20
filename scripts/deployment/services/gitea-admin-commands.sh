#!/bin/bash
# Gitea administrative commands

echo "=== Gitea Admin Commands ==="
echo
echo "1. Check database status:"
echo "   ./check-gitea-db.sh"
echo
echo "2. List all users:"
echo "   docker exec mosaic-gitea gitea admin user list"
echo
echo "3. Create new admin user:"
echo "   docker exec mosaic-gitea gitea admin user create --username <username> --password <password> --email <email> --admin"
echo
echo "4. Reset user password:"
echo "   docker exec mosaic-gitea gitea admin user change-password --username <username> --password <newpassword>"
echo
echo "5. Grant admin privileges:"
echo "   docker exec mosaic-gitea gitea admin user change-access --username <username> --access admin"
echo
echo "6. Check Gitea version:"
echo "   docker exec mosaic-gitea gitea --version"
echo
echo "7. Recreate Gitea admin (if database was wiped):"
echo "   docker exec mosaic-gitea gitea admin user create --username admin --password admin123 --email admin@mosaicstack.dev --admin"
echo
echo "8. Check if Gitea is in setup mode:"
echo "   curl http://localhost:3000/install"
echo
echo "=== Actual Commands to Run ==="
echo
echo "Check existing users:"
docker exec mosaic-gitea gitea admin user list 2>/dev/null || echo "Error: Could not list users"