# Phase 4 Enhancement - Multi-Provider MCP Support

**Epic**: E.200 - OpenCode TUI Integration  
**Phase**: 4 - Multi-Provider Enhancement  
**Status**: PLANNING  
**Priority**: CRITICAL  
**Estimated Duration**: 2 weeks

## Critical Insight

OpenCode is a TUI wrapper that supports multiple LLM providers (Claude, Gemini, Ollama, etc.). The MosAIc MCP server must be available to ALL providers, not just Claude. This requires a provider-agnostic approach to MCP integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    OpenCode TUI                         │
├─────────────────────────────────────────────────────────┤
│              Provider Abstraction Layer                 │
├──────────┬──────────┬──────────┬──────────┬───────────┤
│  Claude  │  Gemini  │  Ollama  │   GPT    │  Others   │
├──────────┴──────────┴──────────┴──────────┴───────────┤
│                  MCP Protocol Layer                     │
├─────────────────────────────────────────────────────────┤
│              MosAIc MCP Server (Shared)                 │
└─────────────────────────────────────────────────────────┘
```

## Enhancement Structure (UPP Methodology)

### FEATURE F.200.10: Multi-Provider MCP Architecture

**Status**: PLANNING  
**Priority**: CRITICAL  
**Duration**: 1 week

#### STORY S.200.10.01: Provider-Agnostic MCP Design

**Description**: Ensure MCP server works with all LLM providers  
**Acceptance Criteria**:

- MCP server accessible to all OpenCode providers
- Consistent tool behavior across providers
- No provider-specific dependencies

##### TASK T.200.10.01.01: Analyze OpenCode Provider Architecture

**Duration**: 3 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: None  
**Subtasks**:

- ST.200.10.01.01.01: Study OpenCode provider abstraction (30 min)
- ST.200.10.01.01.02: Identify provider communication patterns (30 min)
- ST.200.10.01.01.03: Document MCP integration points (30 min)
- ST.200.10.01.01.04: Map provider capabilities (30 min)
- ST.200.10.01.01.05: Identify compatibility requirements (30 min)
- ST.200.10.01.01.06: Create architecture diagram (30 min)

##### TASK T.200.10.01.02: Design Universal MCP Interface

**Duration**: 4 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.10.01.01  
**Subtasks**:

- ST.200.10.01.02.01: Define provider-agnostic tool interface (30 min)
- ST.200.10.01.02.02: Create universal request/response format (30 min)
- ST.200.10.01.02.03: Design capability negotiation protocol (30 min)
- ST.200.10.01.02.04: Implement provider detection logic (30 min)
- ST.200.10.01.02.05: Add provider-specific adapters (30 min)
- ST.200.10.01.02.06: Create fallback mechanisms (30 min)
- ST.200.10.01.02.07: Test with multiple providers (30 min)
- ST.200.10.01.02.08: Document interface specification (30 min)

#### STORY S.200.10.02: Provider Capability Mapping

**Description**: Map MosAIc tools to provider capabilities  
**Acceptance Criteria**:

- Each provider's capabilities documented
- Tool availability matrix created
- Graceful degradation for limited providers

##### TASK T.200.10.02.01: Create Provider Capability Matrix

**Duration**: 3 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: T.200.10.01.01  
**Subtasks**:

- ST.200.10.02.01.01: Test Claude capabilities (30 min)
- ST.200.10.02.01.02: Test Gemini capabilities (30 min)
- ST.200.10.02.01.03: Test Ollama capabilities (30 min)
- ST.200.10.02.01.04: Test GPT capabilities (30 min)
- ST.200.10.02.01.05: Document capability differences (30 min)
- ST.200.10.02.01.06: Create compatibility matrix (30 min)

##### TASK T.200.10.02.02: Implement Provider Adapters

**Duration**: 6 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.10.02.01  
**Subtasks**:

- ST.200.10.02.02.01: Create base adapter interface (30 min)
- ST.200.10.02.02.02: Implement Claude adapter (30 min)
- ST.200.10.02.02.03: Implement Gemini adapter (30 min)
- ST.200.10.02.02.04: Implement Ollama adapter (30 min)
- ST.200.10.02.02.05: Implement GPT adapter (30 min)
- ST.200.10.02.02.06: Add adapter tests (30 min)
- ST.200.10.02.02.07: Create adapter factory (30 min)
- ST.200.10.02.02.08: Implement adapter selection logic (30 min)
- ST.200.10.02.02.09: Add error handling (30 min)
- ST.200.10.02.02.10: Test cross-provider compatibility (30 min)
- ST.200.10.02.02.11: Document adapter usage (30 min)
- ST.200.10.02.02.12: Create provider examples (30 min)

### FEATURE F.200.11: Natural Language Processing for All Providers

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 1 week

#### STORY S.200.11.01: Universal Tool Descriptions

**Description**: Create tool descriptions that work across all providers  
**Acceptance Criteria**:

- Descriptions optimized for each provider's NLP
- Consistent trigger phrases across providers
- Provider-specific optimizations where needed

##### TASK T.200.11.01.01: Analyze Provider NLP Differences

**Duration**: 3 hours  
**Agent**: ML-LEARNING-MARCUS  
**Dependencies**: None  
**Subtasks**:

- ST.200.11.01.01.01: Test Claude's natural language understanding (30 min)
- ST.200.11.01.01.02: Test Gemini's pattern recognition (30 min)
- ST.200.11.01.01.03: Test Ollama's prompt handling (30 min)
- ST.200.11.01.01.04: Test GPT's intent detection (30 min)
- ST.200.11.01.01.05: Document NLP differences (30 min)
- ST.200.11.01.01.06: Create optimization strategies (30 min)

##### TASK T.200.11.01.02: Create Universal Tool Descriptions

**Duration**: 4 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: T.200.11.01.01  
**Subtasks**:

- ST.200.11.01.02.01: Write base tool descriptions (30 min)
- ST.200.11.01.02.02: Add provider-specific hints (30 min)
- ST.200.11.01.02.03: Include trigger phrase examples (30 min)
- ST.200.11.01.02.04: Add usage patterns (30 min)
- ST.200.11.01.02.05: Create fallback descriptions (30 min)
- ST.200.11.01.02.06: Test with each provider (30 min)
- ST.200.11.01.02.07: Refine based on results (30 min)
- ST.200.11.01.02.08: Document best practices (30 min)

#### STORY S.200.11.02: Provider-Specific Optimizations

**Description**: Optimize performance for each provider  
**Acceptance Criteria**:

- Provider-specific caching implemented
- Response time optimized per provider
- Resource usage minimized

##### TASK T.200.11.02.01: Implement Provider Caching

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: F.200.10 completion  
**Subtasks**:

- ST.200.11.02.01.01: Design caching strategy (30 min)
- ST.200.11.02.01.02: Implement provider cache keys (30 min)
- ST.200.11.02.01.03: Add cache invalidation logic (30 min)
- ST.200.11.02.01.04: Create cache warming (30 min)
- ST.200.11.02.01.05: Test cache effectiveness (30 min)
- ST.200.11.02.01.06: Monitor cache performance (30 min)

##### TASK T.200.11.02.02: Optimize Provider Communication

**Duration**: 4 hours  
**Agent**: PERF-PERFORMANCE-PETER  
**Dependencies**: T.200.11.02.01  
**Subtasks**:

- ST.200.11.02.02.01: Profile provider latencies (30 min)
- ST.200.11.02.02.02: Implement connection pooling (30 min)
- ST.200.11.02.02.03: Add request batching (30 min)
- ST.200.11.02.02.04: Optimize payload sizes (30 min)
- ST.200.11.02.02.05: Implement streaming where supported (30 min)
- ST.200.11.02.02.06: Add timeout handling (30 min)
- ST.200.11.02.02.07: Test optimizations (30 min)
- ST.200.11.02.02.08: Document performance gains (30 min)

### FEATURE F.200.12: OpenCode Configuration Management

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 3 days

#### STORY S.200.12.01: Unified Configuration System

**Description**: Single configuration that works for all providers  
**Acceptance Criteria**:

- One config file for all providers
- Provider-specific sections where needed
- Automatic provider detection

##### TASK T.200.12.01.01: Design Unified Config Schema

**Duration**: 2 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: None  
**Subtasks**:

- ST.200.12.01.01.01: Analyze OpenCode config structure (30 min)
- ST.200.12.01.01.02: Design provider-agnostic schema (30 min)
- ST.200.12.01.01.03: Add provider-specific sections (30 min)
- ST.200.12.01.01.04: Document configuration options (30 min)

##### TASK T.200.12.01.02: Implement Config Generator

**Duration**: 3 hours  
**Agent**: DEVOPS-OPERATIONS-OLIVER  
**Dependencies**: T.200.12.01.01  
**Subtasks**:

- ST.200.12.01.02.01: Create config template (30 min)
- ST.200.12.01.02.02: Add provider detection (30 min)
- ST.200.12.01.02.03: Implement path resolution (30 min)
- ST.200.12.01.02.04: Add validation logic (30 min)
- ST.200.12.01.02.05: Create setup wizard (30 min)
- ST.200.12.01.02.06: Test with all providers (30 min)

#### STORY S.200.12.02: Mode Configuration for All Providers

**Description**: Ensure all modes work with all providers  
**Acceptance Criteria**:

- mosaic-plan mode works with all providers
- mosaic-execute mode works with all providers
- Provider limitations documented

##### TASK T.200.12.02.01: Implement Mode Compatibility

**Duration**: 3 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.12.01.02  
**Subtasks**:

- ST.200.12.02.01.01: Test mosaic-plan with each provider (30 min)
- ST.200.12.02.01.02: Test mosaic-execute with each provider (30 min)
- ST.200.12.02.01.03: Identify mode limitations (30 min)
- ST.200.12.02.01.04: Implement fallback behaviors (30 min)
- ST.200.12.02.01.05: Add mode validation (30 min)
- ST.200.12.02.01.06: Document compatibility matrix (30 min)

### FEATURE F.200.13: Multi-Provider Testing Suite

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 3 days

#### STORY S.200.13.01: Cross-Provider Testing

**Description**: Comprehensive testing across all providers  
**Acceptance Criteria**:

- All tools tested with all providers
- Performance benchmarks for each provider
- Compatibility issues documented

##### TASK T.200.13.01.01: Create Provider Test Matrix

**Duration**: 4 hours  
**Agent**: TEST-AUTOMATION-TARA  
**Dependencies**: All implementation tasks  
**Subtasks**:

- ST.200.13.01.01.01: Design test scenarios (30 min)
- ST.200.13.01.01.02: Create provider test harness (30 min)
- ST.200.13.01.01.03: Implement tool tests per provider (30 min)
- ST.200.13.01.01.04: Add performance benchmarks (30 min)
- ST.200.13.01.01.05: Create compatibility tests (30 min)
- ST.200.13.01.01.06: Implement CI matrix builds (30 min)
- ST.200.13.01.01.07: Add regression tests (30 min)
- ST.200.13.01.01.08: Document test results (30 min)

##### TASK T.200.13.01.02: Provider Integration Testing

**Duration**: 3 hours  
**Agent**: QA-QUALITY-QUINN  
**Dependencies**: T.200.13.01.01  
**Subtasks**:

- ST.200.13.01.02.01: Test provider switching (30 min)
- ST.200.13.01.02.02: Test concurrent providers (30 min)
- ST.200.13.01.02.03: Test error scenarios (30 min)
- ST.200.13.01.02.04: Test resource limits (30 min)
- ST.200.13.01.02.05: Validate results consistency (30 min)
- ST.200.13.01.02.06: Create test report (30 min)

### FEATURE F.200.14: Documentation for Multi-Provider Support

**Status**: PLANNING  
**Priority**: MEDIUM  
**Duration**: 2 days

#### STORY S.200.14.01: Provider-Specific Documentation

**Description**: Documentation for each supported provider  
**Acceptance Criteria**:

- Setup guide for each provider
- Capability documentation per provider
- Troubleshooting for each provider

##### TASK T.200.14.01.01: Create Provider Guides

**Duration**: 4 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: All testing complete  
**Subtasks**:

- ST.200.14.01.01.01: Write Claude setup guide (30 min)
- ST.200.14.01.01.02: Write Gemini setup guide (30 min)
- ST.200.14.01.01.03: Write Ollama setup guide (30 min)
- ST.200.14.01.01.04: Write GPT setup guide (30 min)
- ST.200.14.01.01.05: Create provider comparison (30 min)
- ST.200.14.01.01.06: Add troubleshooting sections (30 min)
- ST.200.14.01.01.07: Include examples per provider (30 min)
- ST.200.14.01.01.08: Review and polish (30 min)

##### TASK T.200.14.01.02: Create Migration Guide

**Duration**: 2 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: T.200.14.01.01  
**Subtasks**:

- ST.200.14.01.02.01: Document migration paths (30 min)
- ST.200.14.01.02.02: Create provider switching guide (30 min)
- ST.200.14.01.02.03: Add data migration steps (30 min)
- ST.200.14.01.02.04: Include rollback procedures (30 min)

## Critical Implementation Notes

### Provider Compatibility Matrix

| Feature                | Claude | Gemini | Ollama | GPT | Notes                          |
| ---------------------- | ------ | ------ | ------ | --- | ------------------------------ |
| Task Creation          | ✅     | ✅     | ✅     | ✅  | All providers support          |
| Agent Spawn            | ✅     | ✅     | ⚠️     | ✅  | Ollama may have limitations    |
| Workflow Orchestration | ✅     | ✅     | ⚠️     | ✅  | Complex workflows need testing |
| Natural Language       | ✅     | ✅     | ⚠️     | ✅  | Ollama needs specific prompts  |
| Performance Monitoring | ✅     | ✅     | ✅     | ✅  | Universal support              |

### Key Architecture Decisions

1. **Single MCP Server**: One MosAIc MCP server serves all providers
2. **Provider Adapters**: Thin adapters handle provider-specific quirks
3. **Capability Detection**: Runtime detection of provider capabilities
4. **Graceful Degradation**: Limited providers get reduced functionality
5. **Universal Config**: One configuration file for all providers

### Performance Targets

- **Provider Detection**: <100ms
- **Tool Execution**: <50ms overhead (provider-agnostic)
- **Provider Switching**: <500ms
- **Cache Hit Rate**: >80% for common operations

## Summary

### Total Estimated Duration

- **Multi-Provider Enhancement**: 50-60 hours (2 weeks with parallel work)
- **Critical Path**: Architecture → Implementation → Testing → Documentation

### Success Metrics

- All OpenCode providers can access MosAIc tools
- Performance overhead <50ms for all providers
- 100% provider coverage in documentation
- Zero provider-specific bugs in production

### Risk Mitigation

- **Provider API Changes**: Adapter pattern isolates changes
- **Performance Variations**: Provider-specific optimizations
- **Capability Differences**: Graceful degradation implemented
- **Testing Complexity**: Automated multi-provider test suite
