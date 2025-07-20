# Tony Framework CLI Commands

**Complete command reference for Tony Framework v2.7.0+**

> 📋 **Quick Reference**: Run `tony` to see all available commands, or `tony <command> --help` for command-specific help.

## Command Coordinator

The Tony framework uses a central coordinator that auto-discovers all available commands and provides a unified interface.

### Getting Started

```bash
# Show all available commands
tony

# Get help for any command
tony --help
tony <command> --help

# Install tab completion (recommended)
tony --install-completion

# List commands only
tony --list
```

## Core Commands

### Planning & Project Management

#### `tony plan` - Multi-Phase Project Planning
```bash
# Initialize new planning session
tony plan init --project "My Project" --methodology iterative

# Execute planning phases
tony plan phase1          # Abstraction and Epic Definition
tony plan phase2          # Decomposition and Task Breakdown
tony plan phase3          # Optimization and Critical Path Analysis
tony plan phase4          # Certification and Final Validation

# Monitor progress
tony plan status          # Show current planning session status
tony plan report          # Generate comprehensive planning report

# Cleanup
tony plan clean           # Clean planning workspace
```

**UPP Methodology Support:**
- Epic → Feature → Story → Task → Subtask → Atomic task decomposition
- Automated dependency mapping and critical path analysis
- Resource optimization and timeline estimation
- Quality gates and certification validation

### System Health & Maintenance

#### `tony status` - System Health Check
```bash
tony status               # Quick health check and system overview
```

Shows:
- Framework installation status
- Component health (5/5 components)
- Integration status with Claude
- Quick action recommendations

#### `tony migrate` - Framework Migration
```bash
tony migrate              # Run migration operations
tony migrate --help       # See migration options
```

Handles:
- Version upgrades and framework updates
- Configuration migration between versions
- Data integrity and corruption repair
- Innovation preservation during updates

### Development Operations

#### `tony upgrade` - Framework Updates
```bash
tony upgrade              # Update Tony framework
tony upgrade-v25          # Specific version upgrade
tony force-upgrade        # Force upgrade (advanced)
```

#### `tony restructure` - Project Restructuring
```bash
tony restructure          # Reorganize project structure
```

### Quality Assurance

#### `tony qa` - Quality Assurance
```bash
# Comprehensive QA analysis
tony qa --comprehensive --generate-report

# Quick quality check
tony qa --quick

# Specific analysis types
tony qa --code-quality         # Code quality analysis only
tony qa --test-coverage        # Test coverage analysis only
tony qa --dependencies         # Dependency audit only
tony qa --documentation        # Documentation review only

# Output options
tony qa --verbose              # Enable verbose output
tony qa --generate-report      # Generate detailed QA report
```

**QA Coverage:**
- Code quality analysis and style checking
- Test coverage measurement and gaps identification
- Dependency security auditing
- Documentation completeness review
- Performance and optimization recommendations

### Security & Compliance

#### `tony security` - Security Operations
```bash
tony security             # Run security audit
tony audit               # Comprehensive audit script
tony red-team            # Red team assessment
tony secrets             # Secrets management
```

### Development Infrastructure

#### `tony docker` - Docker Management
```bash
tony docker              # Docker management and operations
```

#### `tony git` - Git Workflow Management
```bash
tony git                 # Enhanced git workflow management
```

#### `tony cicd` - CI/CD Pipeline Management
```bash
tony cicd                # CI/CD pipeline management and integration
```

### Task Management

#### `tony tasks` - ATHMS (Automated Task Hierarchy Management System)
```bash
tony tasks               # Automated task hierarchy management
```

Features:
- Physical task folders in filesystem
- Evidence-based completion validation
- 100-point scoring system
- Automatic dependency resolution
- State backup/restore capabilities

### System Tools

#### `tony install` - Installation Management
```bash
tony install             # Install or reinstall Tony framework
```

#### `tony verify` - Installation Verification
```bash
tony verify              # Verify Tony installation integrity
```

#### `tony dashboard` - System Dashboard
```bash
tony dashboard           # Launch comprehensive system health dashboard
```

## Command Aliases

For faster access to commonly used commands, Tony provides convenient aliases:

```bash
# Instead of 'tony qa'
qa --comprehensive

# Instead of 'tony plan'  
plan init --project "My Project"
plan phase1

# Tab completion works with aliases too
qa <TAB>                 # Shows qa command options
plan <TAB>               # Shows plan subcommands
```

## Tab Completion

Tony includes comprehensive bash tab completion for enhanced productivity:

### Setup (One-time)
```bash
# Install completion
tony --install-completion

# Restart shell or source manually
source ~/.local/share/bash-completion/completions/tony
```

### Usage
```bash
tony <TAB>               # Complete main commands
tony plan <TAB>          # Complete plan subcommands  
tony qa --<TAB>          # Complete qa options
tony help <TAB>          # Complete help topics
```

**Supported Completions:**
- All discovered Tony commands
- Subcommands (e.g., plan phases, qa options)
- Global options (--help, --version, --list)
- Context-aware completion for different commands

## Advanced Usage Patterns

### Command Chaining
```bash
# Execute multiple planning phases
tony plan phase1 && tony plan phase2 && tony plan phase3

# QA with multiple analysis types
tony qa --code-quality && tony qa --test-coverage
```

### Integration with Other Tools
```bash
# Combine with git workflow
git checkout -b feature/new-feature
tony plan init --project "New Feature"
tony qa --comprehensive

# CI/CD integration
tony cicd && tony qa --comprehensive && git push
```

### Development Workflow
```bash
# Typical development session
tony status              # Check system health
tony plan init           # Start planning
tony plan phase1         # Define epics
tony plan phase2         # Break down tasks
# ... development work ...
tony qa --comprehensive  # Quality check
tony upgrade             # Stay current
```

## Command Discovery

Tony automatically discovers commands by scanning for `tony-*.sh` scripts in:

- `/tony/scripts/` (local scripts - highest priority)
- `/tony-dev/bootstrap/conversion/scripts/` (distributed scripts)

**Adding New Commands:**
1. Create a new `tony-<command>.sh` script
2. Make it executable (`chmod +x`)
3. Place it in one of the discovery directories
4. It will automatically appear in `tony --list`

## Error Handling

### Unknown Commands
```bash
tony unknown-command
# Error: Unknown command 'unknown-command'
# Available commands: [lists all commands]
# Run 'tony --help' for more information.
```

### Command-Specific Help
```bash
# Get help for any command
tony <command> --help

# Examples
tony plan --help         # Planning system help
tony qa --help           # QA options and usage
tony status --help       # Status command help
```

### Troubleshooting
```bash
# Verify installation
tony status              # Quick health check
tony verify              # Comprehensive verification

# Fix common issues
tony migrate             # Fix version compatibility
tony force-upgrade       # Force clean upgrade
```

## Version Information

```bash
# Check coordinator version
tony --version

# Check full system status
tony status
```

## Integration Notes

### Multi-Agent Development
- Commands work seamlessly across multiple agent sessions
- Worktree-based development prevents command conflicts
- Context preservation through agent handoffs
- Consistent interface across all agent-created commands

### Claude Integration
- Natural language activation with "Hey Tony"
- Automatic context switching and agent coordination
- Seamless integration with Claude workflows
- No manual configuration required

### Backwards Compatibility
- All existing `tony-*.sh` scripts work unchanged
- Legacy command invocations continue to function
- Gradual migration path for existing projects
- Zero breaking changes for existing workflows

---

**📚 For More Information:**
- [Coordinator Implementation](./COORDINATOR-IMPLEMENTATION.md) - Technical implementation details
- [Tony Framework README](../README.md) - Getting started and overview
- [UPP Methodology](./UPP-METHODOLOGY.md) - Planning system details
- [GitHub Issues](https://github.com/jetrich/tony/issues) - Report issues or request features

**🔗 Quick Links:**
- Issue #49: Command Coordinator implementation
- Issue #32: Unified Command Router innovation
- Milestone 2.9.0: Development Infrastructure improvements