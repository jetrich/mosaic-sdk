# MosAIc-MCP CI/CD Implementation Requirements

## Overview

This document establishes the specific CI/CD requirements for the MosAIc-MCP submodule based on analysis of its architecture, dependencies, and operational needs. These requirements ensure comprehensive testing of the Model Context Protocol server, database management system, and agent coordination capabilities.

## Table of Contents

- [Project Analysis](#project-analysis)
- [Critical Requirements](#critical-requirements)
- [Pipeline Architecture](#pipeline-architecture)
- [Testing Requirements](#testing-requirements)
- [Database Requirements](#database-requirements)
- [MCP Protocol Requirements](#mcp-protocol-requirements)
- [Service Integration Requirements](#service-integration-requirements)
- [Implementation Checklist](#implementation-checklist)

## Project Analysis

### **Project Type**: MCP Server with Database Management
- **Primary Function**: Model Context Protocol server for agent coordination
- **Architecture**: Node.js/TypeScript with SQLite database
- **Transport Modes**: HTTP and STDIO support
- **Key Dependencies**: @modelcontextprotocol/sdk, express, sqlite3, ollama

### **Key Components Identified**
1. **MCP Protocol Server** (`src/main.ts`, `src/server/`)
2. **Database Management** (`src/db/` with migrations)
3. **Hook System** (`src/hooks/` for agent coordination)
4. **Ollama Service Integration** (`src/services/`)
5. **Tool Management** (`src/tools/`)
6. **HTTP Server** (dual transport support)

### **Current Testing Infrastructure**
- **Jest Configuration**: Comprehensive test setup with coverage
- **Test Types**: Unit, integration, performance, security, coverage
- **Coverage Requirements**: HTML and LCOV reporting
- **TypeScript**: Strict mode with comprehensive type checking

## Critical Requirements

### **1. Database-Centric Pipeline**
The mosaic-mcp project requires database-focused CI/CD due to:
- SQLite database with migration system
- Complex migration runner with rollback capabilities
- Database schema validation
- Transaction integrity testing
- Backup and recovery procedures

### **2. Protocol Compliance Testing**
MCP protocol compliance requires:
- Protocol specification validation
- Message exchange testing
- Transport layer testing (HTTP + STDIO)
- Client-server communication validation
- Hook system verification

### **3. Service Integration Testing**
External service dependencies require:
- Ollama service health checks
- HTTP server lifecycle testing
- Agent coordination workflow validation
- Hook event execution testing

### **4. Strict TypeScript Requirements**
Ultra-strict TypeScript configuration requires:
- Enhanced type checking beyond standard templates
- Declaration file generation and validation
- Module resolution testing
- Compilation performance monitoring

## Pipeline Architecture

### **Recommended Template**: `mcp-server-pipeline.yml`
Based on analysis, the MosAIc-MCP project requires the specialized MCP server template because:

1. **Protocol-Specific Testing**: Needs MCP compliance validation
2. **Server Lifecycle Management**: HTTP and STDIO transport testing
3. **Communication Testing**: Message exchange and client coordination
4. **Performance Requirements**: Load testing for concurrent connections
5. **Security Testing**: Authentication and permission validation

### **Fallback Template**: `database-pipeline.yml`
If MCP-specific features are not immediately needed, use database template for:
- Migration testing (up/down/reset/validate)
- Schema validation and integrity
- Transaction testing
- Performance testing
- Backup procedures

## Testing Requirements

### **Phase 1: Standard Quality Checks**
```yaml
# Based on proven Tony patterns
install:        # Independent step
lint:           # ESLint with TypeScript support
typecheck:      # Strict TypeScript compilation
format:         # Prettier validation
```

### **Phase 2: Database Testing**
```yaml
db-setup:           # SQLite database initialization
migration-tests:    # Forward/backward migration testing
schema-validation:  # Database schema integrity
transaction-tests:  # ACID compliance testing
backup-tests:       # Backup/restore procedures
```

### **Phase 3: MCP Protocol Testing**
```yaml
protocol-validation:    # MCP specification compliance
server-lifecycle:       # HTTP/STDIO server startup/shutdown
communication-tests:    # Message exchange validation
client-simulation:      # Multi-client connection testing
hook-system-tests:      # Agent coordination validation
```

### **Phase 4: Service Integration**
```yaml
ollama-integration:     # Ollama service health and communication
http-endpoints:         # REST API testing
tool-execution:         # MCP tool validation
performance-tests:      # Load and concurrent connection testing
```

### **Phase 5: Security and Compliance**
```yaml
security-audit:         # npm audit + custom security tests
protocol-security:      # MCP security validation
authentication-tests:   # Access control testing
injection-testing:      # SQL injection and XSS prevention
```

## Database Requirements

### **Migration System Testing**
```bash
# Required migration commands to test
npm run migrate:run         # Execute pending migrations
npm run migrate:status      # Check migration state  
npm run migrate:rollback    # Test rollback procedures
npm run migrate:validate    # Validate migration files
npm run migrate:create      # Test new migration creation
```

### **Database Services**
```yaml
services:
  test-sqlite:
    image: alpine:latest    # SQLite is file-based
    volumes:
      - ./data:/data
  
  postgres:                 # For compatibility testing
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mcp_test
      POSTGRES_PASSWORD: mcp_test
      POSTGRES_DB: mcp_test_db
```

### **Test Databases**
- **Primary**: `sqlite://test-mcp.db` (main test database)
- **Migration**: `sqlite://test-migration.db` (migration testing)
- **Performance**: `sqlite://test-performance.db` (load testing)
- **Integration**: `sqlite://test-integration.db` (integration tests)

## MCP Protocol Requirements

### **Protocol Compliance Testing**
```yaml
mcp-validation:
  commands:
    - npm run test:mcp:protocol      # Protocol specification
    - npm run test:mcp:messages      # Message validation
    - npm run test:mcp:schema        # Schema compliance
    - npm run test:mcp:handshake     # Connection handshake
```

### **Transport Testing**
```yaml
stdio-transport:
  environment:
    MCP_TRANSPORT: stdio
  commands:
    - npm run test:stdio
    
http-transport:
  environment:
    MCP_TRANSPORT: http
    MCP_PORT: 3456
  commands:
    - npm run test:http
```

### **Tool Validation**
```yaml
tool-testing:
  commands:
    - npm run test:tools             # Tool registration/execution
    - npm run test:tool:project      # Project management tools
    - npm run test:tool:agent        # Agent coordination tools
    - npm run test:tool:ollama       # Ollama service tools
```

## Service Integration Requirements

### **Ollama Service Testing**
```yaml
ollama-tests:
  environment:
    OLLAMA_HOST: http://localhost:11434
    OLLAMA_TIMEOUT: 30000
  commands:
    - npm run test:ollama:health     # Health check validation
    - npm run test:ollama:models     # Model management
    - npm run test:ollama:chat       # Chat functionality
    - npm run test:ollama:generate   # Text generation
```

### **Hook System Validation**
```yaml
hook-tests:
  commands:
    - npm run test:hooks:registry    # Hook registration
    - npm run test:hooks:execution   # Hook execution
    - npm run test:hooks:coordination # Agent coordination
    - npm run test:hooks:events      # Event handling
```

### **HTTP Server Testing**
```yaml
http-server:
  environment:
    MCP_PORT: 3456
    MCP_HOST: localhost
  commands:
    - npm run test:server:startup    # Server lifecycle
    - npm run test:server:endpoints  # API endpoints
    - npm run test:server:cors       # CORS configuration
    - npm run test:server:health     # Health checks
```

## Implementation Checklist

### **Pre-Implementation Requirements**
- [ ] Verify all npm scripts exist in package.json
- [ ] Confirm database migration system is functional
- [ ] Test MCP protocol compliance locally
- [ ] Validate Ollama service integration
- [ ] Check TypeScript strict mode compilation

### **Pipeline Implementation Steps**
1. **Copy Template**
   ```bash
   cp templates/development/ci-cd/mcp-server-pipeline.yml mosaic-mcp/.woodpecker.yml
   ```

2. **Customize for MosAIc-MCP**
   - Update database paths to `data/tony-mcp.db`
   - Configure MCP ports (3456 for isolated testing)
   - Add project-specific npm scripts
   - Configure Ollama service environment variables

3. **Database Configuration**
   ```yaml
   environment:
     DATABASE_URL: "sqlite://test-mcp.db"
     MCP_DATABASE_URL: "sqlite://test-mcp.db" 
     NODE_ENV: test
   ```

4. **Service Configuration**
   ```yaml
   services:
     ollama:
       image: ollama/ollama:latest
       environment:
         OLLAMA_HOST: 0.0.0.0
       when:
         event: pull_request
   ```

### **Required npm Script Mapping**
Map existing scripts to pipeline requirements:
```json
{
  "build": "tsc",                           # ✓ Exists
  "test": "jest",                           # ✓ Exists  
  "test:coverage": "jest --coverage",       # ✓ Exists
  "typecheck": "tsc --noEmit",              # ✓ Exists
  "lint": "eslint . --ext .ts,.tsx",        # ✓ Exists
  "migrate:run": "node scripts/migrate.js run",     # ✓ Exists
  "migrate:validate": "node scripts/migrate.js validate" # ✓ Exists
}
```

### **Additional Scripts Needed**
```json
{
  "test:mcp:protocol": "jest --testNamePattern='protocol'",
  "test:mcp:communication": "jest --testNamePattern='communication'",
  "test:server:lifecycle": "jest src/server/ --testNamePattern='lifecycle'",
  "test:performance": "jest --testNamePattern='performance'",
  "test:security": "jest src/db/validation/security.test.ts"
}
```

## Success Criteria

### **Pipeline Validation**
- [ ] All quality checks pass (lint, typecheck, format)
- [ ] Database migrations execute successfully
- [ ] MCP protocol compliance validated
- [ ] Service integrations functional
- [ ] Test coverage above 80%
- [ ] Performance benchmarks met
- [ ] Security audits pass

### **Protocol Requirements**
- [ ] HTTP transport server starts/stops correctly
- [ ] STDIO transport connections establish
- [ ] All MCP tools execute without errors
- [ ] Hook system coordination functions
- [ ] Ollama service integration works

### **Database Requirements**  
- [ ] Migrations run forward and backward
- [ ] Schema validation passes
- [ ] Transaction integrity maintained
- [ ] Backup/restore procedures work
- [ ] Performance meets requirements

## Next Steps

1. **Implement E.072.002.01**: Create main CI pipeline using mcp-server-pipeline.yml template
2. **Test Pipeline**: Validate with sample commits and pull requests  
3. **Monitor Performance**: Establish baseline metrics for future optimization
4. **Documentation**: Update project README with CI/CD requirements
5. **Integration**: Ensure pipeline works with parent mosaic-sdk repository

---

**Version**: 1.0  
**Last Updated**: 2025-07-20  
**Based on**: Project analysis of MosAIc-MCP v0.0.1-beta.1