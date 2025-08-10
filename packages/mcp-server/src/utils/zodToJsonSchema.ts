import { z } from 'zod';

/**
 * Convert Zod schema to JSON Schema format for MCP compatibility
 * This is a simplified converter that handles the most common cases
 */
export function zodToJsonSchema(schema: z.ZodSchema<any>): any {
  const def = (schema as any)._def;
  
  if (!def) {
    return { type: 'object' };
  }

  switch (def.typeName) {
    case 'ZodObject': {
      const shape = def.shape();
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodSchema<any>;
        const fieldDef = (fieldSchema as any)._def;
        
        properties[key] = zodToJsonSchema(fieldSchema);
        
        // Check if field is required
        if (fieldDef.typeName !== 'ZodOptional' && fieldDef.typeName !== 'ZodDefault') {
          required.push(key);
        }
        
        // Handle optional fields
        if (fieldDef.typeName === 'ZodOptional') {
          properties[key] = zodToJsonSchema(fieldDef.innerType);
        }
        
        // Handle default values
        if (fieldDef.typeName === 'ZodDefault') {
          properties[key] = {
            ...zodToJsonSchema(fieldDef.innerType),
            default: fieldDef.defaultValue()
          };
        }
      }
      
      const result: any = {
        type: 'object',
        properties
      };
      
      if (required.length > 0) {
        result.required = required;
      }
      
      return result;
    }
    
    case 'ZodString': {
      const result: any = { type: 'string' };
      
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min') {
            result.minLength = check.value;
          } else if (check.kind === 'max') {
            result.maxLength = check.value;
          } else if (check.kind === 'regex') {
            result.pattern = check.regex.source;
          }
        }
      }
      
      return result;
    }
    
    case 'ZodNumber': {
      const result: any = { type: 'number' };
      
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min') {
            result.minimum = check.value;
          } else if (check.kind === 'max') {
            result.maximum = check.value;
          }
        }
      }
      
      return result;
    }
    
    case 'ZodBoolean':
      return { type: 'boolean' };
    
    case 'ZodArray': {
      return {
        type: 'array',
        items: zodToJsonSchema(def.type)
      };
    }
    
    case 'ZodEnum': {
      return {
        type: 'string',
        enum: def.values
      };
    }
    
    case 'ZodOptional': {
      return zodToJsonSchema(def.innerType);
    }
    
    case 'ZodDefault': {
      const innerSchema = zodToJsonSchema(def.innerType);
      return {
        ...innerSchema,
        default: def.defaultValue()
      };
    }
    
    case 'ZodRecord': {
      return {
        type: 'object',
        additionalProperties: zodToJsonSchema(def.valueType)
      };
    }
    
    case 'ZodAny':
      return {};
      
    default:
      console.warn(`Unsupported Zod type: ${def.typeName}`);
      return { type: 'object' };
  }
}