# Submodule Documentation Requirements

## Overview

Every submodule in the MosAIc ecosystem must maintain standardized documentation to ensure consistency and ease of use across the platform.

## Required Files in Each Submodule

### 1. README.md (Root Level)
Quick start guide with:
- Brief description
- Installation instructions  
- Basic usage example
- Link to full documentation in mosaic-docs

Example:
```markdown
# Tony Framework

AI orchestration framework for multi-agent coordination.

## Quick Start
\`\`\`bash
npm install @tony/core
\`\`\`

## Documentation
Full documentation available at: `mosaic-sdk/mosaic-docs/submodules/tony/`
```

### 2. DOCUMENTATION.md (Root Level)
Documentation pointer file:

```markdown
# Documentation for [Submodule Name]

## Full Documentation Location
All comprehensive documentation is maintained in:
`mosaic-sdk/mosaic-docs/submodules/[submodule-name]/`

## Documentation Structure
- User Guide: `mosaic-docs/submodules/[name]/user-guide.md`
- Architecture: `mosaic-docs/submodules/[name]/architecture.md`  
- API Reference: `./docs/API.md` (generated)
- Configuration: `mosaic-docs/submodules/[name]/configuration-reference.md`

## Updating Documentation
1. Clone mosaic-sdk with submodules: `git clone --recursive`
2. Navigate to: `mosaic-sdk/mosaic-docs/submodules/[name]/`
3. Edit documentation following standards in `mosaic-docs/standards/`
4. Submit PR to mosaic-docs repository

## CI/CD Integration
Documentation completeness is validated in our CI pipeline.
```

### 3. docs/ Directory (Minimal)
Only for generated/technical content:
- `API.md` - Auto-generated API documentation
- `CHANGELOG.md` - Version history (if not in root)

## Required Documentation in mosaic-docs

Each submodule must have complete documentation in:
`mosaic-docs/submodules/[submodule-name]/`

### Minimum Required Documents:

#### 1. user-guide.md
```markdown
# [Submodule] User Guide

## Installation
Step-by-step installation instructions

## Configuration  
How to configure the component

## Basic Usage
Common use cases with examples

## Advanced Features
More complex scenarios
```

#### 2. architecture.md
```markdown
# [Submodule] Architecture

## Overview
High-level architecture description

## Components
Major components and their roles

## Data Flow
How data moves through the system

## Integration Points
How it connects with other components
```

#### 3. configuration-reference.md
```markdown
# [Submodule] Configuration Reference

## Environment Variables
All supported environment variables

## Configuration Files
File formats and options

## Default Values
What happens if not configured

## Examples
Complete configuration examples
```

#### 4. api-reference.md
```markdown
# [Submodule] API Reference

## Public APIs
All public methods/endpoints

## Data Types
Interfaces and type definitions

## Events
Event emitters and handlers

## Error Codes
Possible errors and meanings
```

#### 5. troubleshooting-guide.md
```markdown
# [Submodule] Troubleshooting

## Common Issues
Frequently encountered problems

## Debug Mode
How to enable detailed logging

## Error Messages
What various errors mean

## Getting Help
Where to report issues
```

## CI/CD Validation

### Woodpecker Pipeline Check
Each submodule's `.woodpecker.yml` must include:

```yaml
pipeline:
  validate-docs:
    image: node:18
    commands:
      - test -f README.md
      - test -f DOCUMENTATION.md
      - test -d ../../mosaic-docs/submodules/${CI_REPO_NAME}
    when:
      event: [push, pull_request]
```

### Documentation Completeness Check
The mosaic-sdk CI will verify:
1. All required files exist
2. Documentation follows standards
3. Links are valid
4. Examples are formatted correctly

## Migration Checklist

When adding/updating a submodule:

- [ ] Create `DOCUMENTATION.md` in submodule root
- [ ] Update submodule `README.md` with doc links
- [ ] Create directory in `mosaic-docs/submodules/[name]/`
- [ ] Add all required documentation files
- [ ] Verify all internal links work
- [ ] Test code examples
- [ ] Update mosaic-docs index if needed
- [ ] Submit PR to mosaic-docs

## Best Practices

1. **Keep It DRY**: Don't duplicate content between submodule and mosaic-docs
2. **Link Liberally**: Cross-reference related documentation
3. **Version Clearly**: Note when features were added/changed
4. **Example First**: Show, don't just tell
5. **Test Everything**: All code snippets should be runnable

## Enforcement

Pull requests will be blocked if:
- Documentation is missing or incomplete
- Links are broken
- Standards are not followed
- Examples don't work

This ensures high-quality, consistent documentation across the MosAIc platform.