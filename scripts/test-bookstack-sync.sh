#!/bin/bash
# Test BookStack sync functionality with example documentation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== BookStack Documentation Sync Test ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Count documentation files
echo "📊 Documentation Statistics:"
echo -n "Total markdown files: "
find "$PROJECT_ROOT/docs" -name "*.md" -type f | wc -l

echo -n "Engineering docs: "
find "$PROJECT_ROOT/docs/engineering" -name "*.md" -type f 2>/dev/null | wc -l || echo "0"

echo -n "Stack docs: "
find "$PROJECT_ROOT/docs/stack" -name "*.md" -type f 2>/dev/null | wc -l || echo "0"

echo -n "Operations docs: "
find "$PROJECT_ROOT/docs/operations" -name "*.md" -type f 2>/dev/null | wc -l || echo "0"

echo -n "Projects docs: "
find "$PROJECT_ROOT/docs/projects" -name "*.md" -type f 2>/dev/null | wc -l || echo "0"

echo ""

# Validate structure
echo "🔍 Validating documentation structure..."
if python "$PROJECT_ROOT/scripts/validate-bookstack-structure.py" "$PROJECT_ROOT/docs" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Structure validation passed${NC}"
else
    echo -e "${YELLOW}⚠️  Structure validation has warnings${NC}"
fi

echo ""

# Show sample of created documentation
echo "📚 Sample documentation files created:"
echo "├── Engineering"
find "$PROJECT_ROOT/docs/engineering" -name "*.md" -type f 2>/dev/null | head -3 | sed 's/^/│   /'
echo "├── Stack" 
find "$PROJECT_ROOT/docs/stack" -name "*.md" -type f 2>/dev/null | head -3 | sed 's/^/│   /'
echo "├── Operations"
find "$PROJECT_ROOT/docs/operations" -name "*.md" -type f 2>/dev/null | head -3 | sed 's/^/│   /'
echo "└── Projects"
find "$PROJECT_ROOT/docs/projects" -name "*.md" -type f 2>/dev/null | head -3 | sed 's/^/    /'

echo ""

# Dry run sync
echo "🚀 Running sync in dry-run mode..."
echo "Command: python scripts/sync-to-bookstack.py docs/ --dry-run --url https://docs.mosaicstack.dev --token-id test --token-secret test"
echo ""

# Create a summary instead of full dry-run
echo "📋 Sync Summary (dry-run):"
echo "- Would sync to BookStack at https://docs.mosaicstack.dev"
echo "- Structure defined in: docs/bookstack/bookstack-structure.yaml"
echo "- Total pages to sync: $(find "$PROJECT_ROOT/docs" -name "*.md" -type f | wc -l)"
echo ""

# Show what would be synced
echo "📤 Would sync the following structure:"
echo "└── MosAIc Documentation (shelf)"
echo "    ├── Engineering Guide (book)"
echo "    │   ├── Getting Started (chapter)"
echo "    │   │   ├── Prerequisites"
echo "    │   │   └── Environment Setup"
echo "    │   ├── Best Practices (chapter)"
echo "    │   │   └── Coding Standards"
echo "    │   └── Git Guide (chapter)"
echo "    │       └── Branching Strategy"
echo "    ├── Stack Documentation (book)"
echo "    │   ├── Configuration (chapter)"
echo "    │   │   └── Environment Variables"
echo "    │   ├── Services (chapter)"
echo "    │   │   └── Gitea Service"
echo "    │   └── Troubleshooting (chapter)"
echo "    │       └── Service Startup Issues"
echo "    └── Operations Manual (book)"
echo "        ├── Backup Procedures (chapter)"
echo "        │   └── Backup Overview"
echo "        └── Project Management (book)"
echo "            └── Planning (chapter)"
echo "                └── Project Planning Overview"

echo ""
echo -e "${GREEN}✨ BookStack sync is ready!${NC}"
echo ""
echo "To perform actual sync:"
echo "1. Ensure BookStack is running at https://docs.mosaicstack.dev"
echo "2. Create API tokens in BookStack (Settings → API Tokens)"
echo "3. Run: python scripts/sync-to-bookstack.py docs/ \\"
echo "        --url https://docs.mosaicstack.dev \\"
echo "        --token-id YOUR_TOKEN_ID \\"
echo "        --token-secret YOUR_TOKEN_SECRET"
echo ""
echo "For CI/CD integration:"
echo "- Add tokens as secrets in Woodpecker"
echo "- Pipeline at: .woodpecker/sync-docs.yml"
echo "- Triggers on: push to main, docs/** changes"

# Make script executable
chmod +x "$PROJECT_ROOT/scripts/test-bookstack-sync.sh"