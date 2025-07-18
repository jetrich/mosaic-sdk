#!/bin/bash
# Pre-tool-use hook to ensure agents read documentation

# Check if this is a potentially destructive action
if [[ "$CLAUDE_TOOL_NAME" == "Bash" ]]; then
    # Check for potentially problematic commands
    if echo "$CLAUDE_TOOL_INPUT" | grep -E "(npm install|npm run|docker|git checkout|git pull)" > /dev/null; then
        if [ ! -f ".mosaic/.agent-initialized" ]; then
            echo "⚠️  STOP! You must run /init first to understand the project context."
            echo "Epic E.055 is in progress. DO NOT proceed without reading documentation."
            exit 1
        fi
    fi
fi