# Branch Strategy Guide for MosAIc Projects

## Recommended Branch Models

### 1. For Active Development Projects (mosaic-mcp)
Since mosaic-mcp uses `development` as default:

```
development (default) ← Active development
    ├── feature/* ← Feature branches
    ├── fix/* ← Bug fixes
    └── release/* ← Release preparation
main ← Stable releases only
```

**Branch Protection Rules:**
- `development`: Require 1 approval, no force push
- `main`: Require 2 approvals, no direct push, only from development
- `release/*`: Require 1 approval, delete after merge

### 2. For Stable Projects (tony, mosaic)
Using `main` as default:

```
main (default) ← Stable development
    ├── feature/* ← Features
    ├── fix/* ← Fixes
    └── develop ← Optional integration branch
```

## Setting Up Branch Protection

### For mosaic-mcp (development branch):
1. Go to Settings → Branches
2. Add rule for `development`:
   - Pattern: `development`
   - ✅ Protect branch
   - ✅ Require pull request (1 approval)
   - ✅ Dismiss stale reviews
   - ✅ Restrict push (only maintainers)
   
3. Add rule for `main`:
   - Pattern: `main`
   - ✅ Protect branch
   - ✅ Require pull request (2 approvals)
   - ✅ Restrict push (admins only)
   - Enable Status Check: `ci/woodpecker/pr` (after CI setup)

### Status Check Patterns (after CI/CD setup):
- `ci/woodpecker/pr` - PR builds
- `ci/woodpecker/push` - Push builds
- `tests/*` - Test suites
- `security/*` - Security scans