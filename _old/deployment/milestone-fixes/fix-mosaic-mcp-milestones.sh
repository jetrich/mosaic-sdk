#!/bin/bash
# Script to fix mosaic-mcp milestone sequencing issues
# Run this after reviewing the changes

echo "🔧 Fixing mosaic-mcp milestone sequence issues"
echo "=============================================="

# Configuration
REPO="jetrich/mosaic-mcp"

# Current problematic state:
# Milestone 2: v0.1.0 - Due July 30 (should be later)
# Milestone 3: v0.0.1 - Due July 22 (correct)
# Milestone 4: v0.0.2 - Due July 29 (correct)
# Milestone 5: v0.0.3 - Due Aug 8 (correct)
# Milestone 6: v0.0.4 - Due Aug 12 (correct)
# Milestone 7: v0.2.0 - Due Aug 15 (has Issue 81)

echo "📊 Current milestone analysis:"
gh api repos/${REPO}/milestones --jq '.[] | select(.number >= 2 and .number <= 7) | "Milestone \(.number): \(.title) - Due: \(.due_on)"'

echo ""
echo "🔄 Proposed changes:"
echo "1. Move v0.1.0 (milestone 2) to August 20 (after v0.0.4)"
echo "2. Keep v0.2.0 (milestone 7) at August 15 for Issue 81"
echo "3. This creates logical progression: v0.0.1 → v0.0.2 → v0.0.3 → v0.0.4 → v0.2.0 → v0.1.0"

echo ""
read -p "⚠️  Proceed with milestone date changes? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Updating milestone dates..."
    
    # Update v0.1.0 milestone to August 20
    echo "📅 Moving v0.1.0 (milestone 2) to August 20..."
    gh api -X PATCH repos/${REPO}/milestones/2 \
        -f due_on="2025-08-20T07:00:00Z" \
        -f description="Minimal viable MCP server with core database and protocol implementation - MOVED to follow incremental versions"
    
    echo "✅ Milestone dates updated!"
    
    echo ""
    echo "📊 New milestone sequence:"
    gh api repos/${REPO}/milestones --jq '.[] | select(.number >= 2 and .number <= 7) | "Milestone \(.number): \(.title) - Due: \(.due_on)"' | sort -k5
    
else
    echo "❌ Milestone update cancelled"
fi

echo ""
echo "📌 Next steps for Issue 81 (MCP Orchestration):"
echo "1. This issue is critical for Tony 2.8.0"
echo "2. Consider moving to an earlier milestone or creating a spike"
echo "3. Run: gh issue edit 81 --repo ${REPO} --milestone 5"
echo "   (This would move it to v0.0.3 milestone for earlier delivery)"