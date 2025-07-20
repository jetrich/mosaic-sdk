#!/bin/bash
# Update local Git repositories to use Gitea as primary remote

echo "🔄 Updating Git Remotes to Use Gitea"
echo "===================================="

# Base paths
WORKSPACE="$HOME/src"
GITEA_URL="http://localhost:3000"

# Function to update repository remote
update_repo_remote() {
    local repo_path=$1
    local gitea_org=$2
    local repo_name=$3
    
    if [ -d "$repo_path" ]; then
        echo ""
        echo "📁 Updating $repo_path"
        cd "$repo_path"
        
        # Rename origin to github
        if git remote | grep -q "^origin$"; then
            git remote rename origin github 2>/dev/null || true
        fi
        
        # Add gitea as origin
        git remote add origin "$GITEA_URL/$gitea_org/$repo_name.git" 2>/dev/null || \
        git remote set-url origin "$GITEA_URL/$gitea_org/$repo_name.git"
        
        # Set upstream branch
        git fetch origin
        
        # Show remotes
        echo "  Remotes configured:"
        git remote -v | sed 's/^/    /'
    else
        echo "⚠️  Directory not found: $repo_path"
    fi
}

# Update Mosaic repositories
echo "🏢 Updating Mosaic Organization Repositories..."
update_repo_remote "$WORKSPACE/mosaic" "mosaic" "mosaic"
update_repo_remote "$WORKSPACE/mosaic-sdk" "mosaic" "mosaic-sdk"
update_repo_remote "$WORKSPACE/mosaic-mcp" "mosaic" "mosaic-mcp"
update_repo_remote "$WORKSPACE/mosaic-dev" "mosaic" "mosaic-dev"

# Update Tony repositories
echo ""
echo "🏛️ Updating Tony/DYOR Foundation Repositories..."
update_repo_remote "$WORKSPACE/tony" "mosaic" "tony"
update_repo_remote "$WORKSPACE/tony-sdk" "mosaic" "tony-sdk"

echo ""
echo "✅ Remote updates complete!"
echo ""
echo "📝 New workflow:"
echo "  - Push to Gitea: git push origin main"
echo "  - Push to GitHub: git push github main"
echo "  - Pull from Gitea: git pull origin main"
echo ""
echo "💡 To set Gitea as default push remote:"
echo "  git config --global url.'$GITEA_URL/'.pushInsteadOf 'https://github.com/jetrich/'"