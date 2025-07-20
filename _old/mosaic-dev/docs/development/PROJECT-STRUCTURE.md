# Tony Framework v2.0 - Clean Project Structure

## 📁 Repository Structure (Post-Cleanup)

```
tech-lead-tony/                         # Repository root
├── CLAUDE.md                           # THIS PROJECT's development instructions
├── README.md                           # Main user documentation
├── PROJECT-STRUCTURE.md                # This file - structure explanation
├── VERSION                             # Framework version
├── LICENSE                             # MIT license
├── CHANGELOG.md                        # Version history
├── EXAMPLES.md                         # Usage examples
│
├── install-modular.sh                  # Main installation script
├── quick-setup.sh                      # One-command setup
│
├── framework/                          # Tony framework components (source)
│   ├── TONY-CORE.md                    # Central coordination logic
│   ├── TONY-TRIGGERS.md                # Natural language detection
│   ├── TONY-SETUP.md                   # Project deployment automation
│   ├── AGENT-BEST-PRACTICES.md         # Agent coordination standards
│   └── DEVELOPMENT-GUIDELINES.md       # Universal development standards
│
├── docs/                               # Documentation
│   ├── installation/
│   │   ├── INSTALLATION.md             # Installation guide
│   │   └── MIGRATION-GUIDE.md          # v1 to v2 migration
│   ├── architecture/
│   │   ├── MODULAR-ARCHITECTURE-DESIGN.md  # Architecture docs
│   │   └── IMPORT-MECHANISM-DESIGN.md      # Component loading design
│   └── legacy/                         # Archived analysis docs
│       └── STRUCTURE-ANALYSIS.md       # Original structure analysis
│
├── scripts/                            # Utility scripts
│   └── verify-installation.sh          # Installation verification
│
├── legacy/                             # Archived v1 files (for reference)
│   ├── README-v1.md                    # Original README
│   ├── claude-instructions/            # Original monolithic structure
│   │   ├── CLAUDE.md                   # v1 monolithic user instructions
│   │   └── TONY-SETUP.md               # v1 setup instructions
│   └── v1-templates/                   # Original template structure
│
├── templates/                          # Project templates
│   └── tony/                           # Legacy Tony templates
│
└── agent-best-practices/               # Legacy best practices docs
    ├── AGENT-DEPLOYMENT-GUIDE.md
    ├── CRISIS-MANAGEMENT-PROTOCOLS.md
    └── RESEARCH-DRIVEN-DEVELOPMENT.md
```

## 🎯 File Purpose Clarity

### User-Facing Files
- **`README.md`**: Primary user documentation for installation and usage
- **`install-modular.sh`**: Main installation script (references `./framework/`)
- **`quick-setup.sh`**: One-command setup script
- **`framework/*.md`**: Source components deployed to user systems

### Project Development Files  
- **`CLAUDE.md`**: Development instructions for the Tony framework project itself
- **`PROJECT-STRUCTURE.md`**: This file explaining repository organization
- **`docs/`**: Technical documentation and architecture guides

### Legacy/Archive Files
- **`legacy/claude-instructions/CLAUDE.md`**: Archived v1 monolithic user instructions
- **`legacy/`**: All old v1 files preserved for reference and migration testing

## 🔄 Installation Flow

### User Experience
```bash
# User clones repository
git clone https://github.com/your-org/tech-lead-tony.git
cd tech-lead-tony

# User runs setup (deploys framework/ components to ~/.claude/tony/)
./quick-setup.sh

# User uses Tony in any project
cd any-project
# "Hey Tony" → loads from ~/.claude/tony/TONY-CORE.md
```

### Installation Process
```bash
# Script reads from:
./framework/TONY-CORE.md
./framework/TONY-TRIGGERS.md  
./framework/TONY-SETUP.md
./framework/AGENT-BEST-PRACTICES.md
./framework/DEVELOPMENT-GUIDELINES.md

# Script deploys to:
~/.claude/tony/TONY-CORE.md
~/.claude/tony/TONY-TRIGGERS.md
~/.claude/tony/TONY-SETUP.md
~/.claude/tony/AGENT-BEST-PRACTICES.md
~/.claude/tony/DEVELOPMENT-GUIDELINES.md

# Script augments (safely):
~/.claude/CLAUDE.md  # User's file + Tony integration section
```

## ✅ Confusion Resolution

### Before Cleanup (Confusing)
- Multiple `CLAUDE.md` files with unclear purposes
- `claude-instructions/` and `modular-components/` scattered structure
- Unclear which files were source vs. deployed components

### After Cleanup (Clear)
- **Single `README.md`**: Main user documentation
- **Clear `./framework/`**: Source components for deployment
- **Labeled `./CLAUDE.md`**: Project development instructions only
- **Archived `./legacy/`**: Old files preserved but clearly marked
- **Logical `./docs/`**: Technical documentation organized by topic

## 🛡️ Safety Features

### No User Confusion
- Users only interact with `install-modular.sh` and `quick-setup.sh`
- Clear documentation points to correct installation method
- User's `~/.claude/CLAUDE.md` is safely augmented, never overwritten

### Development Clarity  
- Repository developers work with clearly labeled files
- Installation script references clear `./framework/` directory
- Legacy files preserved in `./legacy/` for migration testing

### Version Management
- Framework components have independent versioning
- User content completely isolated from framework updates
- Complete rollback capability preserves user configurations

---

**Structure Status**: ✅ Clean, logical, user-friendly  
**Confusion Level**: Zero - all files have clear purposes  
**Safety Level**: Maximum - complete user content protection  
**Maintenance**: Simplified with clear component boundaries