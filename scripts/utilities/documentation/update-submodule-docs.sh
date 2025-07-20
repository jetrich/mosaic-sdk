#!/bin/bash
# Update all submodules with DOCUMENTATION.md files

set -euo pipefail

echo "Adding DOCUMENTATION.md to all submodules..."

# Function to create DOCUMENTATION.md for a submodule
create_doc_file() {
    local submodule=$1
    local name=$2
    
    if [ -d "$submodule" ]; then
        echo "Creating DOCUMENTATION.md for $name..."
        cat > "$submodule/DOCUMENTATION.md" << EOF
# Documentation for $name

## Full Documentation Location
All comprehensive documentation is maintained in:
\`mosaic-sdk/mosaic-docs/submodules/$submodule/\`

## Documentation Structure
- User Guide: \`mosaic-docs/submodules/$submodule/user-guide.md\`
- Architecture: \`mosaic-docs/submodules/$submodule/architecture.md\`
- API Reference: \`./docs/API.md\` (generated)
- Configuration: \`mosaic-docs/submodules/$submodule/configuration-reference.md\`
- Troubleshooting: \`mosaic-docs/submodules/$submodule/troubleshooting-guide.md\`

## Updating Documentation
1. Clone mosaic-sdk with submodules: \`git clone --recursive https://github.com/jetrich/mosaic-sdk.git\`
2. Navigate to: \`mosaic-sdk/mosaic-docs/submodules/$submodule/\`
3. Edit documentation following standards in \`mosaic-docs/standards/\`
4. Submit PR to mosaic-docs repository

## Documentation in CI/CD
All pull requests validate documentation completeness. See \`.woodpecker.yml\` for details.
EOF
        echo "✓ Created $submodule/DOCUMENTATION.md"
    else
        echo "⚠️  Submodule $submodule not found"
    fi
}

# Create DOCUMENTATION.md for each submodule
create_doc_file "tony" "Tony Framework"
create_doc_file "mosaic-mcp" "MosAIc MCP Server"
create_doc_file "mosaic" "MosAIc Platform"

echo
echo "Next steps:"
echo "1. Review the created DOCUMENTATION.md files"
echo "2. Commit changes in each submodule"
echo "3. Update submodule references in mosaic-sdk"