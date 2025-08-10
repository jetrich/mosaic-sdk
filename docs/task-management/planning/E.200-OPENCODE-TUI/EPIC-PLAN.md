# Epic E.200: OpenCode TUI Integration

**Epic ID**: E.200  
**Status**: Planning  
**Priority**: High  
**Duration**: 4-5 weeks  
**Start Date**: 2025-07-21  
**Dependencies**: E.100 (NPM Package Architecture) - Completed  

## Executive Summary

Integrate OpenCode's sophisticated terminal UI with MosAIc Stack through a plugin-based architecture that maintains OpenCode's automatic update capability while adding enterprise task management and multi-project orchestration features.

## Business Value

- **Enhanced Developer Experience**: Professional-grade TUI without development overhead
- **Rapid Time-to-Market**: Leverage existing, mature OpenCode platform
- **Extensibility**: Plugin architecture enables future enhancements
- **Cost Efficiency**: No need to develop custom TUI from scratch
- **Future-Proof**: Automatic updates from OpenCode team

## Success Criteria

1. ✅ OpenCode TUI accessible through MosAIc wrapper commands
2. ✅ Task synchronization between OpenCode and MosAIc systems
3. ✅ Consistent styling with mosaic-site design system
4. ✅ Web UI with tabbed interface (agent chat + task monitoring)
5. ✅ No modifications to OpenCode core (plugin-only approach)
6. ✅ Complete documentation for setup and usage
7. ✅ >95% test coverage for integration layer

## Technical Approach

### Integration Strategy
- **Plugin Architecture**: MCP server extensions for MosAIc features
- **Configuration-Driven**: Custom modes and tools via opencode.json
- **Shell Wrapper**: Additional commands while delegating to OpenCode
- **Style Sharing**: Common design tokens between projects

### Key Components
1. **@mosaicstack/mcp-orchestrator**: MosAIc MCP server
2. **@mosaicstack/opencode-adapter**: Integration layer
3. **Web UI Extensions**: Tabbed interface with terminal emulator
4. **Shared Component Library**: Consistent styling

## Feature Breakdown

### F.200.01: MCP Server Plugin Architecture
**Duration**: 1 week  
**Description**: Create MosAIc MCP server that extends OpenCode capabilities  
**Deliverables**:
- MosAIc-specific MCP tools
- Task management extensions
- Project coordination capabilities
- Agent orchestration tools

### F.200.02: Configuration Integration
**Duration**: 3 days  
**Description**: Integrate with OpenCode via configuration files  
**Deliverables**:
- Custom mode definitions
- Tool configurations
- Hook integrations
- Provider settings

### F.200.03: Web UI Tabbed Interface
**Duration**: 1.5 weeks  
**Description**: Create monitoring UI with tabbed interface  
**Deliverables**:
- Tab system component
- Terminal integration (xterm.js)
- Task monitoring views
- Minimal sidebar for agent chat

### F.200.04: Task Synchronization
**Duration**: 1 week  
**Description**: Synchronize tasks between OpenCode and MosAIc  
**Deliverables**:
- Real-time task updates
- Persistent task storage
- Cross-session coordination
- Status synchronization

### F.200.05: Style Consistency Framework
**Duration**: 3 days  
**Description**: Ensure consistent styling across platforms  
**Deliverables**:
- Shared design tokens
- Component library extension
- Theme synchronization
- Documentation

## Risk Analysis

### Technical Risks
1. **Bun Runtime Compatibility**
   - Risk: MosAIc uses Node.js, OpenCode uses Bun
   - Mitigation: Run OpenCode in subprocess/container

2. **API Stability**
   - Risk: OpenCode API changes break integration
   - Mitigation: Version lock with controlled updates

3. **Performance Overhead**
   - Risk: Client-server architecture adds latency
   - Mitigation: Local socket communication, caching

### Business Risks
1. **Dependency on External Project**
   - Risk: OpenCode development stops
   - Mitigation: Fork capability, active community

2. **Feature Limitations**
   - Risk: Some MosAIc features may not map well
   - Mitigation: Clear documentation of limitations

## Resource Requirements

### Development Team
- **Tech Lead**: Tony (Coordination)
- **Backend**: Benjamin (MCP server)
- **Frontend**: Fiona (Web UI)
- **Full Stack**: Felix (Integration)
- **QA**: Quinn (Testing)
- **DevOps**: Oliver (Deployment)

### Infrastructure
- Development environment with Bun
- Test servers for integration testing
- CI/CD pipeline updates

## Dependencies

### Internal Dependencies
- E.100: NPM Package Architecture (Completed)
- MosAIc Stack core packages
- mosaic-site design system

### External Dependencies
- OpenCode (latest version)
- Bun runtime
- xterm.js
- node-pty

## Constraints

1. **No Core Modifications**: Must not modify OpenCode source
2. **Backward Compatibility**: Must maintain existing MosAIc APIs
3. **Performance**: <100ms additional latency for commands
4. **Security**: Maintain enterprise security standards

## Acceptance Criteria

### Functional Requirements
- [ ] OpenCode TUI launches via MosAIc commands
- [ ] MosAIc tasks appear in OpenCode todo system
- [ ] Web UI displays terminal and task monitoring
- [ ] Style consistency with mosaicstack.dev
- [ ] Plugin installation is automated

### Non-Functional Requirements
- [ ] Performance: <100ms command latency
- [ ] Reliability: 99.9% uptime
- [ ] Security: Pass security audit
- [ ] Documentation: Complete user and developer guides
- [ ] Testing: >95% code coverage

## Timeline

### Week 1: Foundation
- Documentation and planning
- MCP server architecture
- Basic integration setup

### Week 2: Core Development
- MCP server implementation
- Configuration integration
- Initial testing

### Week 3: Web UI
- Tab system implementation
- Terminal integration
- Task monitoring views

### Week 4: Integration
- Task synchronization
- Style consistency
- End-to-end testing

### Week 5: Polish
- Documentation completion
- Performance optimization
- Release preparation

## Success Metrics

1. **Developer Adoption**: >80% of MosAIc users adopt TUI
2. **Performance**: <100ms additional latency
3. **Reliability**: <0.1% error rate
4. **User Satisfaction**: >4.5/5 rating
5. **Maintenance**: <2 hours/week ongoing maintenance

## Notes

- This epic represents a strategic integration that leverages best-in-class tooling
- Focus on extensibility ensures future enhancement capabilities
- Documentation-first approach ensures smooth handoffs between agents
- Plugin architecture maintains clean separation of concerns