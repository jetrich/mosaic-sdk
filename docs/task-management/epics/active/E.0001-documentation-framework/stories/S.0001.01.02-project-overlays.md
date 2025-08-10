# S.0001.01.02: Design Project-Type Overlay System

**Feature**: F.0001.01 - Core Documentation Structure Templates
**Status**: PLANNED
**Owner**: DOC-DOCUMENTATION-DAVID
**Estimated Tasks**: 5-6 atomic tasks

## Description

Design and implement the overlay system that allows project-type-specific customizations to be applied on top of the universal template. This enables flexibility while maintaining consistency.

## Acceptance Criteria

- [ ] Overlay format (YAML) designed and documented
- [ ] Overlay types defined for: web-app, cli-tool, blockchain, healthcare
- [ ] Merge logic handles additions, modifications, and removals
- [ ] Validation ensures overlays don't break base structure
- [ ] Examples provided for each project type

## Tasks

1. [T.0001.01.02.01](../tasks/T.0001.01.02.01-overlay-format.md) - Design overlay YAML format
2. [T.0001.01.02.02](../tasks/T.0001.01.02.02-webapp-overlay.md) - Create web-app overlay
3. [T.0001.01.02.03](../tasks/T.0001.01.02.03-cli-overlay.md) - Create CLI tool overlay
4. [T.0001.01.02.04](../tasks/T.0001.01.02.04-blockchain-overlay.md) - Create blockchain overlay
5. [T.0001.01.02.05](../tasks/T.0001.01.02.05-healthcare-overlay.md) - Create healthcare overlay
6. [T.0001.01.02.06](../tasks/T.0001.01.02.06-merge-logic.md) - Implement merge logic

## Technical Specifications

### Overlay Format Example

```yaml
name: web-app
description: Web application project type
extends: base

additions:
  shelves:
    - name: frontend
      books:
        - components
        - state-management
        - routing
    - name: backend
      books:
        - api-design
        - database
        - authentication

modifications:
  task-management:
    agent-prefix: WEB
    default-personas:
      - FE-FRONTEND-FIONA
      - BE-BACKEND-BENJAMIN

requirements:
  - responsive-design
  - accessibility
  - browser-compatibility

templates:
  - component-template.md
  - api-endpoint-template.md
```

### Merge Algorithm

1. Load base template
2. Load overlay file
3. Apply additions (new sections)
4. Apply modifications (existing sections)
5. Validate result
6. Generate final structure

## Dependencies

- S.0001.01.01 (Universal template must exist first)

## Notes

The overlay system is critical for adoption as it allows project-specific needs while maintaining overall consistency. Consider future extensibility for custom project types.
