# MCP Integration Test Guide

**Purpose**: Verify MCP servers are working correctly with Claude Code

## 🧪 Quick Tests

### 1. Check Server Status
After reloading Claude Code with the updated configuration, check if the MCP servers are listed.

### 2. Test Mosaic Orchestrator Tools
Try these commands to verify the orchestrator is working:

```
# List all projects
mosaic_project_list

# Create a test task
mosaic_task_create "Test task for MCP integration" "Testing if MCP is working"

# List tasks
mosaic_task_list
```

### 3. Test Sequential Thinking
Try decomposing a high-level task:

```
# Decompose a task
mosaic_task_decompose "Build a REST API with authentication" 
```

### 4. Test Task Assignment
```
# List available agents
mosaic_agent_list

# Intelligently assign tasks
mosaic_task_assign_intelligent ["task-id-here"]
```

## 📋 Expected Results

### ✅ Success Indicators
- Tools are available and respond
- Tasks are created in the database
- Sequential Thinking returns decomposed tasks
- No errors in Claude Code logs

### ❌ Failure Indicators
- "Tool not found" errors
- Server connection failures
- Timeout errors
- Empty responses

## 🔧 Troubleshooting

### If servers don't start:
1. Check Claude Code logs
2. Verify paths in `.claude/mcp.json`
3. Test servers manually with startup script
4. Check file permissions

### If tools aren't available:
1. Reload Claude Code
2. Check server is running
3. Verify tool registration in logs
4. Test with simple tool first

## 🚀 Next Steps

Once basic tests pass:
1. Create a complex project structure
2. Test full task decomposition workflow
3. Assign tasks to multiple agents
4. Monitor task progress
5. Test error scenarios

---

**Note**: The MCP servers must be restarted in Claude Code after configuration changes. Use Cmd+R (Mac) or Ctrl+R (Windows/Linux) to reload.