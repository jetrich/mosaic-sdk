# Epic Nested Structure Template

This directory contains the template structure for creating new epics following the MosAIc Stack nested hierarchical UPP standard.

## Usage

1. Copy this entire directory structure
2. Rename to your epic ID: `E.[0-9]XXX-epic-name`
3. Replace all template placeholders with actual content
4. Follow the nested organization for features/stories/tasks/subtasks/atomics

## Template Structure

```
E.XXXX-epic-name/                          # Copy and rename this directory
├── README.md.template                     # Epic overview template
├── STATUS.template                        # Status file template  
├── planning/                              # Epic-level planning
│   ├── technical-architecture.md.template
│   ├── token-usage-validation.md.template
│   └── implementation-strategy.md.template
├── workspace/                             # Epic-level workspace
│   ├── implementation-roadmap.md.template
│   ├── lessons-learned.md.template
│   └── decision-log.md.template
└── feature-template/                      # Copy for each feature
    ├── README.md.template                 # Feature overview template
    ├── planning/                          # Feature planning (optional)
    ├── workspace/                         # Feature workspace (optional)
    └── story-template/                    # Copy for each story
        ├── README.md.template             # Story overview template
        └── task-template/                 # Copy for each task
            ├── README.md.template         # Task overview (optional)
            └── subtask-template/          # Copy for each subtask
                ├── atomic-template.md     # Copy for each atomic task
                └── README.md.template     # Subtask organization guide
```

## Naming Convention

Replace template names with proper UPP IDs:
- `E.XXXX-epic-name` → `E.0005-my-epic-name`
- `feature-template` → `F.0005.01-feature-name`
- `story-template` → `S.0005.01.01-story-name`
- `task-template` → `T.0005.01.01.01-task-name`
- `subtask-template` → `ST.0005.01.01.01.01-subtask-name`
- `atomic-template.md` → `A.0005.01.01.01.01.01-atomic-name.md`

## Key Principles

1. **Nested Organization**: Each level contains its children as subdirectories
2. **Self-Contained**: Each README.md describes that level's scope
3. **Progressive Detail**: Higher levels are strategic, lower levels are tactical
4. **Consistent Naming**: Follow the strict E.XXXX.XX.XX.XX.XX.XX pattern

## See Also

- [UPP Nested Structure Standard](../standards/UPP-NESTED-STRUCTURE.md)
- [Migration Guide](migration-guide.md)
- [Epic Creation Checklist](epic-creation-checklist.md)