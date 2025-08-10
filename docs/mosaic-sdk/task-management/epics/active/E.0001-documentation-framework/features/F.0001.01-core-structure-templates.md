# F.0001.01: Core Documentation Structure Templates

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: DOC-DOCUMENTATION-DAVID
**Estimated Effort**: 25 atomic tasks (~12.5 hours)

## Description

Create the universal documentation structure templates that all MosAIc projects will inherit. This includes the base MANDATORY_STRUCTURE.md template, project-type overlays, and the generation engine.

## Acceptance Criteria

- [ ] Universal MANDATORY_STRUCTURE.md template exists in ~/.config/mosaic/templates/
- [ ] Project-type overlays for web-app, cli-tool, blockchain, healthcare
- [ ] Template generation engine can combine base + overlay
- [ ] Validation rules defined for structure compliance
- [ ] Templates are version controlled and updatable

## Stories

1. [S.0001.01.01](../stories/S.0001.01.01-universal-template.md) - Create universal MANDATORY_STRUCTURE.md template
2. [S.0001.01.02](../stories/S.0001.01.02-project-overlays.md) - Design project-type overlay system
3. [S.0001.01.03](../stories/S.0001.01.03-generation-engine.md) - Build template generation engine
4. [S.0001.01.04](../stories/S.0001.01.04-validation-rules.md) - Create validation rules

## Dependencies

- None (foundational feature)

## Technical Notes

### Template Location

```
~/.config/mosaic/templates/documentation/
├── MANDATORY_STRUCTURE.md
├── project-types/
│   ├── web-app.yaml
│   ├── cli-tool.yaml
│   ├── blockchain.yaml
│   └── healthcare.yaml
└── templates/
    ├── epic-readme.md
    ├── atomic-task.md
    └── agent-session.md
```

### Generation Process

1. Load universal template
2. Load project-type overlay
3. Merge configurations
4. Generate project-specific structure
5. Write to project directory

## Component Assignment

- **Primary**: mosaic-sdk (template storage and orchestration)
- **Secondary**: mosaic (integration with platform)
- **Supporting**: All components (consume templates)
