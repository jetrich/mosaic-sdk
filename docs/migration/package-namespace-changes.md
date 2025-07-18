# Package Namespace Changes Guide

## Overview

This guide documents all package namespace changes as part of the MosAIc Stack transformation. Understanding these changes is crucial for updating your dependencies and imports.

## Package Namespace Mappings

### Core Packages

| Old Package Name | New Package Name | Notes |
|-----------------|------------------|-------|
| `@tony-framework/mcp` | `@mosaic/mcp` | Complete rebranding |
| `@tony-ai/sdk` | `@mosaic/dev` | Development tools consolidated |
| `@tony-framework/core` | `@tony/core` | Tony maintains identity |
| N/A | `@mosaic/core` | New - MosAIc platform |
| N/A | `@mosaic/tony-adapter` | New - Integration layer |

### Repository Mappings

| Old Repository | New Repository | Status |
|---------------|----------------|--------|
| `jetrich/tony-sdk` | `jetrich/mosaic-sdk` | Pending |
| `jetrich/tony-mcp` | `jetrich/mosaic-mcp` | Pending |
| `jetrich/tony-dev` | Merge into `jetrich/mosaic-dev` | Pending |
| `jetrich/tony` | `jetrich/tony` | No change |

## Import Statement Updates

### TypeScript/JavaScript Imports

**Before:**
```typescript
import { TonyFramework } from '@tony-framework/core';
import { MCPServer } from '@tony-framework/mcp';
import { DevTools } from '@tony-ai/sdk';
```

**After:**
```typescript
import { TonyFramework } from '@tony/core';
import { createMCPServer } from '@mosaic/mcp';
import { DevTools } from '@mosaic/dev';
```

### Package.json Dependencies

**Before:**
```json
{
  "dependencies": {
    "@tony-framework/core": "^2.7.0",
    "@tony-framework/mcp": "^0.0.1-beta.1",
    "@tony-ai/sdk": "^1.0.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@tony/core": "^2.8.0",
    "@mosaic/mcp": "^0.1.0",
    "@mosaic/dev": "^0.1.0"
  }
}
```

## New Package Introductions

### @mosaic/core (v0.1.0)

The MosAIc platform package for enterprise orchestration:

```typescript
import { MosAIcCore } from '@mosaic/core';

const mosaic = new MosAIcCore({
  projects: ['project-a', 'project-b'],
  orchestration: 'multi-agent'
});
```

### @mosaic/tony-adapter (v0.1.0)

Bridge between Tony Framework and MosAIc platform:

```typescript
import { TonyAdapter } from '@mosaic/tony-adapter';

const adapter = new TonyAdapter({
  tony: tonyInstance,
  mosaic: mosaicInstance
});
```

## Migration Script Usage

### Automatic Migration

Use the provided migration script:

```bash
# From the tony-sdk root directory
node scripts/migrate-packages.js

# This will:
# - Update all package.json files
# - Update import statements in source files
# - Update repository references
```

### Manual Migration

If you prefer manual updates:

1. **Update package.json files**
   - Replace old package names with new ones
   - Update version numbers

2. **Update import statements**
   - Search for old package names
   - Replace with new namespace

3. **Update configuration files**
   - Check for hardcoded package references
   - Update build scripts

## Version Compatibility

### Initial Release (January 2025)

| Package | Version | Compatible With |
|---------|---------|-----------------|
| `@tony/core` | 2.8.0 | `@mosaic/mcp` ≥0.1.0 |
| `@mosaic/mcp` | 0.1.0 | `@tony/core` ≥2.8.0 |
| `@mosaic/core` | 0.1.0 | All 0.1.0 versions |
| `@mosaic/dev` | 0.1.0 | All 0.1.0 versions |

### Future Compatibility

- All `@mosaic/*` packages will maintain synchronized minor versions
- `@tony/core` will maintain its own versioning
- Breaking changes will be coordinated across the stack

## Common Issues and Solutions

### Issue: Cannot find module '@tony-framework/mcp'

**Solution:**
```bash
# Uninstall old package
npm uninstall @tony-framework/mcp

# Install new package
npm install @mosaic/mcp@^0.1.0
```

### Issue: Type errors after migration

**Solution:**
```typescript
// Update your TypeScript imports
// Old
import type { MCPConfig } from '@tony-framework/mcp';

// New
import type { MCPConfig } from '@mosaic/mcp';
```

### Issue: Build scripts failing

**Solution:**
Update your build scripts to reference new package names:

```json
{
  "scripts": {
    "dev": "mosaic dev",  // Changed from 'tony dev'
    "build": "mosaic build"
  }
}
```

## Deprecation Timeline

### Phase 1: Soft Deprecation (January 2025)
- Old packages marked as deprecated
- Console warnings added
- Documentation updated

### Phase 2: Feature Freeze (March 2025)
- No new features in old packages
- Security fixes only
- Migration reminders intensified

### Phase 3: End of Life (June 2025)
- Old packages removed from registry
- No further updates
- Full migration required

## Package Features Comparison

### @tony-framework/mcp → @mosaic/mcp

**Added in @mosaic/mcp:**
- Enhanced coordination algorithms
- Real-time performance monitoring
- Enterprise security features
- Multi-region support

**Removed:**
- Standalone mode support
- File-based state fallback
- Legacy API endpoints

### @tony-ai/sdk → @mosaic/dev

**Added in @mosaic/dev:**
- Unified test orchestration
- Cross-component tooling
- Migration utilities
- Performance profiling

**Consolidated:**
- Build tools from tony-dev
- Testing frameworks
- Documentation generators

## Getting Help

### Resources
- [Migration Guide](tony-sdk-to-mosaic-sdk.md)
- [API Documentation](https://docs.mosaicstack.dev/api)
- [Package Registry](https://www.npmjs.com/org/mosaic)

### Support
- GitHub Discussions: Package-specific questions
- Discord: Real-time help
- Stack Overflow: Tag with `mosaic-stack`

## Conclusion

The package namespace changes reflect the evolution from a single framework to a comprehensive platform. While the changes require some migration effort, they provide:

- Clearer package organization
- Better brand identity
- Improved discoverability
- Enterprise-ready naming

Take time to update your projects properly, use the migration tools provided, and don't hesitate to seek help from the community during the transition.