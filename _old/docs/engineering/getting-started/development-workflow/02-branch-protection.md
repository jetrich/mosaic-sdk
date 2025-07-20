---
title: "02 Branch Protection"
order: 02
category: "development-workflow"
tags: ["development-workflow", "getting-started", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Branch Protection Rules for MosAIc SDK

This document outlines the recommended branch protection rules for all MosAIc SDK repositories to ensure code quality and prevent accidental changes to critical branches.

## Overview

Branch protection rules help maintain code quality by:
- Preventing direct pushes to protected branches
- Requiring pull request reviews
- Ensuring CI/CD checks pass before merging
- Maintaining a clean commit history

## Main Branch Protection (`main` / `master`)

### Required Settings

```yaml
# Gitea/GitHub Branch Protection Settings

Branch: main
Protection: Enabled

Required Reviews:
  - Minimum approvals: 1
  - Dismiss stale reviews: true
  - Require review from code owners: true
  - Restrict dismissal to admins: true

Required Status Checks:
  - CI/CD Pipeline: must pass
  - Unit Tests: must pass
  - Integration Tests: must pass
  - Build: must succeed
  - Linting: no errors
  - Security Scan: no critical issues

Restrictions:
  - Restrict push access: true
  - Allowed users/teams: [admin team only]
  - Include administrators: false (during normal operations)

Additional Rules:
  - Require branches to be up to date: true
  - Require signed commits: recommended
  - Require linear history: true
  - Lock branch: false
  - Allow force pushes: false
  - Allow deletions: false
```

### Enforcement Exceptions

Only repository administrators can:
- Temporarily disable protection for emergency fixes
- Force push (should be extremely rare)
- Delete the branch (should never happen)

## Release Branches (`release/*`)

### Protection Settings

```yaml
Branch Pattern: release/*
Protection: Enabled

Required Reviews:
  - Minimum approvals: 2
  - Require review from release team: true

Required Status Checks:
  - All CI/CD checks: must pass
  - Release tests: must pass
  - Version validation: must pass

Restrictions:
  - Only release managers can push
  - No force pushes allowed
  - No deletions until EOL
```

## Development Branches (`develop`)

### Protection Settings

```yaml
Branch: develop
Protection: Enabled (if using git-flow)

Required Reviews:
  - Minimum approvals: 1

Required Status Checks:
  - Basic CI checks: must pass
  - Unit tests: must pass

Restrictions:
  - Core team members can push
  - Allow squash merging: true
```

## Feature Branch Guidelines

Feature branches (`feat/*`, `fix/*`, etc.) typically don't need protection, but follow these guidelines:

1. **Naming Convention**: Use prefixes (feat/, fix/, docs/, etc.)
2. **Lifetime**: Delete after merging to keep repository clean
3. **Updates**: Regularly sync with main branch
4. **Review**: Always create PR for code review

## Submodule-Specific Rules

Each submodule should have its own protection rules:

### mosaic-mcp
```yaml
Critical Module: true
Extra Requirements:
  - Security review for auth changes
  - Performance benchmarks for protocol changes
```

### tony
```yaml
Critical Module: true
Extra Requirements:
  - Agent compatibility tests
  - MCP integration tests (v2.8.0+)
```

### mosaic-dev
```yaml
Development Tools: true
Requirements:
  - CLI command tests
  - Documentation generation checks
```

## Implementation Guide

### For Gitea

1. Navigate to repository settings
2. Go to "Branches" → "Protection"
3. Add protection rule for `main`
4. Configure settings as specified above
5. Save and test with a sample PR

### For GitHub

1. Go to Settings → Branches
2. Add rule for `main`
3. Enable all protection settings
4. Configure status checks
5. Add CODEOWNERS file

### For GitLab

1. Project Settings → Repository → Protected branches
2. Select `main` branch
3. Set "Allowed to merge" and "Allowed to push"
4. Enable "Require approval"

## Status Checks Configuration

### Required CI/CD Checks

Create `.woodpecker.yml` or equivalent with these mandatory steps:

```yaml
pipeline:
  lint:
    image: node:18
    commands:
      - npm run lint
    when:
      event: [push, pull_request]

  test:
    image: node:18
    commands:
      - npm test
      - npm run test:coverage
    when:
      event: [push, pull_request]

  build:
    image: node:18
    commands:
      - npm run build:all
    when:
      event: [push, pull_request]

  security:
    image: node:18
    commands:
      - npm audit
      - npm run security:scan
    when:
      event: [push, pull_request]
```

## Automated Enforcement

### Pre-receive Hooks

```bash
#!/bin/bash
# Gitea pre-receive hook example

protected_branch="main"
while read oldrev newrev refname; do
    if [ "$refname" = "refs/heads/$protected_branch" ]; then
        # Check if user is authorized
        if ! authorized_user "$GITEA_PUSHER_NAME"; then
            echo "Direct push to $protected_branch not allowed"
            exit 1
        fi
        
        # Verify commit signatures
        if ! git verify-commit "$newrev"; then
            echo "Unsigned commits not allowed on $protected_branch"
            exit 1
        fi
    fi
done
```

## Bypass Procedures

### Emergency Hotfix Process

When protection must be bypassed:

1. **Document the reason** in incident log
2. **Get approval** from two administrators
3. **Temporarily disable** specific rules (not all)
4. **Apply fix** with detailed commit message
5. **Re-enable protection** immediately
6. **Post-mortem** to prevent future emergencies

### Bypass Checklist

- [ ] Incident documented with ticket number
- [ ] Two admin approvals obtained
- [ ] Protection temporarily modified (not removed)
- [ ] Changes reviewed by security team
- [ ] Protection restored to original state
- [ ] Post-mortem scheduled

## Monitoring and Compliance

### Regular Audits

Monthly checks:
- Verify protection rules are active
- Review bypass incidents
- Check for stale branches
- Validate CI/CD requirements

### Metrics to Track

- Protection bypass frequency
- PR approval times
- Failed status check patterns
- Branch creation/deletion rates

## Best Practices

1. **Start Strict**: Begin with strict rules and relax if needed
2. **Document Changes**: Keep audit trail of rule modifications
3. **Train Team**: Ensure everyone understands the workflow
4. **Regular Reviews**: Adjust rules based on team feedback
5. **Automate**: Use tools to enforce standards

## Troubleshooting

### Common Issues

**"Cannot push to protected branch"**
- Ensure you're working on a feature branch
- Create a pull request instead

**"Required status checks failing"**
- Run tests locally first
- Check CI/CD logs for specific errors

**"Review requirements not met"**
- Request review from qualified team members
- Ensure reviewers have necessary permissions

## Tools and Integrations

### Recommended Tools

1. **Branch Protection Bots**
   - Automatically enforce naming conventions
   - Clean up stale branches

2. **PR Automation**
   - Auto-assign reviewers
   - Add labels based on changes

3. **Compliance Monitoring**
   - Track protection rule changes
   - Alert on suspicious activity

## Migration Guide

### Moving to Protected Branches

1. **Phase 1**: Enable basic protection (1 week)
   - Require PRs only
   
2. **Phase 2**: Add reviews (2 weeks)
   - Require 1 approval
   
3. **Phase 3**: Full protection (ongoing)
   - All rules active

## Additional Resources

- [Gitea Branch Protection Docs](https://docs.gitea.io/en-us/protected-branches/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)