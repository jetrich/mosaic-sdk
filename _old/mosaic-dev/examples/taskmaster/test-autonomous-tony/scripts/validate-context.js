#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Load the schema
const schemaPath = path.resolve(__dirname, '../templates/agent-context-schema.json');
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}✗ Failed to load schema:${colors.reset}`, error.message);
  process.exit(1);
}

/**
 * Simple schema validation without external dependencies
 * @param {object} context - Context object to validate
 * @param {object} schema - Schema to validate against
 * @returns {array} Array of error messages
 */
function validateAgainstSchema(context, schema) {
  const errors = [];
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in context)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check schema version
  if (context.schema_version !== schema.properties.schema_version.const) {
    errors.push(`Invalid schema version: expected ${schema.properties.schema_version.const}, got ${context.schema_version}`);
  }
  
  // Validate specific fields
  if (context.session) {
    if (!context.session.session_id || !context.session.session_id.match(/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/)) {
      errors.push('Invalid session_id format (must be UUID)');
    }
    if (!context.session.timestamp) {
      errors.push('Missing session.timestamp');
    }
    if (!Array.isArray(context.session.agent_chain)) {
      errors.push('session.agent_chain must be an array');
    }
  }
  
  // Validate task context
  if (context.task_context) {
    if (context.task_context.current_task) {
      const task = context.task_context.current_task;
      if (!task.id || !task.id.match(/^[EPFSTA]\.[0-9]{3}(\.[0-9]{2}){0,5}$/)) {
        errors.push('Invalid task ID format (must follow UPP format)');
      }
      if (!['pending', 'in_progress', 'blocked', 'completed', 'failed'].includes(task.status)) {
        errors.push(`Invalid task status: ${task.status}`);
      }
    }
  }
  
  return errors;
}

/**
 * Validate a context file against the schema
 * @param {string} contextPath - Path to the context JSON file
 * @returns {object} Validation result
 */
function validateContext(contextPath) {
  console.log(`${colors.cyan}Validating: ${contextPath}${colors.reset}`);
  
  // Check if file exists
  if (!fs.existsSync(contextPath)) {
    return {
      valid: false,
      errors: [`File not found: ${contextPath}`]
    };
  }

  // Load the context file
  let context;
  try {
    const content = fs.readFileSync(contextPath, 'utf8');
    context = JSON.parse(content);
  } catch (error) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${error.message}`]
    };
  }

  // Validate against schema
  const schemaErrors = validateAgainstSchema(context, schema);
  
  if (schemaErrors.length > 0) {
    return {
      valid: false,
      errors: schemaErrors
    };
  }

  // Additional validations beyond schema
  const additionalErrors = [];

  // Check for circular dependencies
  if (context.task_context?.dependencies) {
    const deps = context.task_context.dependencies;
    const currentTaskId = context.task_context.current_task?.id;
    
    if (currentTaskId) {
      // Check if current task appears in its own dependencies
      const allDeps = [
        ...(deps.blocking || []),
        ...(deps.blocked_by || [])
      ];
      
      if (allDeps.includes(currentTaskId)) {
        additionalErrors.push(`Circular dependency detected: task ${currentTaskId} depends on itself`);
      }
    }
  }

  // Verify file paths exist (only for project_state.modified_files)
  if (context.project_state?.modified_files) {
    const workingDir = context.project_state.working_directory;
    
    for (const file of context.project_state.modified_files) {
      if (file.status !== 'deleted') {
        const fullPath = path.resolve(workingDir, file.path);
        if (!fs.existsSync(fullPath)) {
          additionalErrors.push(`Referenced file does not exist: ${file.path}`);
        }
      }
    }
  }

  // Validate session continuity chain
  if (context.session?.agent_chain) {
    const chain = context.session.agent_chain;
    
    // Check chronological order
    for (let i = 1; i < chain.length; i++) {
      const prevEnd = new Date(chain[i-1].end_time || chain[i-1].start_time);
      const currentStart = new Date(chain[i].start_time);
      
      if (currentStart < prevEnd) {
        additionalErrors.push(
          `Session continuity broken: ${chain[i].agent_id} started before ${chain[i-1].agent_id} ended`
        );
      }
    }

    // Check for gaps > 5 minutes
    for (let i = 1; i < chain.length; i++) {
      const prevEnd = new Date(chain[i-1].end_time || chain[i-1].start_time);
      const currentStart = new Date(chain[i].start_time);
      const gapMinutes = (currentStart - prevEnd) / (1000 * 60);
      
      if (gapMinutes > 5) {
        additionalErrors.push(
          `Large gap detected: ${Math.round(gapMinutes)} minutes between ${chain[i-1].agent_id} and ${chain[i].agent_id}`
        );
      }
    }
  }

  // Check context size (warn if > 10KB)
  const contextSize = JSON.stringify(context).length;
  if (contextSize > 10240) {
    console.warn(
      `${colors.yellow}⚠ Warning: Context size (${Math.round(contextSize/1024)}KB) exceeds recommended 10KB limit${colors.reset}`
    );
  }

  return {
    valid: additionalErrors.length === 0,
    errors: additionalErrors,
    warnings: contextSize > 10240 ? [`Context size: ${Math.round(contextSize/1024)}KB`] : []
  };
}

/**
 * Display validation results
 * @param {object} result - Validation result
 * @param {string} contextPath - Path to the validated file
 */
function displayResults(result, contextPath) {
  if (result.valid) {
    console.log(`${colors.green}✓ Valid${colors.reset} - ${path.basename(contextPath)}`);
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`${colors.yellow}Warnings:${colors.reset}`);
      result.warnings.forEach(warning => {
        console.log(`  ⚠ ${warning}`);
      });
    }
  } else {
    console.log(`${colors.red}✗ Invalid${colors.reset} - ${path.basename(contextPath)}`);
    console.log(`${colors.red}Errors:${colors.reset}`);
    result.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }
  console.log('');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: validate-context.js <context-file> [context-file...]');
    console.log('');
    console.log('Examples:');
    console.log('  validate-context.js context.json');
    console.log('  validate-context.js templates/context/*.json');
    console.log('');
    process.exit(1);
  }

  let allValid = true;
  const results = [];

  // Process each file
  for (const contextPath of args) {
    const resolvedPath = path.resolve(contextPath);
    const result = validateContext(resolvedPath);
    results.push({ path: resolvedPath, result });
    
    if (!result.valid) {
      allValid = false;
    }
    
    displayResults(result, resolvedPath);
  }

  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total files: ${results.length}`);
  console.log(`  Valid: ${results.filter(r => r.result.valid).length}`);
  console.log(`  Invalid: ${results.filter(r => !r.result.valid).length}`);

  // Exit with appropriate code
  process.exit(allValid ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use in other scripts
module.exports = { validateContext, schema };