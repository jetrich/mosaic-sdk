# MosAIc SDK Organizational Structure

## 🏗️ Domain Taxonomy & Hierarchy

This document defines the complete hierarchical organizational structure for the MosAIc SDK and all projects using the framework.

## 📁 Four-Domain Architecture

### **1. Documentation Domain** (`docs/`)
**Purpose**: Human-readable documentation  
**Sync Target**: BookStack (4-level hierarchy enforced)  
**Owner**: Documentation Team + All Engineers  

```
docs/
├── {shelf}/                    # Top-level organizational unit
│   ├── {book}/                # Major topic area
│   │   ├── {chapter}/         # Specific subject
│   │   │   └── {page}.md      # Individual document
```

### **2. Templates Domain** (`templates/`)
**Purpose**: Reusable scaffolding, configurations, and project starters  
**Owner**: Platform Engineering Team  
**Inheritance**: Supports template composition and DRY patterns  

```
templates/
├── infrastructure/             # Infrastructure components
│   ├── database/              # Database configurations
│   ├── networking/            # Network setup
│   └── monitoring/            # Monitoring stack
├── development/               # Development templates  
│   ├── ci-cd/                # CI/CD pipelines
│   ├── containers/           # Docker/K8s templates
│   └── projects/             # Project scaffolding
├── configuration/             # Configuration templates
│   ├── environment/          # Environment configs
│   ├── application/          # App configurations
│   └── security/             # Security configs
└── documentation/             # Documentation templates
    ├── project-docs/         # Standard project docs
    ├── technical-specs/      # Technical specifications
    └── operational/          # Operational documentation
```

### **3. Scripts Domain** (`scripts/`)
**Purpose**: Automation, utilities, and operational tasks  
**Owner**: DevOps + Platform Engineering Teams  
**Execution**: All scripts must be executable and documented  

```
scripts/
├── infrastructure/            # Infrastructure automation
│   ├── database/             # Database operations
│   ├── networking/           # Network management
│   └── monitoring/           # Monitoring setup
├── deployment/               # Deployment automation
│   ├── platform/             # Platform deployment
│   ├── services/             # Service deployment
│   └── environments/        # Environment management
├── development/              # Development utilities
│   ├── project-management/   # Project utilities
│   ├── code-quality/         # Quality tools
│   └── testing/              # Testing utilities
├── operations/               # Operational scripts
│   ├── maintenance/          # Maintenance tasks
│   ├── backup/               # Backup operations
│   └── monitoring/           # Monitoring scripts
└── utilities/                # General utilities
    ├── data-migration/       # Data migration
    ├── documentation/        # Doc utilities
    └── security/             # Security utilities
```

### **4. Configuration Domain** (`conf/`)
**Purpose**: System and application configuration management  
**Owner**: Infrastructure + Security Teams  
**Security**: All configurations require security review  

```
conf/
├── infrastructure/           # Infrastructure configuration
│   ├── database/            # Database configs
│   ├── networking/          # Network configs
│   └── monitoring/          # Monitoring configs
├── platform/                # Platform configuration
│   ├── services/            # Service configs
│   ├── security/            # Security configs
│   └── integration/         # Integration configs
├── development/             # Development configuration
│   ├── toolchain/           # Dev toolchain
│   ├── testing/             # Testing configs
│   └── ci-cd/               # CI/CD configs
└── agents/                  # Agent configuration
    ├── behaviors/           # Agent behavior rules
    ├── templates/           # Agent templates
    └── validation/          # Validation schemas
```

## 🎯 Domain Ownership Rules

### **Documentation Domain** (`docs/`)
- **Content**: Human-readable documentation only
- **Format**: Markdown with YAML frontmatter
- **Structure**: Strict 4-level BookStack hierarchy
- **Restrictions**: No operational files (scripts, configs, templates)
- **Sync**: Automatically synchronized to BookStack

### **Templates Domain** (`templates/`)
- **Content**: Reusable templates, scaffolding, boilerplate
- **Format**: Any format (.yml, .json, .md, .sh, .conf, etc.)
- **Versioning**: Templates should be versioned and documented
- **Inheritance**: Support composition patterns for DRY compliance
- **Testing**: All templates must be testable

### **Scripts Domain** (`scripts/`)
- **Content**: Executable automation and utility scripts
- **Format**: Shell scripts, Python, JavaScript, etc.
- **Permissions**: Must be executable (`chmod +x`)
- **Documentation**: Each script requires header documentation
- **Security**: Security scanning required for all scripts

### **Configuration Domain** (`conf/`)
- **Content**: System and application configurations
- **Format**: Config files (.conf, .yaml, .json, .env, etc.)
- **Security**: Security review required for all changes
- **Environment**: Separate configs for different environments
- **Validation**: Configuration validation schemas required

## 🔍 Subdomain Patterns

### **Two-Level Subdomain Structure**
```
{domain}/{primary-subdomain}/{secondary-subdomain}/
```

### **Examples**
- `templates/infrastructure/database/` - Infrastructure database templates
- `scripts/deployment/platform/` - Platform deployment scripts  
- `conf/security/authentication/` - Security authentication configs
- `docs/engineering/api-documentation/` - Engineering API documentation

## 🚨 Enforcement Rules

### **File Placement Rules**
1. **Operational files** → `templates/`, `scripts/`, or `conf/`
2. **Documentation** → `docs/` only
3. **Cross-domain references** → Use relative paths
4. **No orphaned files** → Every file must have a clear domain owner

### **Naming Conventions**
- **Directories**: kebab-case (`api-documentation`, `ci-cd`)
- **Files**: kebab-case with appropriate extensions
- **Templates**: `.template.ext` suffix where applicable
- **Scripts**: descriptive names with action verbs

### **Agent Compliance**
- All agents must follow this structure
- No exceptions without explicit approval
- Structure validation runs in CI/CD
- Violations block merges

## 🎯 Benefits

### **Scalability**
- Clear growth patterns for any domain
- Consistent organization across all projects
- Easy to extend with new subdomains

### **Maintainability**
- Clear ownership boundaries
- Easy content discovery
- Reduced cognitive load

### **Professional Quality**
- Enterprise-grade organization
- Industry-standard practices
- Clear separation of concerns

### **Agent Compliance**
- Unambiguous placement rules
- Automated enforcement
- Clear escalation paths

This organizational structure establishes the foundation for professional, scalable, and maintainable project organization across the entire MosAIc ecosystem.