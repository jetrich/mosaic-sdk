#!/bin/bash
# Import repositories from GitHub to Gitea

GITEA_URL="http://localhost:3000"
GITHUB_USER="jetrich"

echo "📥 GitHub to Gitea Migration Script"
echo "==================================="

# Function to clone and push repository
migrate_repo() {
    local github_repo=$1
    local gitea_org=$2
    local gitea_repo=$3
    
    echo ""
    echo "🔄 Migrating $github_repo to $gitea_org/$gitea_repo"
    echo "---------------------------------------------------"
    
    # Create temp directory
    TEMP_DIR="/tmp/gitea-migration-$$"
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Clone from GitHub
    echo "📥 Cloning from GitHub..."
    git clone --mirror "https://github.com/$GITHUB_USER/$github_repo.git"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to clone $github_repo"
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    cd "$github_repo.git"
    
    # Add Gitea remote
    echo "📤 Pushing to Gitea..."
    git remote add gitea "http://$GITEA_URL/$gitea_org/$gitea_repo.git"
    
    # Push all branches and tags
    git push --mirror gitea
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully migrated $github_repo"
    else
        echo "❌ Failed to push to Gitea. Make sure:"
        echo "   - Repository exists in Gitea"
        echo "   - You have push permissions"
        echo "   - Git credentials are configured"
    fi
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
}

# Configure git credentials for Gitea
echo "🔐 Configuring Git credentials for Gitea..."
echo ""
echo "You'll need to:"
echo "1. Create a personal access token in Gitea:"
echo "   - Go to: $GITEA_URL/user/settings/applications"
echo "   - Generate New Token with 'repo' scope"
echo ""
echo "2. Configure git to use the token:"
echo "   git config --global credential.helper store"
echo "   git config --global url.\"http://<username>:<token>@localhost:3000/\".insteadOf \"http://localhost:3000/\""
echo ""
read -p "Press Enter when credentials are configured..."

# Migrate Mosaic repositories
echo ""
echo "🚀 Starting repository migration..."

migrate_repo "mosaic" "mosaic" "mosaic"
migrate_repo "mosaic-sdk" "mosaic" "mosaic-sdk"
migrate_repo "mosaic-mcp" "mosaic" "mosaic-mcp"
migrate_repo "mosaic-dev" "mosaic" "mosaic-dev"

# Migrate DYOR Foundation repositories
migrate_repo "tony" "dyor-foundation" "tony"
migrate_repo "tony-sdk" "dyor-foundation" "tony-sdk"

echo ""
echo "✅ Migration complete!"
echo ""
echo "Recommended next steps:"
echo "1. Verify all repositories in Gitea"
echo "2. Set up webhooks for continuous sync"
echo "3. Configure CI/CD pipelines"