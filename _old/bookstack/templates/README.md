# BookStack Documentation Templates

This directory contains templates for creating consistent documentation in BookStack.

## Available Templates

### 1. Page Template (`page-template.md`)
Standard template for all documentation pages. Includes:
- Required frontmatter fields
- Consistent section structure
- Example placeholders

### 2. API Documentation Template (`api-template.md`)
Specialized template for API endpoint documentation.

### 3. Runbook Template (`runbook-template.md`)
Template for operational runbooks and procedures.

### 4. Tutorial Template (`tutorial-template.md`)
Step-by-step tutorial format with exercises.

## Usage

### Creating a New Page

1. Copy the appropriate template:
   ```bash
   cp docs/bookstack/templates/page-template.md docs/engineering/dev-guide/getting-started/01-my-new-page.md
   ```

2. Update the frontmatter:
   - `title`: Human-readable title
   - `order`: Numeric order (01-99)
   - `category`: Parent chapter slug
   - `tags`: Relevant search tags
   - `last_updated`: Today's date (YYYY-MM-DD)
   - `author`: Your identifier

3. Replace placeholder content with your documentation

4. Validate the structure:
   ```bash
   ./scripts/validate-bookstack-structure.py docs/
   ```

## Frontmatter Fields

### Required Fields
- `title` (string): Page title displayed in BookStack
- `order` (number): Sort order within chapter (01-99)
- `category` (string): Parent chapter slug
- `tags` (array): Search tags for discoverability
- `last_updated` (date): YYYY-MM-DD format
- `author` (string): Author identifier

### Optional Fields
- `version` (string): Document version
- `status` (string): draft, review, published
- `deprecated` (boolean): Mark as deprecated
- `redirect_to` (string): Redirect to another page
- `toc` (boolean): Show table of contents
- `search_exclude` (boolean): Exclude from search

## Naming Conventions

### File Names
- Format: `00-kebab-case.md`
- Numbers: 01-99 for ordering
- Lowercase only
- Hyphens for spaces
- `.md` extension

### Examples:
- ✅ `01-getting-started.md`
- ✅ `02-environment-setup.md`
- ✅ `15-advanced-configuration.md`
- ❌ `Getting Started.md`
- ❌ `1-setup.md` (needs two digits)
- ❌ `01_setup.md` (use hyphens, not underscores)

## Directory Structure

```
docs/
└── shelf-slug/
    └── book-slug/
        └── chapter-slug/
            ├── 01-first-page.md
            ├── 02-second-page.md
            └── 03-third-page.md
```

## Validation

Always validate your documentation before committing:

```bash
# Validate entire docs directory
./scripts/validate-bookstack-structure.py docs/

# Validate with custom structure file
./scripts/validate-bookstack-structure.py docs/ my-structure.yaml
```

## Sync Process

Documentation is automatically synced to BookStack on commit:

1. Push changes to Git
2. CI/CD pipeline validates structure
3. Sync script updates BookStack
4. Changes appear in BookStack within minutes

## Best Practices

1. **Keep Pages Focused**: One topic per page
2. **Use Clear Titles**: Descriptive and searchable
3. **Include Examples**: Show, don't just tell
4. **Add Navigation**: Link to related pages
5. **Update Dates**: Keep last_updated current
6. **Tag Thoroughly**: Help users find content
7. **Review Status**: Mark drafts appropriately

## Getting Help

- Structure Definition: `docs/bookstack/bookstack-structure.yaml`
- Validation Script: `scripts/validate-bookstack-structure.py`
- Sync Script: `scripts/sync-to-bookstack.py`
- Support: Create issue in GitLab/GitHub