#!/bin/bash
# Template Validation Script
# Ensures universal MANDATORY_STRUCTURE.md template prevents all identified anti-patterns

set -e

TEMPLATE_DIR="$HOME/.config/mosaic/templates/documentation"
TEMPLATE_FILE="$TEMPLATE_DIR/MANDATORY_STRUCTURE.md"
OVERLAYS_DIR="$TEMPLATE_DIR/overlays"

echo "🔍 Validating Universal MANDATORY_STRUCTURE.md Template"
echo "=================================================="

# Check template file exists
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    echo "❌ ERROR: Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo "✅ Template file exists: $TEMPLATE_FILE"

# Validation 1: Single Source of Truth Enforcement
echo ""
echo "🔒 Validating Single Source of Truth Enforcement..."

if grep -q "PROHIBITED LOCATIONS" "$TEMPLATE_FILE"; then
    echo "✅ Prohibited locations documented"
else
    echo "❌ ERROR: Prohibited locations not documented"
    exit 1
fi

if grep -q "CORRECT LOCATION" "$TEMPLATE_FILE"; then
    echo "✅ Correct location specified"
else
    echo "❌ ERROR: Correct location not specified"
    exit 1
fi

# Validation 2: Strong Enforcement Language
echo ""
echo "💪 Validating Strong Enforcement Language..."

STRONG_WORDS=("NEVER" "ALWAYS" "MUST" "MANDATORY")
for word in "${STRONG_WORDS[@]}"; do
    if grep -q "$word" "$TEMPLATE_FILE"; then
        echo "✅ Strong enforcement word found: $word"
    else
        echo "❌ ERROR: Strong enforcement word missing: $word"
        exit 1
    fi
done

# Validation 3: UPP Hierarchy Structure
echo ""
echo "📊 Validating UPP Hierarchy Structure..."

UPP_LEVELS=("E.XXX" "F.XXX.XX" "S.XXX.XX.XX" "T.XXX.XX.XX.XX" "ST.XXX.XX.XX.XX.XX" "A.XXX.XX.XX.XX.XX.XX")
for level in "${UPP_LEVELS[@]}"; do
    if grep -q "$level" "$TEMPLATE_FILE"; then
        echo "✅ UPP level documented: $level"
    else
        echo "❌ ERROR: UPP level missing: $level"
        exit 1
    fi
done

# Validation 4: Epic-Centric Organization
echo ""
echo "🎯 Validating Epic-Centric Organization..."

EPIC_STRUCTURE=("epics/active/" "epics/completed/" "README.md" "STATUS" "planning/" "workspace/")
for item in "${EPIC_STRUCTURE[@]}"; do
    if grep -q "$item" "$TEMPLATE_FILE"; then
        echo "✅ Epic structure element found: $item"
    else
        echo "❌ ERROR: Epic structure element missing: $item"
        exit 1
    fi
done

# Validation 5: External Session Management
echo ""
echo "🤖 Validating External Session Management..."

if grep -q "create-agent-session.sh" "$TEMPLATE_FILE"; then
    echo "✅ External session script documented"
else
    echo "❌ ERROR: External session script not documented"
    exit 1
fi

# Validation 6: Workspace Separation
echo ""
echo "🔄 Validating Workspace Separation..."

SEPARATION_RULES=("planning/" "workspace/" "UPP Directories")
for rule in "${SEPARATION_RULES[@]}"; do
    if grep -q "$rule" "$TEMPLATE_FILE"; then
        echo "✅ Workspace separation rule found: $rule"
    else
        echo "❌ ERROR: Workspace separation rule missing: $rule"
        exit 1
    fi
done

# Validation 7: Variable Substitution System
echo ""
echo "🔧 Validating Variable Substitution System..."

VARIABLES=("{{PROJECT_NAME}}" "{{PROJECT_TYPE}}" "{{GENERATION_DATE}}")
for var in "${VARIABLES[@]}"; do
    if grep -q "$var" "$TEMPLATE_FILE"; then
        echo "✅ Variable placeholder found: $var"
    else
        echo "❌ ERROR: Variable placeholder missing: $var"
        exit 1
    fi
done

# Validation 8: Anti-Pattern Prevention
echo ""
echo "🚫 Validating Anti-Pattern Prevention..."

ANTI_PATTERNS=("Multiple MANDATORY_STRUCTURE.md" "Mixed Content" "Manual Index" "Weak Enforcement")
for pattern in "${ANTI_PATTERNS[@]}"; do
    if grep -q "$pattern" "$TEMPLATE_FILE"; then
        echo "✅ Anti-pattern prevention documented: $pattern"
    else
        echo "❌ ERROR: Anti-pattern prevention missing: $pattern"
        exit 1
    fi
done

# Validation 9: Domain Overlay Support
echo ""
echo "🎭 Validating Domain Overlay Support..."

OVERLAY_PLACEHOLDERS=("{{DOMAIN_SPECIFIC_SECTIONS}}" "{{AGENT_SPECIALIZATIONS}}" "{{PROJECT_METADATA}}")
for placeholder in "${OVERLAY_PLACEHOLDERS[@]}"; do
    if grep -q "$placeholder" "$TEMPLATE_FILE"; then
        echo "✅ Domain overlay placeholder found: $placeholder"
    else
        echo "❌ ERROR: Domain overlay placeholder missing: $placeholder"
        exit 1
    fi
done

# Validation 10: Overlay Files
echo ""
echo "📋 Validating Overlay Files..."

OVERLAY_FILES=("blockchain-overlay.yaml" "healthcare-overlay.yaml" "generic-overlay.yaml")
for overlay in "${OVERLAY_FILES[@]}"; do
    if [[ -f "$OVERLAYS_DIR/$overlay" ]]; then
        echo "✅ Overlay file exists: $overlay"
    else
        echo "❌ ERROR: Overlay file missing: $overlay"
        exit 1
    fi
done

# Validation 11: Validation Commands
echo ""
echo "🔍 Validating Validation Commands..."

VALIDATION_COMMANDS=("find . -name \"MANDATORY_STRUCTURE.md\"" "grep -E" "ls docs/")
for cmd in "${VALIDATION_COMMANDS[@]}"; do
    if grep -q "$cmd" "$TEMPLATE_FILE"; then
        echo "✅ Validation command found: $cmd"
    else
        echo "❌ ERROR: Validation command missing: $cmd"
        exit 1
    fi
done

# Validation 12: BookStack Integration
echo ""
echo "📚 Validating BookStack Integration..."

BOOKSTACK_ELEMENTS=("Project = Shelf" "BookStack Shelf" "sync_configuration")
for element in "${BOOKSTACK_ELEMENTS[@]}"; do
    if grep -qi "$element" "$TEMPLATE_FILE"; then
        echo "✅ BookStack element found: $element"
    else
        echo "❌ ERROR: BookStack element missing: $element"
        exit 1
    fi
done

# Validation 13: Template Completeness
echo ""
echo "📊 Validating Template Completeness..."

REQUIRED_SECTIONS=("CRITICAL: SINGLE SOURCE" "MANDATORY PROJECT STRUCTURE" "UPP HIERARCHY RULES" "WORKSPACE SEPARATION" "AGENT SESSION MANAGEMENT" "INDEX SYSTEM" "ANTI-PATTERNS" "VALIDATION CHECKLIST")
for section in "${REQUIRED_SECTIONS[@]}"; do
    if grep -q "$section" "$TEMPLATE_FILE"; then
        echo "✅ Required section found: $section"
    else
        echo "❌ ERROR: Required section missing: $section"
        exit 1
    fi
done

# Final Statistics
echo ""
echo "📈 Template Statistics"
echo "====================="
echo "Template size: $(wc -l < "$TEMPLATE_FILE") lines"
echo "Variable placeholders: $(grep -o '{{[^}]*}}' "$TEMPLATE_FILE" | wc -l)"
echo "Strong enforcement words: $(grep -o -E '(NEVER|ALWAYS|MUST|MANDATORY)' "$TEMPLATE_FILE" | wc -l)"
echo "Validation commands: $(grep -c -E '(find|grep|ls)' "$TEMPLATE_FILE")"

echo ""
echo "🎉 Template Validation Complete!"
echo "✅ All anti-patterns prevented"
echo "✅ All requirements satisfied"
echo "✅ Template ready for deployment"

# Test variable substitution
echo ""
echo "🧪 Testing Variable Substitution..."

TEST_PROJECT="test-project"
TEST_TYPE="standalone"
TEST_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create test substitution
TEST_OUTPUT="/tmp/test-mandatory-structure.md"
sed -e "s/{{PROJECT_NAME}}/$TEST_PROJECT/g" \
    -e "s/{{PROJECT_TYPE}}/$TEST_TYPE/g" \
    -e "s/{{GENERATION_DATE}}/$TEST_DATE/g" \
    -e "s/{{DOMAIN_SPECIFIC_SECTIONS}}//g" \
    -e "s/{{AGENT_SPECIALIZATIONS}}//g" \
    -e "s/{{PROJECT_METADATA}}//g" \
    "$TEMPLATE_FILE" > "$TEST_OUTPUT"

# Check for unsubstituted variables
UNSUBSTITUTED=$(grep -o '{{[^}]*}}' "$TEST_OUTPUT" | wc -l)
if [[ $UNSUBSTITUTED -eq 0 ]]; then
    echo "✅ Variable substitution test passed"
    rm "$TEST_OUTPUT"
else
    echo "❌ ERROR: $UNSUBSTITUTED unsubstituted variables found"
    grep -o '{{[^}]*}}' "$TEST_OUTPUT" | sort | uniq
    rm "$TEST_OUTPUT"
    exit 1
fi

echo ""
echo "🚀 Universal MANDATORY_STRUCTURE.md Template Validation PASSED"
echo "Template is ready for production deployment"