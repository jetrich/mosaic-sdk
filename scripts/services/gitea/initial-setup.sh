#!/bin/bash
# Gitea Initial Setup Script for Mosaic Stack
# This script helps configure Gitea after first deployment

set -e

echo "🚀 Mosaic Gitea Initial Setup Script"
echo "===================================="

# Configuration
GITEA_URL="${GITEA_URL:-http://localhost:3000}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@local.mosaic}"

# Wait for Gitea to be ready
echo "⏳ Waiting for Gitea to be ready..."
until curl -f -s "${GITEA_URL}/api/healthz" > /dev/null; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Function to create organization
create_org() {
    local org_name=$1
    local org_desc=$2
    
    echo "📁 Creating organization: $org_name"
    
    # This would use Gitea API
    # Placeholder for actual implementation
    echo "   Organization $org_name would be created via API"
}

# Function to create repository
create_repo() {
    local org=$1
    local repo=$2
    local desc=$3
    
    echo "📦 Creating repository: $org/$repo"
    # Placeholder for actual implementation
    echo "   Repository $org/$repo would be created via API"
}

# Check if initial setup is needed
if curl -s "${GITEA_URL}/api/v1/version" | grep -q "version"; then
    echo "✅ Gitea is already configured"
    
    # Create default organizations
    echo ""
    echo "📋 Setting up default organizations..."
    
    create_org "tony" "Tony Framework - AI-Powered Tech Lead"
    create_org "mosaic" "Mosaic Platform - Enterprise Multi-Orchestration"
    create_org "mosaic-mcp" "Mosaic MCP Server Implementation"
    
    # Create webhook for GitHub sync
    echo ""
    echo "🔗 Configuring GitHub sync webhook..."
    echo "   Note: You'll need to configure the actual webhook URL after setting up the sync service"
    
    # Output next steps
    echo ""
    echo "✨ Initial setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Log in to Gitea at ${GITEA_URL}"
    echo "2. Create personal access tokens for automation"
    echo "3. Configure GitHub sync webhooks"
    echo "4. Import existing repositories"
    
else
    echo "❌ Gitea is not responding correctly"
    echo "Please complete the web-based installation first"
    exit 1
fi

echo ""
echo "📚 Useful Commands:"
echo "- Create admin token: docker exec mosaic-gitea gitea admin user generate-access-token $ADMIN_USER"
echo "- List users: docker exec mosaic-gitea gitea admin user list"
echo "- Create user: docker exec mosaic-gitea gitea admin user create --username <user> --password <pass> --email <email>"