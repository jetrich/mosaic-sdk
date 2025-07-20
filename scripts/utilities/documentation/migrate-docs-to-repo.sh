#!/bin/bash
# Script to migrate documentation to mosaic-docs repository

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}MosAIc Documentation Migration Script${NC}"
echo "======================================"

# Check if mosaic-docs repo exists
if [ ! -d "mosaic-docs" ]; then
    echo -e "${YELLOW}Cloning mosaic-docs repository...${NC}"
    git clone https://github.com/jetrich/mosaic-docs.git
else
    echo -e "${GREEN}mosaic-docs repository found${NC}"
    cd mosaic-docs
    git pull origin main
    cd ..
fi

# Copy initial structure
echo -e "${YELLOW}Setting up initial structure...${NC}"
cp -r mosaic-docs-temp/* mosaic-docs/
cp mosaic-docs-temp/.woodpecker.yml mosaic-docs/

# Create scripts directory
mkdir -p mosaic-docs/scripts

# Create validation scripts
cat > mosaic-docs/scripts/validate-structure.sh << 'EOF'
#!/bin/bash
# Validate documentation structure

set -euo pipefail

echo "Validating documentation structure..."

# Check required directories exist
required_dirs=("bookstack" "standards" "platform" "submodules")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "ERROR: Required directory '$dir' not found"
        exit 1
    fi
done

# Check required standards documents
if [ ! -f "standards/DOCUMENTATION-GUIDE.md" ]; then
    echo "ERROR: Documentation guide not found"
    exit 1
fi

if [ ! -f "standards/SUBMODULE-DOC-REQUIREMENTS.md" ]; then
    echo "ERROR: Submodule requirements not found"
    exit 1
fi

echo "✓ Structure validation passed"
EOF

chmod +x mosaic-docs/scripts/validate-structure.sh

# Create submodule check script
cat > mosaic-docs/scripts/check-submodule-docs.sh << 'EOF'
#!/bin/bash
# Check submodule documentation completeness

set -euo pipefail

echo "Checking submodule documentation..."

submodules=("tony" "mosaic-mcp" "mosaic" "mosaic-sdk")
required_docs=("user-guide.md" "architecture.md" "configuration-reference.md" "troubleshooting-guide.md")

errors=0

for submodule in "${submodules[@]}"; do
    echo "Checking $submodule..."
    for doc in "${required_docs[@]}"; do
        if [ ! -f "submodules/$submodule/$doc" ]; then
            echo "  ✗ Missing: submodules/$submodule/$doc"
            ((errors++))
        else
            echo "  ✓ Found: submodules/$submodule/$doc"
        fi
    done
done

if [ $errors -gt 0 ]; then
    echo "ERROR: $errors missing documentation files"
    exit 1
fi

echo "✓ All submodule documentation present"
EOF

chmod +x mosaic-docs/scripts/check-submodule-docs.sh

# Migrate existing documentation
echo -e "${YELLOW}Migrating existing documentation from mosaic-sdk...${NC}"

# Copy main documentation categories
for dir in engineering infrastructure learning operations platform projects services; do
    if [ -d "docs/$dir" ]; then
        echo "  Copying $dir/..."
        cp -r "docs/$dir" "mosaic-docs/"
    fi
done

# Copy BookStack configuration if it exists
if [ -d "docs/bookstack" ]; then
    echo "  Copying BookStack configuration..."
    cp -r docs/bookstack/* mosaic-docs/bookstack/
fi

# Create placeholder for Tony submodule docs
mkdir -p mosaic-docs/submodules/tony
echo "# Tony Framework Documentation" > mosaic-docs/submodules/tony/user-guide.md
echo "Documentation migration in progress..." >> mosaic-docs/submodules/tony/user-guide.md

# Create placeholder for other submodules
for submodule in mosaic-mcp mosaic mosaic-sdk; do
    mkdir -p mosaic-docs/submodules/$submodule
    echo "# $submodule Documentation" > mosaic-docs/submodules/$submodule/user-guide.md
    echo "Documentation migration in progress..." >> mosaic-docs/submodules/$submodule/user-guide.md
done

echo -e "${GREEN}Documentation structure created!${NC}"
echo
echo "Next steps:"
echo "1. cd mosaic-docs"
echo "2. git add ."
echo "3. git commit -m '🚀 Initial documentation structure'"
echo "4. git push origin main"
echo
echo "Then add as submodule to mosaic-sdk:"
echo "5. cd ../mosaic-sdk"
echo "6. git submodule add git@github.com:jetrich/mosaic-docs.git mosaic-docs"
echo "7. git add .gitmodules mosaic-docs"
echo "8. git commit -m '📚 Add mosaic-docs as submodule'"