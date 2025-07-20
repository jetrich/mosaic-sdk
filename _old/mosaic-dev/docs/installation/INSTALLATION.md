# Tech Lead Tony v2.0 - Installation Guide

## 🚀 Quick Installation (2 Minutes)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/tech-lead-tony.git
cd tech-lead-tony
```

### Step 2: Run Installation 
```bash
# Option A: One-command setup
./quick-setup.sh

# Option B: Manual installation  
./install-modular.sh
```

### Step 3: Use in Any Project
```bash
cd your-project-directory
# Start Claude session and say:
"Hey Tony, deploy infrastructure for this project"
```

## 📋 Installation Process

### What Gets Installed
- **Framework Components**: Deployed to `~/.claude/tony/`
- **User Integration**: Safe augmentation of `~/.claude/CLAUDE.md`
- **Verification Tools**: Installation and rollback utilities
- **Documentation**: Complete audit trail and version tracking

### Installation Safety
- ✅ **Never overwrites** existing user content
- ✅ **Complete backup** of original files
- ✅ **Full rollback** capability 
- ✅ **Non-destructive** augmentation process

### File Structure After Installation
```
~/.claude/
├── CLAUDE.md                           # Your content + Tony integration
└── tony/                               # Tony framework (modular)
    ├── TONY-CORE.md                    # Central coordination logic
    ├── TONY-TRIGGERS.md                # Natural language detection
    ├── TONY-SETUP.md                   # Project deployment automation
    ├── AGENT-BEST-PRACTICES.md         # Agent coordination standards
    ├── DEVELOPMENT-GUIDELINES.md       # Universal development standards
    ├── metadata/
    │   ├── VERSION                     # Framework version tracking
    │   ├── INSTALL-LOG.md              # Installation audit log
    │   └── USER-BACKUP-{timestamp}.md  # Original CLAUDE.md backup
    ├── verify-modular-installation.sh  # Verification utility
    └── rollback-installation.sh        # Complete rollback utility
```

## 🔧 Management Commands

### Verify Installation
```bash
~/.claude/tony/verify-modular-installation.sh
```

### Complete Rollback
```bash
~/.claude/tony/rollback-installation.sh
```

### Check Framework Status
```bash
cat ~/.claude/tony/metadata/VERSION
```

### View Installation Logs
```bash
cat ~/.claude/tony/metadata/INSTALL-LOG.md
```

### Re-run Installation (Safe)
```bash
cd tech-lead-tony
./quick-setup.sh  # Non-destructive - safe to re-run
```

## 🆘 Troubleshooting

### Installation Fails
```bash
# Check logs
cat ~/.claude/tony/metadata/INSTALL-LOG.md

# Re-run (safe)
./install-modular.sh
```

### Tony Not Responding
```bash
# Verify installation
~/.claude/tony/verify-modular-installation.sh

# Check triggers
grep -A5 "Hey Tony" ~/.claude/tony/TONY-TRIGGERS.md
```

### Complete Removal
```bash
# Remove all Tony components
~/.claude/tony/rollback-installation.sh
```

---

**Installation Status**: Ready for immediate use  
**Risk Level**: Zero - completely safe and reversible  
**Compatibility**: Universal - works with any project type