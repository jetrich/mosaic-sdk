# Tony Framework Bootstrap Environment

Conversion tools, installation scripts, and polyrepo migration utilities for Tony Framework deployment and legacy compatibility.

## 📦 Contents

### Installation Tools (`installation/`)
- **`install-modular.sh`** - Modular Tony Framework installation
- **`quick-setup.sh`** - Quick development environment setup  
- **`deploy-to-project.sh`** - Project-specific Tony deployment

### Legacy Components (`legacy/`)
- **`framework/`** - Legacy v1.x framework components
- **`legacy/`** - Historical framework versions and compatibility layers

### Conversion Utilities (`conversion/`)
- **`infrastructure/`** - Infrastructure deployment components
- **`scripts/`** - Polyrepo conversion and automation scripts
- **`security/`** - Security framework components
- **`logs/`** - Migration and deployment logs
- **`test-evidence/`** - Validation and testing evidence

## 🚀 Quick Start

### Install Tony Framework
```bash
# Modular installation (recommended)
./installation/install-modular.sh

# Quick development setup
./installation/quick-setup.sh

# Deploy to specific project
./installation/deploy-to-project.sh /path/to/project
```

### Legacy Support
```bash
# Access legacy v1.x components
cd legacy/framework/

# Legacy compatibility layer
./legacy/compatibility-bridge.sh
```

### Conversion Tools
```bash
# Polyrepo conversion
./conversion/scripts/convert-to-polyrepo.sh

# Infrastructure deployment
./conversion/infrastructure/deploy-infrastructure.sh

# Security framework setup
./conversion/security/setup-security-framework.sh
```

## 🔧 Installation Scripts

### Modular Installation (`install-modular.sh`)
Safe, non-destructive installation of Tony Framework components:

**Features:**
- Preserves existing Claude configurations
- Modular component loading
- Complete rollback capability
- Version management
- User content protection

**Usage:**
```bash
./install-modular.sh [--dry-run] [--verbose] [--backup-only]
```

### Quick Setup (`quick-setup.sh`)
Rapid development environment configuration:

**Features:**
- Development dependencies
- Tool verification
- Environment validation
- Configuration templates

**Usage:**
```bash
./quick-setup.sh [--dev] [--minimal] [--verify-only]
```

### Project Deployment (`deploy-to-project.sh`)
Project-specific Tony infrastructure deployment:

**Features:**
- Project detection
- Custom configuration
- Repository integration
- Team collaboration setup

**Usage:**
```bash
./deploy-to-project.sh /path/to/project [--team] [--config-file]
```

## 🔄 Legacy Support

### Framework v1.x Compatibility
The legacy framework components provide backward compatibility:

- **Component Bridge**: Interface between v1.x and v2.x
- **Migration Path**: Step-by-step upgrade procedures
- **Configuration Conversion**: Automatic config migration
- **Feature Mapping**: v1.x to v2.x feature correspondence

### Legacy Component Structure
```
legacy/
├── framework/           # v1.x framework components
│   ├── core/           # Legacy core functionality
│   ├── scripts/        # v1.x automation scripts
│   └── templates/      # Legacy templates
└── compatibility/      # Bridge components
    ├── api-bridge.js   # API compatibility layer
    ├── config-mapper.js # Configuration migration
    └── feature-bridge.js # Feature compatibility
```

## 🚀 Conversion Utilities

### Infrastructure Components (`conversion/infrastructure/`)
Complete infrastructure deployment for polyrepo architecture:

- **Backup/Recovery**: Automated backup and disaster recovery
- **Performance/Security**: Performance optimization and security hardening
- **Monitoring**: Comprehensive monitoring and alerting
- **GitHub Actions**: CI/CD pipeline automation

### Security Framework (`conversion/security/`)
Enterprise-grade security components:

- **Access Control**: Role-based access control systems
- **Vulnerability Management**: Automated security scanning
- **Compliance Reporting**: SOC2, PCI, GDPR compliance
- **Audit Logging**: Comprehensive audit trail

### Migration Scripts (`conversion/scripts/`)
Polyrepo conversion and automation:

- **Repository Separation**: Monorepo to polyrepo conversion
- **Dependency Management**: Cross-repo dependency handling
- **Workflow Migration**: CI/CD workflow adaptation
- **Team Coordination**: Multi-repo team management

## 📊 Migration Evidence (`conversion/test-evidence/`)

### Validation Reports
- **Phase 1**: Initial migration validation
- **QA Reports**: Quality assurance validation
- **Security Audits**: Security framework validation
- **Performance Tests**: Load and stress test results

### Evidence Structure
```
test-evidence/
├── phase-1/            # Phase 1 migration evidence
│   ├── backend-audit/  # Backend component validation
│   ├── docker-migration/ # Container migration evidence
│   └── qa-report/      # Quality assurance reports
├── recovery/           # Disaster recovery testing
└── red-phase/         # Security testing evidence
```

## 🛠️ Advanced Usage

### Custom Installation
```bash
# Custom component selection
./install-modular.sh --components="core,plugins,security"

# Custom installation path
./install-modular.sh --install-path="/opt/tony"

# Team-specific configuration
./install-modular.sh --team-config="./team-config.json"
```

### Migration Automation
```bash
# Automated polyrepo conversion
./conversion/scripts/automated-migration.sh --source=/path/to/monorepo

# Infrastructure as Code deployment
./conversion/infrastructure/deploy-iac.sh --environment=production

# Security hardening automation
./conversion/security/harden-deployment.sh --level=enterprise
```

### Legacy Migration
```bash
# v1.x to v2.x migration
./legacy/migrate-v1-to-v2.sh --source=/path/to/v1-installation

# Configuration migration
./legacy/migrate-config.sh --v1-config=/path/to/v1-config

# Feature compatibility check
./legacy/check-compatibility.sh --features="agent-spawning,context-management"
```

## 🆘 Troubleshooting

### Installation Issues
```bash
# Installation diagnostics
./installation/diagnose-installation.sh

# Rollback installation
./installation/rollback-installation.sh

# Repair installation
./installation/repair-installation.sh
```

### Migration Problems
```bash
# Migration diagnostics
./conversion/scripts/diagnose-migration.sh

# Rollback migration
./conversion/scripts/rollback-migration.sh

# Validate migration
./conversion/scripts/validate-migration.sh
```

### Legacy Compatibility
```bash
# Compatibility diagnostics
./legacy/diagnose-compatibility.sh

# Bridge repair
./legacy/repair-bridge.sh

# Version mapping
./legacy/map-versions.sh
```

## 📚 Documentation

- **[Installation Guide](docs/installation-guide.md)** - Detailed installation procedures
- **[Migration Guide](docs/migration-guide.md)** - Polyrepo migration procedures
- **[Legacy Guide](docs/legacy-support.md)** - Legacy framework support
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

---

**Tony Framework Bootstrap Environment** - Seamless deployment, migration, and legacy support.