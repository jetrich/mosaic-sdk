#!/bin/bash
# Uninstall Git hooks for MosAIc SDK

echo "🔧 Uninstalling Git hooks..."

GIT_DIR="$(git rev-parse --git-dir 2>/dev/null)"

if [ -z "$GIT_DIR" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Remove each hook
for hook in pre-commit commit-msg pre-push; do
    if [ -f "$GIT_DIR/hooks/$hook" ]; then
        echo "Removing $hook hook..."
        rm "$GIT_DIR/hooks/$hook"
        echo "✅ $hook hook removed"
    fi
done

echo ""
echo "✅ Git hooks uninstalled successfully!"