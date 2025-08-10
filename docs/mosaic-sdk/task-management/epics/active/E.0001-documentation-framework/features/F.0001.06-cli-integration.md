# F.0001.06: CLI Integration and Commands

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Effort**: 25 atomic tasks (~12.5 hours)

## Description

Integrate documentation framework with the mosaic CLI, providing commands for initialization, validation, migration, and management. Include interactive prompts and configuration options.

## Acceptance Criteria

- [ ] `mosaic docs` command group implemented
- [ ] Interactive prompts guide users
- [ ] Progress reporting for long operations
- [ ] Configuration options available
- [ ] Help documentation complete
- [ ] Error messages helpful

## Stories

1. [S.0001.06.01](../stories/S.0001.06.01-docs-commands.md) - Implement mosaic docs commands
2. [S.0001.06.02](../stories/S.0001.06.02-interactive-prompts.md) - Create interactive prompts
3. [S.0001.06.03](../stories/S.0001.06.03-progress-reporting.md) - Build progress reporting
4. [S.0001.06.04](../stories/S.0001.06.04-config-options.md) - Add configuration options
5. [S.0001.06.05](../stories/S.0001.06.05-help-system.md) - Create help documentation

## Dependencies

- F.0001.01 through F.0001.05 - Need core functionality first

## Technical Notes

### Command Structure

```bash
mosaic docs
├── init                 # Initialize documentation structure
├── validate            # Validate current structure
├── migrate            # Migrate existing documentation
├── add-shelf          # Add new BookStack shelf
├── add-book          # Add new book to shelf
├── sync              # Sync with BookStack
├── analyze           # Analyze existing structure
└── fix              # Auto-fix common issues
```

### Interactive Example

```bash
$ mosaic docs init

📚 MosAIc Documentation Initializer

Analyzing existing structure...
Found existing documentation in non-standard locations.

Would you like to:
1) Migrate existing documentation
2) Start fresh (backup existing)
3) Cancel

Choice: 1

Preparing migration plan...
- 15 task files to migrate
- 8 planning documents to reorganize
- 3 duplicate files to consolidate

Review migration plan? (Y/n): Y
[Shows detailed plan]

Proceed with migration? (Y/n): Y
[Progress bar shows migration progress]

✅ Documentation structure initialized!
```

### Configuration

```yaml
docs:
  structure:
    enforce: warning # training|warning|strict
    auto_fix: true

  bookstack:
    mode: file # file|api
    url: https://docs.example.com
    api_key: ${BOOKSTACK_API_KEY}

  migration:
    backup: true
    preserve_history: true

  validation:
    on_commit: true
    on_save: false
```

## Component Assignment

- **Primary**: mosaic (CLI implementation)
- **Secondary**: mosaic-sdk (command integration)
- **Supporting**: mosaic-mcp (real-time features)
