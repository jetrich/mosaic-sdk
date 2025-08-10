# F.0001.09: BookStack Unified Integration

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: DOC-DOCUMENTATION-DAVID
**Estimated Effort**: 15 atomic tasks (~7.5 hours)

## Description

Implement the unified Project = Shelf approach for BookStack integration, supporting both single and multi-instance deployments with explicit mono-repo handling.

## Acceptance Criteria

- [ ] Project = Shelf structure implemented
- [ ] Mono-repo documentation rules enforced
- [ ] Single/multi-instance support without restructuring
- [ ] Project metadata system functional
- [ ] BookStack sync handles unified structure
- [ ] Migration tools support new structure

## Stories

1. [S.0001.09.01](../stories/S.0001.09.01-project-structure.md) - Implement Project = Shelf structure
2. [S.0001.09.02](../stories/S.0001.09.02-mono-repo-rules.md) - Define mono-repo documentation rules
3. [S.0001.09.03](../stories/S.0001.09.03-metadata-system.md) - Create project metadata system
4. [S.0001.09.04](../stories/S.0001.09.04-sync-adaptation.md) - Adapt BookStack sync for unified structure

## Dependencies

- F.0001.01 (Core structure templates) - Need base structure
- F.0001.02 (BookStack hierarchy) - Builds on 4-level hierarchy

## Technical Notes

### Unified Structure

```
docs/{ProjectName}/
├── task-management/        # UPP methodology
├── architecture/           # Domain: Architecture
├── api/                   # Domain: API Reference
├── operations/            # Domain: Operations
└── _project.yaml          # Project metadata
```

### Mono-repo Example

```
mosaic-sdk/docs/
├── mosaic-sdk/            # Integration docs
├── mosaic/                # Component docs
├── mosaic-mcp/           # Component docs
└── mosaic-tony/          # Component docs
```

### Key Principles

1. **No restructuring** when changing BookStack deployment
2. **Clear boundaries** for permissions and navigation
3. **Explicit rules** for mono-repo handling
4. **Submodule = Project** for documentation purposes

## Component Assignment

- **Primary**: mosaic-sdk (structure implementation)
- **Secondary**: mosaic-docs (BookStack integration)
- **Supporting**: All components (adopt structure)
