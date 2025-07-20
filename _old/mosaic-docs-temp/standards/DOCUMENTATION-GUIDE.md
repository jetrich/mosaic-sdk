# MosAIc Documentation Standards Guide

## Overview

This guide establishes documentation standards for all MosAIc platform components to ensure consistency, quality, and maintainability.

## Documentation Principles

1. **Clarity First**: Write for your audience - assume technical knowledge but not project-specific context
2. **Examples Matter**: Every concept should have at least one practical example
3. **Keep It Current**: Documentation must be updated with code changes
4. **Test Everything**: All code examples must be tested and working

## File Structure Standards

### Naming Conventions
- Use lowercase with hyphens: `user-guide.md`, not `UserGuide.md`
- Be descriptive: `mcp-server-configuration.md`, not `config.md`
- Use standard suffixes:
  - `-guide.md` for how-to documentation
  - `-reference.md` for API/configuration references
  - `-architecture.md` for design documents

### Standard Sections
Every documentation file should include:

```markdown
# Title

## Overview
Brief description of what this document covers

## Prerequisites  
What the reader needs to know/have before starting

## [Main Content]
The core documentation

## Examples
Practical, working examples

## Troubleshooting
Common issues and solutions

## Related Documentation
Links to related docs
```

## Markdown Standards

### Headers
- Use ATX-style headers (`#` not underlines)
- Only one H1 (`#`) per document
- Use sentence case for headers

### Code Blocks
Always specify language for syntax highlighting:
```markdown
​```typescript
const example = "Always specify language";
​```
```

### Links
- Use relative links for internal documentation
- Use reference-style links for repeated URLs
- Always verify links work before committing

### Lists
- Use `-` for unordered lists
- Use `1.` for ordered lists (auto-numbering)
- Maintain consistent indentation (2 spaces)

## Component Documentation Requirements

### Each Submodule Must Document:

1. **User Guide** (`user-guide.md`)
   - Installation instructions
   - Basic usage
   - Common workflows
   - Configuration options

2. **Architecture** (`architecture.md`)
   - System design
   - Component interactions
   - Data flow diagrams
   - Decision rationale

3. **API Reference** (`api-reference.md`)
   - All public APIs
   - Method signatures
   - Parameters and returns
   - Usage examples

4. **Configuration Reference** (`configuration-reference.md`)
   - All configuration options
   - Default values
   - Environment variables
   - Example configurations

5. **Troubleshooting Guide** (`troubleshooting-guide.md`)
   - Common error messages
   - Debugging steps
   - FAQ section
   - Support contacts

## Code Example Standards

### TypeScript/JavaScript
```typescript
// Always include imports
import { Component } from '@mosaic/core';

// Use meaningful variable names
const userConfiguration = {
  apiKey: process.env.MOSAIC_API_KEY,
  timeout: 5000
};

// Include error handling
try {
  const result = await component.initialize(userConfiguration);
  console.log('Success:', result);
} catch (error) {
  console.error('Failed to initialize:', error);
}
```

### Bash Scripts
```bash
#!/bin/bash
# Always include shebang and description
# Description: Initialize MosAIc development environment

set -euo pipefail  # Always use strict mode

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Main logic
echo "Initializing MosAIc SDK..."
```

## Version-Specific Documentation

- Always note version requirements
- Use admonitions for version-specific features:

```markdown
> **Note**: This feature requires Tony Framework v2.8.0 or higher
```

## Review Checklist

Before submitting documentation:

- [ ] Spell check completed
- [ ] All links verified
- [ ] Code examples tested
- [ ] Follows naming conventions
- [ ] Includes all required sections
- [ ] Version requirements noted
- [ ] Related docs linked

## BookStack Synchronization

Documents in this repository automatically sync to BookStack with the following mapping:

- `/platform/` → "Platform" shelf
- `/submodules/[name]/` → "[Name]" shelf
- Markdown files → BookStack pages

Ensure your documentation structure aligns with intended BookStack organization.