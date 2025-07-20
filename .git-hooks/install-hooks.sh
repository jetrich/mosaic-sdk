#!/bin/bash
# Install Git hooks for MosAIc SDK

echo "🔧 Installing Git hooks for MosAIc SDK..."

HOOKS_DIR="$(dirname "$0")"
GIT_DIR="$(git rev-parse --git-dir 2>/dev/null)"

if [ -z "$GIT_DIR" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Install each hook
for hook in pre-commit commit-msg pre-push; do
    if [ -f "$HOOKS_DIR/$hook" ]; then
        echo "Installing $hook hook..."
        cp "$HOOKS_DIR/$hook" "$GIT_DIR/hooks/$hook"
        chmod +x "$GIT_DIR/hooks/$hook"
        echo "✅ $hook hook installed"
    fi
done

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs linting and checks before commit"
echo "  - commit-msg: Validates commit message format"
echo "  - pre-push: Runs tests and security checks before push"
echo ""
echo "To skip hooks temporarily, use --no-verify flag:"
echo "  git commit --no-verify"
echo "  git push --no-verify"
echo ""
echo "To uninstall hooks, run:"
echo "  $HOOKS_DIR/uninstall-hooks.sh"