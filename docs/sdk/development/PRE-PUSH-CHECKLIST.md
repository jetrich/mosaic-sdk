# Pre-Push Checklist for MosAIc SDK

Before pushing to the remote repository, ensure you have completed all items in this checklist:

## Code Quality
- [ ] All code follows the project's style guide
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] TypeScript compilation succeeds (`npm run build:all`)
- [ ] No console.log or debug statements left in production code
- [ ] All TODO comments have been addressed or documented

## Testing
- [ ] All unit tests pass (`npm test`)
- [ ] Integration tests pass if applicable
- [ ] New features have corresponding tests
- [ ] Test coverage meets minimum threshold (80%)
- [ ] Manual testing completed for UI changes

## Documentation
- [ ] README.md is up to date
- [ ] API documentation is current
- [ ] CHANGELOG.md updated with your changes
- [ ] New features documented in relevant guides
- [ ] JSDoc comments added for public APIs

## Git Hygiene
- [ ] Commits follow conventional commit format
- [ ] Branch name follows naming convention (feat/, fix/, docs/, etc.)
- [ ] No merge commits in feature branches (use rebase)
- [ ] Commit messages are clear and descriptive
- [ ] No large files accidentally included (>100MB)

## Security
- [ ] No hardcoded credentials or API keys
- [ ] No sensitive data in commit history
- [ ] Environment variables documented in .env.example
- [ ] Dependencies audited for vulnerabilities (`npm audit`)
- [ ] No exposed internal endpoints or debug modes

## Submodules
- [ ] Submodule references point to stable commits
- [ ] Submodule changes committed in both repos
- [ ] Submodule tests pass independently
- [ ] Version compatibility verified

## Build & Deployment
- [ ] Docker build succeeds (`docker build -t mosaic-sdk .`)
- [ ] CI/CD configuration valid (`.woodpecker.yml`)
- [ ] Environment configurations tested
- [ ] No breaking changes without version bump
- [ ] Migration scripts provided if needed

## Final Checks
- [ ] `git status` shows clean working directory
- [ ] No untracked files that should be committed
- [ ] `.gitignore` properly configured
- [ ] File permissions are correct (especially for scripts)
- [ ] Large files use Git LFS if necessary

## Push Commands
Once all checks pass, push with:
```bash
# For feature branches
git push origin feature/your-feature-name

# For main branch (requires approval)
git push origin main

# For tags
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

## Post-Push
- [ ] Verify CI/CD pipeline passes
- [ ] Create pull request with detailed description
- [ ] Request code review from team members
- [ ] Update project board/issues
- [ ] Notify team in communication channels