# Variable Substitution Documentation

**Template**: MANDATORY_STRUCTURE.md Universal Template  
**Version**: 1.0.0  
**Purpose**: Project-specific customization system

## 🔧 Core Variables

### Required Variables (MUST be provided)

| Variable | Description | Example | Usage |
|----------|-------------|---------|-------|
| `{{PROJECT_NAME}}` | Project identifier | `mosaic-sdk` | Path construction, shelf naming |
| `{{PROJECT_TYPE}}` | Project category | `mono-repo`, `standalone`, `submodule` | Domain overlay selection |
| `{{GENERATION_DATE}}` | Template generation timestamp | `2025-01-27T10:30:00Z` | Audit trail |

### Optional Variables (Default if not provided)

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `{{AGENT_PREFIX}}` | Project-specific agent prefix | `""` (generic) | Agent naming customization |

## 🎯 Domain-Specific Variables

### Blockchain Projects

| Variable | Description | Example |
|----------|-------------|---------|
| `{{BLOCKCHAIN_NETWORKS}}` | Supported networks | `Ethereum, Polygon, BSC` |
| `{{SMART_CONTRACTS}}` | Contract addresses | `0x123...abc` |
| `{{GAS_OPTIMIZATION}}` | Gas optimization required | `true/false` |

### Healthcare Projects

| Variable | Description | Example |
|----------|-------------|---------|
| `{{HIPAA_COMPLIANCE}}` | HIPAA compliance required | `true/false` |
| `{{PATIENT_DATA}}` | Patient data involved | `true/false` |
| `{{AUDIT_REQUIREMENTS}}` | Audit trail requirements | `FDA, HIPAA, SOX` |

### Generic Projects

| Variable | Description | Example |
|----------|-------------|---------|
| `{{COMPLIANCE_FRAMEWORKS}}` | Applicable frameworks | `SOC2, ISO27001` |
| `{{SECURITY_LEVEL}}` | Security classification | `public, internal, confidential` |

## 🔄 Substitution Process

### 1. Template Loading
```bash
# Load base template
TEMPLATE=$(cat ~/.config/mosaic/templates/documentation/MANDATORY_STRUCTURE.md)
```

### 2. Variable Replacement
```bash
# Core variables (required)
TEMPLATE=${TEMPLATE//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}
TEMPLATE=${TEMPLATE//\{\{PROJECT_TYPE\}\}/$PROJECT_TYPE}
TEMPLATE=${TEMPLATE//\{\{GENERATION_DATE\}\}/$GENERATION_DATE}

# Optional variables
TEMPLATE=${TEMPLATE//\{\{AGENT_PREFIX\}\}/$AGENT_PREFIX}
```

### 3. Domain Overlay Injection
```bash
# Replace domain-specific sections
TEMPLATE=${TEMPLATE//\{\{DOMAIN_SPECIFIC_SECTIONS\}\}/$DOMAIN_SECTIONS}
TEMPLATE=${TEMPLATE//\{\{AGENT_SPECIALIZATIONS\}\}/$AGENT_SPECS}
TEMPLATE=${TEMPLATE//\{\{PROJECT_METADATA\}\}/$PROJECT_META}
```

## 📋 Domain Overlay Definitions

### Blockchain Overlay
```markdown
## 🔗 BLOCKCHAIN CONSIDERATIONS (MANDATORY)

### Smart Contract Integration
- **Networks**: {{BLOCKCHAIN_NETWORKS}}
- **Gas Optimization**: {{GAS_OPTIMIZATION}}
- **Security Audits**: Required for all contract changes
- **Multi-chain Support**: {{MULTI_CHAIN_SUPPORT}}

### Epic Template Additions
All epics MUST include:
```yaml
blockchain:
  networks: [{{BLOCKCHAIN_NETWORKS}}]
  gas_optimization: {{GAS_OPTIMIZATION}}
  security_audit: required
  contracts_affected: []
```

### Atomic Task Requirements
- [ ] Smart contract impact assessed
- [ ] Gas optimization considered
- [ ] Security implications reviewed
- [ ] Multi-chain compatibility verified

### Specialized Agents
- **BLOCKCHAIN-DEVELOPER**: Smart contract development
- **SECURITY-AUDITOR**: Blockchain security analysis
- **GAS-OPTIMIZER**: Transaction cost optimization
```

### Healthcare Overlay
```markdown
## 🏥 HEALTHCARE COMPLIANCE (MANDATORY)

### Regulatory Requirements
- **HIPAA Compliance**: {{HIPAA_COMPLIANCE}}
- **Patient Data**: {{PATIENT_DATA}}
- **Audit Requirements**: {{AUDIT_REQUIREMENTS}}
- **Data Classification**: PHI, PII, Public

### Epic Template Additions
All epics MUST include:
```yaml
healthcare:
  hipaa_applicable: {{HIPAA_COMPLIANCE}}
  patient_data: {{PATIENT_DATA}}
  audit_trail: required
  data_classification: []
```

### Atomic Task Requirements
- [ ] HIPAA implications assessed
- [ ] Patient data protection verified
- [ ] Audit trail requirements met
- [ ] Data classification confirmed

### Specialized Agents
- **HEALTHCARE-COMPLIANCE**: Regulatory compliance
- **HIPAA-SPECIALIST**: HIPAA-specific requirements
- **AUDIT-SPECIALIST**: Audit trail management
```

### Generic Overlay
```markdown
## 🔧 PROJECT CONFIGURATION

### Standard Requirements
- **Security Level**: {{SECURITY_LEVEL}}
- **Compliance Frameworks**: {{COMPLIANCE_FRAMEWORKS}}
- **Data Classification**: {{DATA_CLASSIFICATION}}

### Epic Template Additions
All epics MUST include:
```yaml
project:
  security_level: {{SECURITY_LEVEL}}
  compliance: [{{COMPLIANCE_FRAMEWORKS}}]
  data_classification: {{DATA_CLASSIFICATION}}
```

### Standard Agents
- Use universal personas only
- No domain-specific specializations
```

## 🛠️ Generation Commands

### Manual Generation
```bash
# Set variables
export PROJECT_NAME="my-project"
export PROJECT_TYPE="standalone"
export GENERATION_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate template
mosaic template generate \
  --template mandatory-structure \
  --project "$PROJECT_NAME" \
  --type "$PROJECT_TYPE" \
  --output "docs/$PROJECT_NAME/task-management/MANDATORY_STRUCTURE.md"
```

### Automated Generation
```bash
# From project configuration
mosaic template generate --from-config .mosaic/project.yaml

# Interactive mode
mosaic template generate --interactive
```

## 🔍 Validation

### Variable Completeness Check
```bash
# Check for unsubstituted variables
grep -E '\{\{[A-Z_]+\}\}' generated-file.md
# Should return empty (all variables substituted)
```

### Domain Overlay Validation
```bash
# Verify domain sections exist
grep -E "## 🔗|## 🏥|## 🔧" generated-file.md

# Check agent specializations
grep -E "BLOCKCHAIN-|HEALTHCARE-|HIPAA-" generated-file.md
```

## 📊 Template Metrics

### Substitution Success Rate
- **Target**: 100% variable substitution
- **Validation**: No `{{}}` patterns in output
- **Monitoring**: Automated checks in generation pipeline

### Domain Coverage
- **Blockchain**: Smart contracts, gas optimization, security
- **Healthcare**: HIPAA, patient data, audit trails
- **Generic**: Standard compliance, security levels

### Template Consistency
- **Structure**: Identical base structure across all projects
- **Enforcement**: Same NEVER/ALWAYS/MUST language
- **Validation**: Consistent validation commands

## 🚨 Error Handling

### Missing Required Variables
```bash
if [[ -z "$PROJECT_NAME" ]]; then
    echo "❌ ERROR: PROJECT_NAME is required"
    exit 1
fi
```

### Invalid Project Types
```bash
VALID_TYPES=("standalone" "submodule" "mono-repo")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${PROJECT_TYPE} " ]]; then
    echo "❌ ERROR: Invalid PROJECT_TYPE: $PROJECT_TYPE"
    echo "Valid types: ${VALID_TYPES[*]}"
    exit 1
fi
```

### Template Corruption
```bash
# Verify template integrity
if ! grep -q "MANDATORY_STRUCTURE.md" "$TEMPLATE_FILE"; then
    echo "❌ ERROR: Template file corrupted"
    exit 1
fi
```

## 📝 Usage Examples

### Standalone Project
```bash
PROJECT_NAME="my-app"
PROJECT_TYPE="standalone"
DOMAIN_TYPE="generic"
```

### Mono-repo Submodule
```bash
PROJECT_NAME="payment-service"
PROJECT_TYPE="submodule"
DOMAIN_TYPE="blockchain"
BLOCKCHAIN_NETWORKS="Ethereum,Polygon"
```

### Healthcare Application
```bash
PROJECT_NAME="patient-portal"
PROJECT_TYPE="standalone"
DOMAIN_TYPE="healthcare"
HIPAA_COMPLIANCE="true"
PATIENT_DATA="true"
```

This variable substitution system ensures consistent, project-specific customization while maintaining universal structure compliance.