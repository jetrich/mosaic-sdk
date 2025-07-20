#!/bin/bash

# Find all files with docker-compose usage
echo "Finding all files with deprecated 'docker-compose' usage..."
echo ""

# Search for docker-compose in all relevant files
grep -r "docker-compose" /home/jwoltje/src/tony-ng \
    --include="*.sh" \
    --include="*.json" \
    --include="*.md" \
    --include="*.yml" \
    --include="*.yaml" \
    --include="Makefile" \
    --include="*.mk" \
    2>/dev/null | grep -v "test-evidence" | head -50

echo ""
echo "Total occurrences: $(grep -r "docker-compose" /home/jwoltje/src/tony-ng --include="*.sh" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" 2>/dev/null | grep -v "test-evidence" | wc -l)"