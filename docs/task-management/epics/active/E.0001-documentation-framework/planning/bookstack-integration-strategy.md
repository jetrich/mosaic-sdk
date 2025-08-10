# BookStack Integration Strategy

> **Note**: This document has been updated to align with the unified Project = Shelf approach defined in `bookstack-unified-structure.md`. Every project (including submodules) gets its own shelf in BookStack.

## Current State

### BookStack Instance

- **URL**: https://docs.mosaicstack.dev
- **Sync User**: syncagent@mosaicstack.dev
- **Authentication**: API token based

### Existing Structure Analysis

The current BookStack structure needs to be analyzed to determine:

1. Current shelf/book/chapter organization
2. Existing content from mosaic-docs
3. Gaps or misalignments with new structure
4. Migration requirements

## Integration Approach

### 1. Structure Alignment

#### Proposed BookStack Organization (Project = Shelf)

```
Shelves (Project Level):
├── mosaic-sdk (Integration & Orchestration)
│   ├── Book: Getting Started
│   ├── Book: Integration Architecture
│   ├── Book: Deployment Guide
│   ├── Book: Full Stack Examples
│   └── Book: Task Management
├── mosaic (Core Platform)
│   ├── Book: Core Architecture
│   ├── Book: Platform APIs
│   ├── Book: Plugin System
│   ├── Book: Configuration
│   └── Book: Task Management
├── mosaic-mcp (MCP Server)
│   ├── Book: MCP Protocol
│   ├── Book: Server Architecture
│   ├── Book: Tool Development
│   ├── Book: Integration Guide
│   └── Book: Task Management
├── mosaic-tony (Tony Framework)
│   ├── Book: Agent Orchestration
│   ├── Book: UPP Methodology
│   ├── Book: Persona System
│   ├── Book: Framework APIs
│   └── Book: Task Management
└── mosaic-webui (Web Interface)
    ├── Book: UI Architecture
    ├── Book: Component Library
    ├── Book: API Integration
    ├── Book: User Guide
    └── Book: Task Management
```

### 2. Sync Strategy

#### Two-Way Sync Process

1. **mosaic-docs → BookStack**
   - Primary content source is mosaic-docs
   - Automated sync via API
   - Preserves BookStack IDs for stability

2. **BookStack → mosaic-docs**
   - Edits in BookStack can be pulled back
   - Requires conflict resolution
   - Optional based on workflow

#### Sync Implementation

```typescript
interface BookStackSync {
  // Initial sync
  analyzeExisting(): StructureMap;
  planMigration(): MigrationPlan;

  // Ongoing sync
  pushChanges(files: ChangedFiles): SyncResult;
  pullChanges(since: Date): LocalChanges;
  resolveConflicts(conflicts: Conflict[]): Resolution;
}
```

### 3. Content Mapping (Project = Shelf Principle)

#### File to BookStack Mapping

```yaml
mapping:
  # Project level (Shelf)
  "docs/mosaic-sdk/": "Shelf: mosaic-sdk"
  "docs/mosaic/": "Shelf: mosaic"
  "docs/mosaic-mcp/": "Shelf: mosaic-mcp"
  "docs/mosaic-tony/": "Shelf: mosaic-tony"
  "docs/mosaic-webui/": "Shelf: mosaic-webui"

  # Book level (within project shelf)
  "docs/mosaic-sdk/architecture/": "mosaic-sdk/Architecture"
  "docs/mosaic-sdk/getting-started/": "mosaic-sdk/Getting Started"
  "docs/mosaic/api/": "mosaic/API Reference"

  # Chapter level
  "docs/mosaic/architecture/core-design/": "mosaic/Architecture/Core Design"

  # Page level
  "docs/mosaic/architecture/core-design/introduction.md": "Page: Introduction"
```

### 4. Metadata Preservation

#### BookStack Metadata in Files

```yaml
# _bookstack.yaml
bookstack:
  id: 42
  slug: "system-design-intro"
  updated: "2024-01-27T10:00:00Z"
  revision: 15
```

## Implementation Phases

### Phase 1: Analysis & Planning

1. Fetch current BookStack structure via API
2. Compare with mosaic-docs content
3. Identify gaps and conflicts
4. Create migration plan

### Phase 2: Initial Migration

1. Backup existing BookStack content
2. Create new structure if needed
3. Migrate content preserving IDs
4. Validate all content accessible

### Phase 3: Sync Automation

1. Implement push sync (mosaic-docs → BookStack)
2. Add pull sync if needed
3. Create conflict resolution
4. Set up CI/CD integration

### Phase 4: Monitoring

1. Track sync status
2. Alert on failures
3. Report metrics
4. Handle edge cases

## Technical Considerations

### API Usage

```bash
# Get all shelves
curl -X GET https://docs.mosaicstack.dev/api/shelves \
  -H "Authorization: Token ${BOOKSTACK_TOKEN}"

# Create/Update content
curl -X PUT https://docs.mosaicstack.dev/api/pages/{id} \
  -H "Authorization: Token ${BOOKSTACK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Page Title", "html": "<p>Content</p>"}'
```

### Rate Limiting

- Respect API rate limits
- Batch operations where possible
- Implement exponential backoff

### Error Handling

- Network failures
- API changes
- Content conflicts
- Permission issues

## Success Criteria

1. All mosaic-docs content accessible in BookStack
2. Structure follows 4-level hierarchy
3. Automated sync reduces manual work
4. No content loss during migration
5. Clear documentation for process
