# Sequential Thinking MCP Test Configuration

## Local Testing Setup

### 1. OpenCode Configuration

Create or update your OpenCode configuration file:

**Location**: `~/.config/opencode/config.json` or project-level `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "MAX_THINKING_DEPTH": "6",
        "ENABLE_TASK_DECOMPOSITION": "true"
      }
    },
    "mosaic": {
      "command": "node",
      "args": ["packages/mcp-orchestrator/dist/main.js", "serve"],
      "cwd": "/home/jwoltje/src/mosaic-sdk",
      "env": {
        "SEQUENTIAL_THINKING_ENABLED": "true",
        "MOSAIC_CONFIG": "~/.config/mosaic/config.json"
      }
    }
  },
  "mode": {
    "sequential-plan": {
      "prompt": "You are using Sequential Thinking mode with MosAIc task decomposition tools.",
      "tools": {
        "mosaic_task_decompose": true,
        "mosaic_task_estimate_batch": true,
        "mosaic_task_assign_intelligent": true,
        "mosaic_task_analyze_complexity": true,
        "sequential-thinking": true
      }
    }
  }
}
```

### 2. Environment Variables

Set these environment variables for testing:

```bash
# Sequential Thinking Configuration
export SEQUENTIAL_THINKING_ENABLED=true
export SEQUENTIAL_THINKING_MAX_DEPTH=6
export SEQUENTIAL_THINKING_TIMEOUT=30000

# Task Decomposition Settings
export TASK_DECOMPOSITION_AUTO_ASSIGN=false
export TASK_DECOMPOSITION_DEFAULT_ESTIMATION=ai
export TASK_DECOMPOSITION_CACHE_TTL=3600

# API Usage Control
export API_RATE_LIMIT_PER_MINUTE=60
export API_BATCH_SIZE=50
export API_QUEUE_MAX_SIZE=1000

# MosAIc Configuration
export MOSAIC_CONFIG=~/.config/mosaic/config.json
export MOSAIC_DATA_DIR=~/.config/mosaic/data
export MOSAIC_LOG_LEVEL=debug
```

### 3. Test Commands

#### Basic Sequential Thinking Test

```bash
# Start OpenCode with sequential planning mode
opencode --mode sequential-plan

# Test sequential thinking decomposition
"Use sequential thinking to break down: Create a user authentication system with OAuth2, JWT tokens, and role-based access control"
```

#### MosAIc Task Decomposition Test

```bash
# Test the new decomposition tool
mosaic_task_decompose {
  "description": "Build a real-time chat application with user authentication, message history, and file sharing",
  "context": {
    "domain": "messaging",
    "constraints": ["websocket", "scalable", "secure"]
  },
  "options": {
    "maxDepth": 5,
    "includeEstimates": true,
    "autoAssign": false
  }
}
```

#### Batch Estimation Test

```bash
# Test batch estimation
mosaic_task_estimate_batch {
  "taskIds": ["T-1", "T-2", "T-3"],
  "estimationMethod": "ai",
  "confidence": "high"
}
```

#### Intelligent Assignment Test

```bash
# Test intelligent assignment
mosaic_task_assign_intelligent {
  "taskIds": ["T-1", "T-2", "T-3"],
  "strategy": "hybrid",
  "constraints": {
    "maxTasksPerAgent": 3,
    "requiredSkills": ["react", "typescript"]
  }
}
```

#### Complexity Analysis Test

```bash
# Test complexity analysis
mosaic_task_analyze_complexity {
  "description": "Implement a distributed microservices architecture with event sourcing, CQRS, and real-time analytics",
  "factors": ["technical", "domain", "integration", "scale"]
}
```

### 4. Expected Outputs

#### Task Decomposition Output

```
📋 Task Hierarchy Created:

🎯 Epic: Real-time Chat Application
   ID: E-1
   Estimated: 160h

📦 Features (3):
   - User Authentication [F-1] (40h)
   - Message System [F-2] (40h)
   - File Sharing [F-3] (40h)

📖 User Stories (6):
   - As a user, I want to register an account [S-1]
   - As a user, I want to send messages [S-2]
   - As a user, I want to share files [S-3]
   ... and 3 more

📊 Summary:
   Total Tasks: 25
   Total Hours: 160
   Hierarchy Depth: 5 levels
   Decomposition Time: 1250ms
```

#### Complexity Analysis Output

```
🔍 Complexity Analysis:

Overall Score: 8/10
Recommendation: High complexity - requires senior developer and careful planning

Factors:
- technical: 9/10
- domain: 7/10
- integration: 8/10
- scale: 8/10

Suggested Approach: Break into multiple epics with extensive testing
```

### 5. Troubleshooting

#### Common Issues

1. **Sequential Thinking server not found**
   ```bash
   # Install the server globally
   npm install -g @modelcontextprotocol/server-sequential-thinking
   ```

2. **MosAIc MCP server fails to start**
   ```bash
   # Build the orchestrator first
   cd packages/mcp-orchestrator
   npm run build
   ```

3. **Tools not appearing in OpenCode**
   ```bash
   # Check server status
   opencode --list-servers
   
   # Restart OpenCode
   opencode --restart
   ```

4. **Database connection errors**
   ```bash
   # Create the data directory
   mkdir -p ~/.config/mosaic/data
   
   # Check permissions
   chmod 755 ~/.config/mosaic/data
   ```

### 6. Development Testing

#### Unit Tests

```bash
# Run Sequential Thinking tests
cd packages/mcp-orchestrator
npm test -- --testNamePattern="SequentialThinking"

# Run hierarchy mapper tests
npm test -- --testNamePattern="TonyHierarchyMapper"
```

#### Integration Tests

```bash
# Test full decomposition flow
npm test -- --testNamePattern="decomposition"

# Test MCP tool integration
npm test -- --testNamePattern="SequentialTaskTools"
```

### 7. Performance Testing

#### Load Testing

```bash
# Test with large decomposition
mosaic_task_decompose {
  "description": "Build a complete e-commerce platform with inventory management, payment processing, shipping integration, customer support, analytics dashboard, mobile app, and admin panel",
  "options": {
    "maxDepth": 6,
    "includeEstimates": true
  }
}
```

#### Batch Processing

```bash
# Test batch estimation with many tasks
mosaic_task_estimate_batch {
  "taskIds": ["T-1", "T-2", ..., "T-100"],
  "estimationMethod": "ai"
}
```

### 8. Validation Checklist

- [ ] Sequential Thinking MCP server starts successfully
- [ ] MosAIc MCP orchestrator connects to Sequential Thinking
- [ ] Task decomposition creates proper hierarchy
- [ ] Estimates are reasonable and consistent
- [ ] Dependencies are correctly identified
- [ ] Agent assignment works with constraints
- [ ] Complexity analysis provides useful insights
- [ ] All tools respond within acceptable time limits
- [ ] Error handling works for invalid inputs
- [ ] Database operations complete successfully

### 9. Next Steps

After successful testing:

1. **Integrate with existing TaskService**
2. **Add real Sequential Thinking MCP client**
3. **Implement caching for decompositions**
4. **Add UI components for hierarchy visualization**
5. **Create workflow automation based on decomposition**
6. **Add performance monitoring and metrics**
7. **Implement advanced agent assignment algorithms**
8. **Create templates for common decomposition patterns**