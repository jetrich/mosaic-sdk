# Zod to JSON Schema Conversion Guide

## Problem Statement

The Model Context Protocol (MCP) requires tools to define their input schemas using standard JSON Schema format. However, our codebase uses Zod for runtime validation, which provides better TypeScript integration and validation capabilities. This creates a mismatch that must be resolved.

## The Issue

When Zod schemas are passed directly as `inputSchema` to MCP tools, Claude Code receives the raw Zod runtime objects instead of JSON Schema, causing:
- Tools appear with "Capabilities: none"
- Claude Code cannot understand tool parameters
- Tool calls fail with schema validation errors

### Example of the Problem

**❌ Incorrect (Raw Zod Schema):**
```typescript
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['epic', 'feature', 'story', 'task'])
});

// This passes the Zod object directly
{
  name: 'create_task',
  inputSchema: CreateTaskSchema,  // ❌ Raw Zod object
  handler: this.createTask.bind(this)
}
```

**Result in MCP:**
```json
{
  "inputSchema": {
    "_def": {
      "typeName": "ZodObject",
      "~standard": { "version": 1, "vendor": "zod" }
    }
  }
}
```

## The Solution

We implemented a custom `zodToJsonSchema` converter that transforms Zod schemas into proper JSON Schema format at tool registration time.

### Implementation

**Location:** `src/utils/zodToJsonSchema.ts`

```typescript
import { z } from 'zod';

export function zodToJsonSchema(schema: z.ZodSchema<any>): any {
  // Converts Zod schema to JSON Schema format
  // Handles: objects, strings, numbers, booleans, arrays, enums, etc.
}
```

**✅ Correct Usage:**
```typescript
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['epic', 'feature', 'story', 'task'])
});

// Convert to JSON Schema before registering
{
  name: 'create_task',
  inputSchema: zodToJsonSchema(CreateTaskSchema),  // ✅ JSON Schema
  handler: this.createTask.bind(this)
}
```

**Result in MCP:**
```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      },
      "type": {
        "type": "string",
        "enum": ["epic", "feature", "story", "task"]
      }
    },
    "required": ["title", "type"]
  }
}
```

## Converter Features

The `zodToJsonSchema` converter handles:

### Basic Types
- `z.string()` → `{ type: "string" }`
- `z.number()` → `{ type: "number" }`
- `z.boolean()` → `{ type: "boolean" }`

### String Validators
- `z.string().min(n)` → `{ minLength: n }`
- `z.string().max(n)` → `{ maxLength: n }`
- `z.string().regex(/pattern/)` → `{ pattern: "pattern" }`

### Number Validators
- `z.number().min(n)` → `{ minimum: n }`
- `z.number().max(n)` → `{ maximum: n }`

### Complex Types
- `z.object({ ... })` → `{ type: "object", properties: { ... } }`
- `z.array(...)` → `{ type: "array", items: { ... } }`
- `z.enum([...])` → `{ type: "string", enum: [...] }`
- `z.optional(...)` → Removes from required array
- `z.default(value)` → Adds `default: value`

### Special Cases
- `z.record(...)` → `{ type: "object", additionalProperties: { ... } }`
- `z.any()` → `{}` (any type allowed)

## Migration Checklist

When updating or creating new tools:

1. **Import the converter:**
   ```typescript
   import { zodToJsonSchema } from '../utils/zodToJsonSchema';
   ```

2. **Define Zod schemas as usual:**
   ```typescript
   const MySchema = z.object({
     field: z.string(),
     // ...
   });
   ```

3. **Convert when registering tools:**
   ```typescript
   getTools(): MCPTool[] {
     return [{
       name: 'my_tool',
       inputSchema: zodToJsonSchema(MySchema),  // Convert here
       handler: this.myHandler.bind(this)
     }];
   }
   ```

4. **Keep validation in handlers:**
   ```typescript
   private async myHandler(args: any): Promise<ToolResponse> {
     const input = MySchema.parse(args);  // Still validate with Zod
     // ... handle the tool call
   }
   ```

## Common Gotchas

### 1. Forgetting to Convert
**Symptom:** Tools show "Capabilities: none" in Claude Code
**Fix:** Ensure all `inputSchema` fields use `zodToJsonSchema()`

### 2. Double Schema Definition
**Symptom:** Schema defined both as Zod and manual JSON Schema
**Fix:** Use only Zod schema with converter

### 3. Unsupported Zod Features
Some advanced Zod features aren't supported:
- `z.union()` - Use `z.enum()` instead where possible
- `z.intersection()` - Flatten the schema manually
- `z.transform()` - Not applicable for input schemas
- `z.refine()` - Custom validations aren't shown in JSON Schema

### 4. Missing Required Fields
**Symptom:** Required fields not enforced
**Fix:** Ensure the converter properly identifies required vs optional fields

## Testing Schema Conversion

To test if schemas are converting correctly:

```bash
# List all tools with their schemas
node dist/main.js tools --json | jq '.["tool_name"].inputSchema'

# Test via MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node dist/main.js serve | jq '.result.tools[0].inputSchema'
```

## Debugging Tips

1. **Check Raw Output:**
   ```typescript
   console.log(JSON.stringify(zodToJsonSchema(MySchema), null, 2));
   ```

2. **Verify in Claude Code:**
   - Run `/mcp` command to see registered tools
   - Check if tool parameters are visible

3. **Common Error Messages:**
   - "Cannot read inputSchema" - Schema is null/undefined
   - "Invalid schema format" - Not valid JSON Schema
   - "Unknown type" - Converter doesn't handle this Zod type

## Alternative Solutions

### Using zod-to-json-schema Package

For more complex schemas, consider using the `zod-to-json-schema` npm package:

```bash
npm install zod-to-json-schema
```

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

const jsonSchema = zodToJsonSchema(myZodSchema, {
  target: 'openApi3',
  $refStrategy: 'none'
});
```

However, our custom converter is sufficient for most use cases and avoids additional dependencies.

## Best Practices

1. **Keep Schemas Simple:** Complex nested schemas are harder to convert
2. **Document Constraints:** Add descriptions to help users understand parameters
3. **Test Thoroughly:** Verify schemas work in both Claude Code and OpenCode
4. **Version Carefully:** Schema changes can break existing integrations
5. **Provide Examples:** Include example values in descriptions

## Example: Complete Tool Implementation

```typescript
import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

// Define schema with Zod
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).describe('Project name'),
  description: z.string().optional().describe('Project description'),
  status: z.enum(['active', 'on_hold', 'completed']).default('active'),
  team_members: z.array(z.string()).optional()
});

export class ProjectTools {
  getTools(): MCPTool[] {
    return [{
      name: 'create_project',
      description: 'Create a new project',
      inputSchema: zodToJsonSchema(CreateProjectSchema),  // Convert for MCP
      handler: this.createProject.bind(this)
    }];
  }

  private async createProject(args: any): Promise<ToolResponse> {
    // Validate with original Zod schema
    const input = CreateProjectSchema.parse(args);
    
    // Implementation...
    return {
      title: `Project Created: ${input.name}`,
      output: 'Success',
      metadata: { status: 'success' }
    };
  }
}
```

## Conclusion

The Zod to JSON Schema conversion is a critical piece of the MCP server that bridges the gap between TypeScript's type safety and MCP's protocol requirements. By understanding this conversion process, developers can confidently create new tools that work seamlessly with both Claude Code and OpenCode.