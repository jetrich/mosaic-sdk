#!/bin/bash
# Generate required application keys

echo "=== Generating Application Keys ==="
echo

echo "1. BookStack APP_KEY (Laravel format):"
echo "   BOOKSTACK_APP_KEY=base64:$(openssl rand -base64 32)"
echo

echo "2. Plane SECRET_KEY:"
echo "   PLANE_SECRET_KEY=$(openssl rand -hex 32)"
echo

echo "3. Woodpecker AGENT_SECRET:"
echo "   WOODPECKER_AGENT_SECRET=$(openssl rand -hex 32)"
echo

echo "=== Add these to your Portainer environment variables ==="
echo
echo "Note: BookStack requires the 'base64:' prefix for the APP_KEY"