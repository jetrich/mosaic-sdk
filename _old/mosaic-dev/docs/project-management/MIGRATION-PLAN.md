# Tony-NG Restructuring Migration Plan

## Executive Summary

This document outlines the step-by-step plan to restructure the Tony-NG codebase from its current confusing nested structure to a clear, well-organized architecture that separates the Tony Framework from the Tony-NG Application.

## Current State

```
tony-ng/                        # Mixed framework and docs
├── framework files...          # Scattered in root
├── tony-ng/                    # Confusing nested directory
│   ├── frontend/              # React application
│   ├── backend/               # NestJS application
│   └── infrastructure/        # Deployment configs
├── docs/                      # Mixed documentation
├── scripts/                   # Mixed scripts
└── junk/test-autonomous-tony/ # Test projects
```

**Problems**:
- Nested `tony-ng/tony-ng/` structure is confusing
- Framework and application code are mixed
- Documentation is scattered
- No clear separation of concerns

## Target State

```
tony-ng/                        # Clean root
├── framework/                  # Tony Framework
├── application/               # Tony-NG Web App
├── infrastructure/            # All deployment configs
├── docs/                      # Consolidated docs
├── examples/                  # Example projects
└── scripts/                   # Root utilities only
```

## Migration Steps

### Phase 1: Preparation (Day 1)
**Goal**: Set up for safe migration without breaking existing functionality

1. **Create Migration Branch**
   ```bash
   git checkout -b restructure/clean-architecture
   git push -u origin restructure/clean-architecture
   ```

2. **Document Current State**
   - Take inventory of all files and their purposes
   - Document all import paths that will need updating
   - List all configuration files that reference paths

3. **Create Rollback Plan**
   - Document exact steps to revert if needed
   - Ensure all team members have access to current working state

### Phase 2: Create New Structure (Day 2)
**Goal**: Build the new directory structure alongside the old

1. **Create Framework Directory**
   ```bash
   mkdir -p framework/core
   mkdir -p framework/scripts
   mkdir -p framework/templates/context
   ```

2. **Create Application Directory**
   ```bash
   mkdir -p application
   ```

3. **Create Other Directories**
   ```bash
   mkdir -p infrastructure/docker
   mkdir -p infrastructure/kubernetes
   mkdir -p infrastructure/scripts
   mkdir -p examples/taskmaster
   mkdir -p docs/{getting-started,architecture,guides,api}
   ```

### Phase 3: Move Framework Components (Day 3)
**Goal**: Isolate framework components

1. **Move Core Framework Files**
   ```bash
   mv framework/*.md framework/core/
   mv scripts/spawn-agent.sh framework/scripts/
   mv scripts/context-manager.sh framework/scripts/
   mv scripts/validate-context.js framework/scripts/
   mv templates/agent-context-schema.json framework/templates/
   mv templates/context/* framework/templates/context/
   ```

2. **Update Framework References**
   - Update paths in spawn-agent.sh
   - Update paths in context-manager.sh
   - Update schema references

### Phase 4: Rename Application Directory (Day 4)
**Goal**: Eliminate the confusing nested structure

1. **Rename the Nested Directory**
   ```bash
   mv tony-ng application
   ```

2. **Update Application Structure**
   - Verify frontend/, backend/, and infrastructure/ are properly moved
   - Update any hardcoded references to "tony-ng/tony-ng"

### Phase 5: Consolidate Infrastructure (Day 5)
**Goal**: Centralize all deployment configurations

1. **Move Docker Configurations**
   ```bash
   mv application/infrastructure/docker/* infrastructure/docker/
   mv application/docker-compose*.yml infrastructure/docker/
   ```

2. **Move Kubernetes Configurations**
   ```bash
   mv application/infrastructure/kubernetes/* infrastructure/kubernetes/
   ```

3. **Update Path References**
   - Update Dockerfile paths
   - Update docker-compose volume mounts
   - Update k8s deployment specs

### Phase 6: Reorganize Documentation (Day 6)
**Goal**: Create clear, navigable documentation

1. **Move and Organize Docs**
   ```bash
   # Move installation and setup guides
   mv docs/installation/INSTALLATION.md docs/getting-started/
   
   # Move architecture docs
   mv docs/architecture/* docs/architecture/
   
   # Move user guides
   mv docs/USER-GUIDE-*.md docs/guides/
   
   # Create new overview docs
   # - docs/getting-started/QUICKSTART.md
   # - docs/architecture/OVERVIEW.md
   ```

2. **Update Documentation Links**
   - Fix all relative links in markdown files
   - Update README files at each level

### Phase 7: Update Build System (Day 7)
**Goal**: Simplify the build process

1. **Create Root package.json**
   ```json
   {
     "name": "tony-ng",
     "version": "2.0.0",
     "description": "Multi-Agent Development Platform",
     "private": true,
     "workspaces": [
       "application/frontend",
       "application/backend",
       "application/shared"
     ],
     "scripts": {
       "install:all": "npm install",
       "build:frontend": "npm run build --workspace=application/frontend",
       "build:backend": "npm run build --workspace=application/backend",
       "build:all": "npm run build:frontend && npm run build:backend",
       "dev": "npm run dev --workspace=application/backend",
       "test": "npm test --workspaces"
     }
   }
   ```

2. **Update CI/CD Configurations**
   - Update GitHub Actions workflows
   - Update build scripts
   - Update deployment scripts

### Phase 8: Move Examples (Day 8)
**Goal**: Organize example projects

1. **Move Test Projects**
   ```bash
   mv junk/test-autonomous-tony/* examples/taskmaster/
   rm -rf junk
   ```

2. **Add Example Documentation**
   - Create README for each example
   - Document how to run examples

### Phase 9: Testing and Validation (Day 9-10)
**Goal**: Ensure everything works with new structure

1. **Test Framework Components**
   - Run context validation tests
   - Test agent spawning
   - Verify handoff protocols

2. **Test Application**
   - Build frontend
   - Build backend
   - Run integration tests
   - Test Docker builds

3. **Test Deployment**
   - Build Docker images
   - Test docker-compose
   - Verify environment variables

### Phase 10: Finalization (Day 11)
**Goal**: Complete the migration

1. **Update All Documentation**
   - Update main README
   - Update CONTRIBUTING guide
   - Update deployment docs

2. **Clean Up**
   - Remove old empty directories
   - Remove deprecated scripts
   - Update .gitignore

3. **Create Migration Guide**
   - Document what changed
   - Provide update instructions for developers
   - List breaking changes

## Validation Checklist

- [ ] All tests pass with new structure
- [ ] Docker builds complete successfully
- [ ] Frontend builds and runs
- [ ] Backend builds and runs
- [ ] Agent spawning works
- [ ] Context system functions
- [ ] Documentation is accessible
- [ ] No broken imports
- [ ] CI/CD pipeline passes

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   ```bash
   git checkout main
   git branch -D restructure/clean-architecture
   ```

2. **Partial Rollback**
   - Identify which phase caused issues
   - Revert only affected changes
   - Document issues for retry

## Communication Plan

1. **Before Migration**:
   - Notify team of upcoming changes
   - Share this migration plan
   - Set migration schedule

2. **During Migration**:
   - Daily status updates
   - Document any deviations
   - Track issues in real-time

3. **After Migration**:
   - Announce completion
   - Share new structure guide
   - Provide support period

## Success Metrics

- **Code Clarity**: Team feedback on improved structure
- **Build Time**: No increase in build times
- **Development Velocity**: Easier to find and modify code
- **Onboarding**: New developers understand structure quickly
- **Maintenance**: Reduced time to implement changes

## Risk Mitigation

1. **Version Control**: All changes in feature branch
2. **Incremental Changes**: One phase at a time
3. **Continuous Testing**: Validate after each phase
4. **Team Alignment**: Regular check-ins
5. **Documentation**: Update as we go

---

This migration plan ensures a smooth transition from the current confusing structure to a clean, maintainable architecture. The phased approach minimizes risk while allowing for validation at each step.