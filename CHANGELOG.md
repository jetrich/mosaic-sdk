# Changelog

All notable changes to the MosAIc SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete Tony 2.8.0 implementation with mandatory MCP integration
- Comprehensive CI/CD pipeline with Woodpecker CI
- Docker and Kubernetes deployment configurations
- Production-ready environment configurations
- Comprehensive documentation structure
- Git repository best practices implementation
- Pre-push checklists and workflows

### Changed
- Enhanced .gitignore with comprehensive patterns
- Updated README with complete setup instructions
- Restructured documentation hierarchy
- Improved submodule management

### Fixed
- Repository cleanup and organization
- Submodule synchronization issues
- Environment configuration conflicts

## [0.1.0] - 2025-07-19

### Added
- Initial MosAIc SDK structure
- Core components: mosaic, mosaic-mcp, mosaic-dev, tony
- Basic MCP integration foundation
- Git submodule architecture
- Development environment setup
- Initial documentation framework

### Changed
- Migrated from Tony SDK to MosAIc SDK
- Renamed tony-mcp to mosaic-mcp
- Renamed tony-dev to mosaic-dev

### Deprecated
- Legacy Tony SDK structure
- Old naming conventions

### Removed
- Redundant configuration files
- Legacy documentation

### Security
- Added environment variable protection
- Implemented secure credential management

[Unreleased]: https://github.com/jetrich/mosaic-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jetrich/mosaic-sdk/releases/tag/v0.1.0