#!/bin/bash
# Gitea Configuration Script for MosAIc Infrastructure

# Configuration
GITEA_URL="http://localhost:3000"
GITEA_ADMIN_USER="jason.woltje"  # Update with your admin username

echo "🚀 Gitea Repository Setup Script"
echo "================================"

# Function to create repository
create_repo() {
    local org=$1
    local repo=$2
    local desc=$3
    local private=$4
    
    echo "Creating $org/$repo..."
    
    cat > /tmp/create-repo.json <<EOF
{
    "name": "$repo",
    "description": "$desc",
    "private": $private,
    "auto_init": true,
    "default_branch": "main",
    "gitignores": "Node",
    "license": "MIT",
    "readme": "# $repo\n\n$desc\n\nPart of the MosAIc Platform."
}
EOF

    echo "Please create $org/$repo manually in Gitea with:"
    echo "  Name: $repo"
    echo "  Description: $desc"
    echo "  Private: $private"
    echo "  Initialize with README: Yes"
    echo "  Default branch: main"
    echo ""
}

# Mosaic Organization Repositories
echo "📁 Setting up Mosaic Organization Repositories"
echo "----------------------------------------------"

create_repo "mosaic" "mosaic" "MosAIc Platform - Enterprise Multi-Orchestration System for AI Coding" false
create_repo "mosaic" "mosaic-sdk" "MosAIc SDK - Enterprise AI Development Platform" false
create_repo "mosaic" "mosaic-mcp" "MosAIc MCP Server - Model Context Protocol Implementation" false
create_repo "mosaic" "mosaic-dev" "MosAIc Development Tools and Utilities" false

# DYOR Foundation Repositories
echo ""
echo "📁 Setting up DYOR Foundation Repositories"
echo "------------------------------------------"

create_repo "mosaic" "tony" "Tony Framework - AI-Powered Tech Lead for Autonomous Development" false
create_repo "mosaic" "tony-sdk" "Tony SDK - Meta-repository orchestrating Tony components" false
create_repo "mosaic" "upp-methodology" "Ultrathink Planning Protocol - Enterprise Planning Methodology" false

echo ""
echo "✅ Repository structure planned!"
echo ""
echo "Next steps:"
echo "1. Create each repository manually in Gitea UI"
echo "2. Run the migration script to import from GitHub"
echo "3. Configure webhooks for GitHub sync"