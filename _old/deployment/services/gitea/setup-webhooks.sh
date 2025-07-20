#!/bin/bash
# Configure webhooks for GitHub synchronization

GITEA_URL="http://localhost:3000"

echo "🔗 Webhook Configuration Guide"
echo "=============================="

echo ""
echo "For automatic GitHub synchronization, configure webhooks in each Gitea repository:"
echo ""

# Function to display webhook config
show_webhook_config() {
    local org=$1
    local repo=$2
    
    echo "📌 $org/$repo:"
    echo "   1. Go to: $GITEA_URL/$org/$repo/settings/hooks"
    echo "   2. Add webhook -> Gitea"
    echo "   3. Target URL: http://your-sync-service:8080/webhook"
    echo "   4. HTTP Method: POST"
    echo "   5. Content Type: application/json"
    echo "   6. Secret: <your-webhook-secret>"
    echo "   7. Events: Push, Create (branch/tag), Delete (branch/tag)"
    echo ""
}

echo "Configure webhooks for these repositories:"
echo ""

# Mosaic repos
show_webhook_config "mosaic" "mosaic"
show_webhook_config "mosaic" "mosaic-sdk"
show_webhook_config "mosaic" "mosaic-mcp"
show_webhook_config "mosaic" "mosaic-dev"

# DYOR Foundation repos
show_webhook_config "dyor-foundation" "tony"
show_webhook_config "dyor-foundation" "tony-sdk"

echo "📝 Webhook Payload Example:"
echo "-------------------------"
cat > /tmp/webhook-example.json <<'EOF'
{
  "secret": "your-webhook-secret",
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "1234567890abcdef1234567890abcdef12345678",
  "repository": {
    "id": 1,
    "name": "repo-name",
    "full_name": "org/repo-name",
    "clone_url": "http://localhost:3000/org/repo-name.git"
  },
  "pusher": {
    "id": 1,
    "login": "username",
    "email": "user@example.com"
  },
  "sender": {
    "id": 1,
    "login": "username"
  }
}
EOF

echo ""
echo "The sync service (created by GitHub Sync Agent) will:"
echo "1. Receive webhooks from Gitea"
echo "2. Pull changes from Gitea"
echo "3. Push to corresponding GitHub repository"
echo "4. Handle conflicts and errors gracefully"