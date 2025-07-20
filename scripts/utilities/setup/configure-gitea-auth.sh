#!/bin/bash
# Script to configure Gitea authentication for MosAIc SDK

set -e

echo "🔐 Gitea Authentication Configuration"
echo "===================================="
echo ""
echo "This script will help you configure authentication for Gitea at git.mosaicstack.dev"
echo ""
echo "📝 Prerequisites:"
echo "1. You need a Gitea account at https://git.mosaicstack.dev"
echo "2. You need to create an Access Token:"
echo "   - Go to https://git.mosaicstack.dev/user/settings/applications"
echo "   - Click 'Generate New Token'"
echo "   - Give it a name (e.g., 'CLI Access')"
echo "   - Select scopes: repo (read/write), admin:repo_hook"
echo "   - Click 'Generate Token' and copy it"
echo ""
read -p "Press Enter when you have your access token ready..."
echo ""

# Get credentials
read -p "Enter your Gitea username: " username
read -s -p "Enter your Access Token: " token
echo ""
echo ""

# Check if .netrc exists and backup
if [ -f ~/.netrc ]; then
    echo "📁 Backing up existing .netrc to .netrc.backup"
    cp ~/.netrc ~/.netrc.backup
fi

# Check if Gitea entry already exists
if grep -q "machine git.mosaicstack.dev" ~/.netrc 2>/dev/null; then
    echo "⚠️  Gitea entry already exists in .netrc"
    read -p "Do you want to update it? (y/n): " update_existing
    if [[ $update_existing == "y" ]]; then
        # Remove existing entry
        sed -i.tmp '/machine git.mosaicstack.dev/d' ~/.netrc
        rm -f ~/.netrc.tmp
    else
        echo "❌ Cancelled. No changes made."
        exit 1
    fi
fi

# Add new entry
echo "machine git.mosaicstack.dev login $username password $token" >> ~/.netrc
chmod 600 ~/.netrc

echo "✅ Authentication configured successfully!"
echo ""

# Test authentication
echo "🧪 Testing authentication..."
if curl -s -f -H "Authorization: token $token" https://git.mosaicstack.dev/api/v1/user > /dev/null; then
    echo "✅ Authentication test passed!"
else
    echo "❌ Authentication test failed. Please check your token and try again."
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. You can now push/pull from Gitea repositories"
echo "2. The dual-push configuration will automatically mirror to GitHub"
echo "3. Use 'git push' to push to both Gitea and GitHub"
echo ""
echo "🔒 Security note: Your token is stored in ~/.netrc with 600 permissions"
echo "   Keep this file secure and never commit it to version control"