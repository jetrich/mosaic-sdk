# File Structure Cleanup Plan

## Current Confusing Structure
```
/CLAUDE.md                          # Project-specific (current project)
/claude-instructions/CLAUDE.md      # Old monolithic user instructions  
/claude-instructions/TONY-SETUP.md # Old setup instructions
/modular-components/*.md            # New modular components
/README.md + /README-v2.md         # Duplicate READMEs
```

## Proposed Clean Structure
```
# Installation & Setup
/install-modular.sh                # Main installation script
/quick-setup.sh                    # One-command setup

# Framework Components (Source)
/framework/
├── TONY-CORE.md                   # Central coordination logic
├── TONY-TRIGGERS.md               # Natural language detection  
├── TONY-SETUP.md                  # Project deployment automation
├── AGENT-BEST-PRACTICES.md        # Agent coordination standards
└── DEVELOPMENT-GUIDELINES.md      # Universal development standards

# Documentation
/docs/
├── installation/
│   ├── INSTALLATION.md            # Updated installation guide
│   └── MIGRATION-GUIDE.md         # v1 to v2 migration
├── architecture/
│   ├── MODULAR-DESIGN.md          # Architecture documentation
│   └── IMPORT-MECHANISM.md        # Component loading design
└── legacy/                        # Archive old docs
    ├── monolithic-CLAUDE.md       # Archived v1 instructions
    └── monolithic-TONY-SETUP.md   # Archived v1 setup

# Project Management (This project's own files)
/CLAUDE.md                         # This project's instructions (clear purpose)
/README.md                         # Single, clear README
/VERSION                           # Framework version

# Utilities
/scripts/
├── verify-installation.sh         # Installation verification
└── migrate-from-v1.sh             # Migration utility

# Legacy (Archive)
/legacy/                           # Old structure for reference
├── claude-instructions/           # Move old files here
└── v1-templates/                  # Old templates
```

## Actions Required
1. Move `/modular-components/*.md` → `/framework/`
2. Archive `/claude-instructions/` → `/legacy/claude-instructions/`
3. Consolidate `/README.md` and `/README-v2.md` → Single `/README.md`
4. Update `/install-modular.sh` to reference `/framework/` path
5. Create clear `/docs/` structure
6. Archive old files in `/legacy/`