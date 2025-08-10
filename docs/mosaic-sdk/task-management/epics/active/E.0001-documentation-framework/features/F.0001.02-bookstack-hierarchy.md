# F.0001.02: BookStack 4-Level Hierarchy Implementation

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: DOC-DOCUMENTATION-DAVID
**Estimated Effort**: 30 atomic tasks (~15 hours)

## Description

Implement the BookStack-compatible 4-level documentation hierarchy (Shelf → Book → Chapter → Page) for all non-task documentation. This includes metadata formats, sync mechanisms, and API integration.

## Acceptance Criteria

- [ ] Shelf/Book/Chapter/Page structure defined and documented
- [ ] Metadata file formats (\_shelf.yaml, \_book.yaml, \_chapter.yaml) created
- [ ] File-based sync mechanism functional
- [ ] API-based sync mechanism functional
- [ ] Conflict resolution strategy implemented
- [ ] Multi-project support (shared vs dedicated instances)

## Stories

1. [S.0001.02.01](../stories/S.0001.02.01-hierarchy-design.md) - Design shelf/book/chapter/page structure
2. [S.0001.02.02](../stories/S.0001.02.02-metadata-formats.md) - Create metadata file formats
3. [S.0001.02.03](../stories/S.0001.02.03-file-sync.md) - Build file-based sync mechanism
4. [S.0001.02.04](../stories/S.0001.02.04-api-sync.md) - Build API-based sync mechanism
5. [S.0001.02.05](../stories/S.0001.02.05-conflict-resolution.md) - Implement conflict resolution
6. [S.0001.02.06](../stories/S.0001.02.06-multi-project.md) - Add multi-project support

## Dependencies

- F.0001.01 (Core structure templates) - Need base structure first

## Technical Notes

### Metadata Schema Example

**\_shelf.yaml:**

```yaml
name: Architecture
description: System architecture and design documentation
icon: building
order: 1
visibility: public
tags:
  - technical
  - architecture
```

**\_book.yaml:**

```yaml
name: System Design
description: Core system design principles
order: 1
chapters:
  - overview
  - components
  - patterns
```

### Sync Modes

1. **File-based** (Default)
   - Export to BookStack import format
   - Manual or scheduled sync
   - Version tracking

2. **API-based** (Advanced)
   - Direct BookStack API integration
   - Real-time sync
   - Bidirectional updates

## Component Assignment

- **Primary**: mosaic-docs (BookStack structure implementation)
- **Secondary**: mosaic-sdk (integration and tooling)
- **Supporting**: mosaic-mcp (sync tools)
