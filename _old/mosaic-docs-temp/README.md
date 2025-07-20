# MosAIc Documentation Repository

This repository contains all documentation for the MosAIc platform and its components.

## Structure

```
mosaic-docs/
├── bookstack/           # BookStack synchronization configuration
├── standards/           # Documentation standards and guidelines
├── platform/            # Platform-wide documentation
└── submodules/          # Component-specific documentation
    ├── tony/           # Tony Framework documentation
    ├── mosaic-mcp/     # MCP Server documentation
    ├── mosaic/         # Core Mosaic platform documentation
    └── mosaic-sdk/     # SDK documentation
```

## Quick Links

- [Documentation Standards](standards/DOCUMENTATION-GUIDE.md)
- [Submodule Requirements](standards/SUBMODULE-DOC-REQUIREMENTS.md)
- [Platform Architecture](platform/architecture/overview.md)

## BookStack Integration

This repository automatically syncs with BookStack for online documentation access. See [bookstack/README.md](bookstack/README.md) for configuration details.

## Contributing

All documentation must follow the standards defined in [standards/DOCUMENTATION-GUIDE.md](standards/DOCUMENTATION-GUIDE.md).

### Workflow
1. Create feature branch from `main`
2. Make documentation updates
3. Ensure all links are valid
4. Submit PR for review
5. CI/CD will validate and sync to BookStack upon merge

## CI/CD

Documentation is validated through Woodpecker CI:
- Markdown linting
- Link validation  
- Structure compliance
- BookStack sync (on main branch)