# MCP Tool Registration Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Capabilities: none" in Claude Code

**Symptoms:**
- Claude Code shows "Capabilities: none" when checking MCP server status
- No tools appear in the tools list
- `/mcp` command shows empty or minimal output

**Root Causes & Solutions:**

#### 1a. Transport Mismatch
**Cause:** MCP server running as standalone process instead of child process
**Solution:** 
- Kill any standalone MCP server processes
- Ensure Claude Code spawns the server via its configuration
- Never run the MCP server manually in a terminal

#### 1b. Raw Zod Schemas
**Cause:** Passing Zod schemas directly instead of JSON Schema
**Solution:**
```typescript
// ❌ Wrong
inputSchema: MyZodSchema

// ✅ Correct
inputSchema: zodToJsonSchema(MyZodSchema)
```

#### 1c. Missing Dependencies
**Cause:** Node modules not installed in deployment location
**Solution:**
```bash
npm install --production --prefix ~/.config/mosaic/mcp-server
```

### Issue 2: Double-Namespacing of Tools

**Symptoms:**
- Tools registered with names like `mosaic_agent_mosaic_agent_deploy`
- Tool calls fail with "tool not found" errors
- Duplicate prefixes in tool names

**Root Cause:**
Tools already include namespace in their name, but `registerToolsFromCategory` adds it again.

**Solution:**
```typescript
// ❌ Wrong - tool already has namespace
{
  name: 'mosaic_agent_deploy',  // Already has prefix
  // ...
}

// Then registerToolsFromCategory adds another:
const namespacedName = `${namespace}_${tool.name}`;
// Results in: mosaic_agent_mosaic_agent_deploy

// ✅ Correct - tool uses simple name
{
  name: 'deploy',  // Simple name
  // ...
}
// registerToolsFromCategory adds namespace:
// Results in: mosaic_agent_deploy
```

### Issue 3: Tools Not Appearing After Changes

**Symptoms:**
- Made changes to tool files but tools don't update
- Old tool definitions still being used
- Changes not reflected in Claude Code

**Solutions:**

1. **Rebuild the TypeScript:**
   ```bash
   cd packages/mcp-server
   npm run build
   ```

2. **Redeploy to ~/.config/mosaic:**
   ```bash
   bash scripts/install-central-mcp.sh
   ```

3. **Restart Claude Code's MCP connection:**
   - Close Claude Code completely
   - Reopen and the MCP server will be respawned

### Issue 4: Tool Schema Validation Errors

**Symptoms:**
- "Invalid input" errors when calling tools
- Schema mismatch errors
- Required fields not recognized

**Common Causes:**

1. **Incorrect Schema Conversion:**
   ```typescript
   // Check the converted schema
   const schema = zodToJsonSchema(MySchema);
   console.log(JSON.stringify(schema, null, 2));
   ```

2. **Missing Required Array:**
   ```typescript
   // Ensure required fields are properly identified
   z.object({
     required_field: z.string(),  // Should be in "required"
     optional_field: z.string().optional()  // Should NOT be in "required"
   })
   ```

3. **Type Mismatches:**
   ```typescript
   // Ensure types convert correctly
   z.number() → { type: "number" }  // Not "integer"
   z.string() → { type: "string" }
   ```

### Issue 5: Server Crashes on Startup

**Symptoms:**
- EPIPE errors
- "Cannot find module" errors
- Server starts but immediately exits

**Solutions:**

1. **Check Dependencies:**
   ```bash
   cd packages/mcp-server
   npm install
   npm run build
   ```

2. **Verify Configuration:**
   ```bash
   node dist/main.js config --validate
   ```

3. **Check Log Files:**
   ```bash
   tail -f ~/.config/mosaic/logs/mcp.log
   ```

### Issue 6: Tools Work Locally but Not in Production

**Symptoms:**
- Tools work in development but fail when deployed
- Different behavior between environments

**Checklist:**

1. **Environment Variables:**
   ```bash
   # Check what's set
   env | grep MOSAIC
   ```

2. **Configuration Paths:**
   ```javascript
   // Development
   MOSAIC_CONFIG=./config.json
   
   // Production
   MOSAIC_CONFIG=~/.config/mosaic/config.json
   ```

3. **Database Location:**
   ```bash
   # Ensure database exists and is writable
   ls -la ~/.config/mosaic/data/mcp.db
   ```

## Debugging Commands

### Check Tool Registration

```bash
# List all registered tools
node dist/main.js tools

# Get JSON output for parsing
node dist/main.js tools --json | jq '.[] | .name'

# Test via MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node dist/main.js serve | jq '.result.tools | length'
```

### Verify Tool Schemas

```bash
# Check specific tool schema
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node dist/main.js serve | \
  jq '.result.tools[] | select(.name=="mosaic_task_create") | .inputSchema'
```

### Test Tool Execution

```bash
# Test a simple tool call
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"mosaic_project_list","arguments":{}}}' | \
  node dist/main.js serve
```

### Monitor Server Logs

```bash
# Watch server logs in real-time
tail -f ~/.config/mosaic/logs/mcp.log

# Check for errors
grep -i error ~/.config/mosaic/logs/mcp.log | tail -20
```

## Prevention Strategies

### 1. Always Test After Changes

```bash
# After making changes:
npm run build
npm test
node dist/main.js tools --json | jq '. | length'  # Should show 33
```

### 2. Use Type Checking

```typescript
// Ensure MCPTool interface is properly implemented
import { MCPTool } from '../types';

const tool: MCPTool = {
  name: string,
  description: string,
  inputSchema: object,  // Must be JSON Schema, not Zod
  handler: async (args: any) => Promise<ToolResponse>
};
```

### 3. Validate Schemas

```typescript
// Test schema conversion during development
import { zodToJsonSchema } from './utils/zodToJsonSchema';

const testSchema = z.object({ test: z.string() });
const jsonSchema = zodToJsonSchema(testSchema);
console.assert(jsonSchema.type === 'object');
console.assert(jsonSchema.properties.test.type === 'string');
```

### 4. Document Tool Changes

When adding or modifying tools:
1. Update the tool count in documentation
2. Add the tool to the appropriate category list
3. Test the tool manually before committing
4. Verify it appears in Claude Code after deployment

## Quick Fixes

### Reset Everything

If nothing else works, complete reset:

```bash
# 1. Stop all MCP processes
pkill -f "mcp-server"

# 2. Clean and rebuild
cd packages/mcp-server
npm run clean
npm install
npm run build

# 3. Reinstall
cd ../..
bash scripts/install-central-mcp.sh

# 4. Restart Claude Code
# The MCP server will be respawned automatically
```

### Verify Working State

After fixes, verify everything works:

```bash
# Should return 33 tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  timeout 2 node ~/.config/mosaic/mcp-server/dist/main.js serve 2>/dev/null | \
  jq '.result.tools | length'

# Check a tool has proper schema
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  timeout 2 node ~/.config/mosaic/mcp-server/dist/main.js serve 2>/dev/null | \
  jq '.result.tools[0].inputSchema.type'  # Should output "object"
```

### Issue 7: Planning Plugin Method Mismatch

**Symptoms:**
- Business planning fails with "this.stateTracker.updateModule is not a function"
- Planning tools return error messages instead of executing
- StateTracker method not found errors

**Root Cause:**
Method name mismatch between TypeScript source and compiled JavaScript in the planning plugin:
- TypeScript source (`state-tracker.ts`): `updateModule()`
- Compiled JavaScript (`state-tracker.js`): `updateModuleState()` (before fix)
- Planning commands expect: `updateModule()`

**Solution:**
Ensure the compiled JavaScript uses `updateModule` to match planning command expectations:
```javascript
// In planning-plugin/src/core/state-tracker.js
updateModule(moduleName, moduleDefinition, moduleState) {
  // Implementation...
}
```

**Prevention:**
- Keep TypeScript source and compiled JavaScript method names synchronized
- Rebuild planning plugin after TypeScript changes
- Verify deployed version matches expected method signatures

### Issue 8: Database Schema Mismatch (Missing Columns)

**Symptoms:**
- SQL errors like "table projects has no column named domain_category"
- "SQLITE_ERROR: table has no column named X" messages
- Database operations failing with column not found errors

**Root Cause:**
Existing database schema doesn't match current code expectations. This happens when:
- Code adds new columns but database wasn't migrated
- Development database differs from deployment database
- Migration scripts didn't run or failed silently

**Solution:**
Add column migration to StateService.ts:
```typescript
// In runMigrations(), add:
this.addDomainCategoryColumns

// Then implement:
private async addDomainCategoryColumns(): Promise<void> {
  try {
    const projectsInfo = await this.all("PRAGMA table_info(projects)");
    const hasColumn = projectsInfo.some((col: any) => col.name === 'domain_category');
    
    if (!hasColumn) {
      await this.run(`ALTER TABLE projects ADD COLUMN domain_category INTEGER`);
      this.logger.logDatabaseEvent('migration', 'projects', { 
        action: 'add_column', column: 'domain_category' 
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error('Failed to add columns', { error: errorMessage });
  }
}
```

**Verification:**
```bash
# Check if column exists
sqlite3 ~/.config/mosaic/data/mcp.db "PRAGMA table_info(projects);" | grep domain_category

# Should output: 10|domain_category|INTEGER|0||0
```

**Prevention:**
- Always add column migrations when adding new database fields
- Test migrations on copy of production database first
- Use graceful error handling in migrations
- Verify schema matches between development and deployment

### Issue 9: Comprehensive StateTracker Method Audit

**Common Missing Methods Found:**
After comprehensive audit of planning plugin dependencies:

1. `this.stateTracker.updateMetadata()` - ❌ Was missing (async version)
2. `this.stateTracker.getCurrentSession()` - ❌ Was missing 
3. `this.stateTracker.getSessionStats()` - ❌ Was missing

**Root Cause:**
Planning commands expected more methods than StateTracker implemented. This creates cascade of "X is not a function" errors across all planning operations.

**Complete Audit Results:**
```javascript
// ✅ Methods that existed:
- initialize()
- updateModule() (fixed earlier)
- getMetadata() 
- getModuleState()
- addMetadata()
- saveSession()
- loadSession()

// ❌ Methods that were missing:
- async updateMetadata(key, value)
- getCurrentSession()
- getSessionStats()
```

**Solution Applied:**
Added all missing methods to `state-tracker.js`:
```javascript
// async updateMetadata for planning command compatibility
async updateMetadata(key, value) {
  this.addMetadata(key, value);
  if (this.config.autoSave) {
    this.scheduleAutoSave();
  }
}

// getCurrentSession for status reporting
getCurrentSession() {
  return this.session;
}

// getSessionStats for progress tracking
getSessionStats() {
  if (!this.session) {
    return { totalModules: 0, completedModules: 0, sessionDuration: 0, createdAt: null, lastUpdated: null };
  }
  const modules = Object.values(this.session.modules || {});
  const totalModules = modules.length;
  const completedModules = modules.filter(module => module.state?.status === 'completed').length;
  const sessionDuration = new Date(this.session.lastUpdated) - new Date(this.session.createdAt);
  return { totalModules, completedModules, sessionDuration, createdAt: this.session.createdAt, lastUpdated: this.session.lastUpdated, completionRate: totalModules > 0 ? (completedModules / totalModules) * 100 : 0 };
}
```

**Systematic Audit Process:**
1. Search for all `this.stateTracker.` calls in planning commands
2. Extract unique method names used
3. Compare with actual StateTracker implementation
4. Identify gaps and implement missing methods
5. Ensure both sync and async versions where needed

**Prevention:**
- Run comprehensive audits when integrating large subsystems
- Use interface definitions to catch missing methods at compile time
- Test all integration points systematically
- Document expected method signatures

### Issue 10: Planning System Not Using MosAIc Project Context

**Symptoms:**
- Planning commands use "default" project names instead of actual project
- Planning doesn't respect .mosaic directory configuration
- Generic planning output instead of project-specific context
- Missing project epic and context information

**Root Cause:**
Planning commands were hardcoded to use fallback values instead of reading MosAIc project configuration from `.mosaic/` directory.

**Solution Applied:**
Created MosAIc project integration system:

1. **MosAIcProjectReader.js** - Reads project context from .mosaic directory:
```javascript
const { MosAIcProjectReader } = require('../utils/MosAIcProjectReader');
const projectReader = new MosAIcProjectReader();

// Automatically reads:
// - .mosaic/stack.config.json (project configuration)
// - .mosaic/ACTIVE-EPIC.md (current epic information) 
// - Project name, description, version, active epic
// - Business context for planning AI agents
```

2. **Updated Planning Commands** to use project context:
```javascript
// Before: Hard-coded defaults
const { projectId = 'default', projectDescription, ... } = options;

// After: MosAIc project context
const projectConfig = await this.projectReader.getProjectConfig();
const businessContext = await this.projectReader.getBusinessContext();
const { 
  projectId = projectConfig.projectId,           // "mosaic-sdk"
  projectDescription = businessContext.projectDescription, // From config
  ...
} = options;
```

3. **Enhanced StateTracker** with automatic MosAIc detection:
```javascript
// Automatically uses MosAIc project config when available
if (this.config.projectId === 'default' && this.projectReader.isMosAIcProject()) {
  const projectConfig = await this.projectReader.getProjectConfig();
  this.config.projectId = projectConfig.projectId;
  this.config.dataDir = projectConfig.planning.dataDir;
}
```

**Verification:**
```bash
# Test project detection
node -e "const { MosAIcProjectReader } = require('./planning-plugin/src/utils/MosAIcProjectReader.js'); 
new MosAIcProjectReader().getProjectConfig().then(c => console.log('Project:', c.projectName, 'Epic:', c.activeEpic))"

# Should output: Project: MosAIc Stack Epic: E.300
```

**Benefits:**
- ✅ Planning uses actual project name "MosAIc SDK" instead of "default"
- ✅ Automatically detects current epic (E.300 - SDK Stabilization)
- ✅ Provides business context to AI planning agents
- ✅ Uses project-specific data directories
- ✅ Respects MosAIc project structure and conventions

**Prevention:**
- Always check for project-specific configuration before using defaults
- Implement project context readers for multi-project systems
- Test integration with actual project data, not just generic examples
- Document project configuration expectations

## Getting Help

If issues persist:

1. **Check Logs:**
   - `~/.config/mosaic/logs/mcp.log`
   - Claude Code developer console (if available)

2. **Verify Configuration:**
   - `~/.claude.json` - Claude Code MCP configuration
   - `~/.config/mosaic/config.json` - MosAIc configuration

3. **Test Minimal Setup:**
   - Create a simple test tool
   - Verify it registers and works
   - Gradually add complexity

4. **Common Working Configuration:**
   ```json
   {
     "mcpServers": {
       "mosaic": {
         "command": "node",
         "args": [
           "/home/user/.config/mosaic/mcp-server/dist/main.js",
           "serve"
         ]
       }
     }
   }
   ```

Remember: The MCP server should always be spawned by Claude Code as a child process, never run manually!