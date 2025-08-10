# F.0001.04: Migration Tools for Existing Projects

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Effort**: 35 atomic tasks (~17.5 hours)

## Description

Create comprehensive migration tools to help existing projects transition to the new documentation structure. This includes analysis, planning, execution, and validation capabilities with full backup and rollback support.

## Acceptance Criteria

- [ ] Structure analyzer can scan and report on existing layouts
- [ ] Migration planner creates detailed migration plans
- [ ] File mover preserves git history
- [ ] Reference updater fixes all internal links
- [ ] Backup system allows full rollback
- [ ] Validation confirms successful migration
- [ ] Progress reporting keeps users informed

## Stories

1. [S.0001.04.01](../stories/S.0001.04.01-structure-analyzer.md) - Build structure analyzer
2. [S.0001.04.02](../stories/S.0001.04.02-migration-planner.md) - Create migration planner
3. [S.0001.04.03](../stories/S.0001.04.03-file-mover.md) - Implement file mover with history
4. [S.0001.04.04](../stories/S.0001.04.04-reference-updater.md) - Build reference updater
5. [S.0001.04.05](../stories/S.0001.04.05-backup-system.md) - Create backup and rollback system
6. [S.0001.04.06](../stories/S.0001.04.06-validation.md) - Implement validation and reporting

## Dependencies

- F.0001.01 (Core structure templates) - Need target structure
- F.0001.03 (Task management standardization) - Need standard structure

## Technical Notes

### Migration Process

1. **Analysis Phase**

   ```bash
   mosaic docs analyze
   # Outputs: current-structure.json
   ```

2. **Planning Phase**

   ```bash
   mosaic docs plan-migration
   # Outputs: migration-plan.json
   # Interactive review and adjustment
   ```

3. **Backup Phase**

   ```bash
   mosaic docs backup
   # Creates: .mosaic-backup-{timestamp}/
   ```

4. **Execution Phase**

   ```bash
   mosaic docs migrate --plan=migration-plan.json
   # Shows progress bar
   # Preserves git history
   ```

5. **Validation Phase**
   ```bash
   mosaic docs validate
   # Checks structure compliance
   # Reports any issues
   ```

### Common Migration Patterns

1. **Flat to Epic-Centric**
   - `atomic-tasks/*.md` → `epics/active/E.XXX/atomics/`
   - `planning/*.md` → `epics/active/E.XXX/planning/`

2. **Duplicate MANDATORY_STRUCTURE.md**
   - Keep `docs/task-management/MANDATORY_STRUCTURE.md`
   - Remove root-level duplicates
   - Update references

3. **Session Files**
   - Move to `agent-tracking/sessions/active/`
   - Update naming convention
   - Set up archive cron job

## Component Assignment

- **Primary**: mosaic-sdk (migration tooling)
- **Secondary**: mosaic (platform integration)
- **Supporting**: All components (testing migration)
