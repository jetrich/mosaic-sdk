/**
 * Structured Output Schemas for Ollama MCP - Production Ready
 * Based on MosAIc Stack OSS Codegen Best Practices
 */

const crypto = require('crypto');

// Utility function to calculate SHA-256
function calculateSHA256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// File operation schema
const FileItem = {
  validate: (item) => {
    const required = ['path', 'op', 'content'];
    const valid_ops = ['write', 'patch', 'delete'];
    const valid_encodings = ['utf-8', 'base64'];
    const valid_eols = ['lf', 'crlf'];

    // Check required fields
    for (const field of required) {
      if (!(field in item)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate operation
    if (!valid_ops.includes(item.op)) {
      throw new Error(`Invalid operation: ${item.op}. Must be one of: ${valid_ops.join(', ')}`);
    }

    // Validate encoding
    if (item.encoding && !valid_encodings.includes(item.encoding)) {
      throw new Error(`Invalid encoding: ${item.encoding}. Must be one of: ${valid_encodings.join(', ')}`);
    }

    // Validate EOL
    if (item.eol && !valid_eols.includes(item.eol)) {
      throw new Error(`Invalid eol: ${item.eol}. Must be one of: ${valid_eols.join(', ')}`);
    }

    // Validate path
    if (typeof item.path !== 'string' || item.path.trim().length === 0) {
      throw new Error('Path must be a non-empty string');
    }

    // Validate content
    if (typeof item.content !== 'string') {
      throw new Error('Content must be a string');
    }

    // Auto-calculate SHA-256 if not provided
    if (!item.sha256) {
      item.sha256 = calculateSHA256(item.content);
    }

    return true;
  },
  
  create: (path, content, options = {}) => {
    const item = {
      path: path,
      op: options.op || 'write',
      encoding: options.encoding || 'utf-8',
      eol: options.eol || 'lf',
      executable: options.executable || false,
      content: content,
      sha256: options.sha256 || calculateSHA256(content)
    };

    FileItem.validate(item);
    return item;
  }
};

// Files@1 schema - main structured output format
const FilesV1 = {
  validate: (data) => {
    // Check format
    if (data.format !== 'files@1') {
      throw new Error(`Invalid format: ${data.format}. Expected: files@1`);
    }

    // Check intent
    const valid_intents = ['create', 'modify', 'delete'];
    if (!valid_intents.includes(data.intent)) {
      throw new Error(`Invalid intent: ${data.intent}. Must be one of: ${valid_intents.join(', ')}`);
    }

    // Check files array
    if (!Array.isArray(data.files) || data.files.length === 0) {
      throw new Error('Files must be a non-empty array');
    }

    // Validate each file item
    data.files.forEach((file, index) => {
      try {
        FileItem.validate(file);
      } catch (error) {
        throw new Error(`File ${index}: ${error.message}`);
      }
    });

    return true;
  },

  create: (intent, files, options = {}) => {
    const data = {
      format: 'files@1',
      intent: intent,
      request_id: options.request_id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      files: Array.isArray(files) ? files : [files]
    };

    FilesV1.validate(data);
    return data;
  }
};

// Plan@1 schema - for multi-file planning phase
const PlanV1 = {
  validate: (data) => {
    // Check format
    if (data.format !== 'plan@1') {
      throw new Error(`Invalid format: ${data.format}. Expected: plan@1`);
    }

    // Check files array
    if (!Array.isArray(data.files) || data.files.length === 0) {
      throw new Error('Files must be a non-empty array');
    }

    // Validate each file plan
    data.files.forEach((file, index) => {
      const required = ['path', 'op', 'reason'];
      const valid_ops = ['create', 'modify', 'delete'];

      for (const field of required) {
        if (!(field in file)) {
          throw new Error(`File ${index}: Missing required field: ${field}`);
        }
      }

      if (!valid_ops.includes(file.op)) {
        throw new Error(`File ${index}: Invalid operation: ${file.op}`);
      }
    });

    // Check acceptance tests
    if (!Array.isArray(data.acceptance_tests)) {
      throw new Error('Acceptance tests must be an array');
    }

    return true;
  },

  create: (files, acceptance_tests, options = {}) => {
    const data = {
      format: 'plan@1',
      request_id: options.request_id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      files: files,
      acceptance_tests: acceptance_tests,
      estimated_complexity: options.complexity || 'medium'
    };

    PlanV1.validate(data);
    return data;
  }
};

// Content completion detector
const CompletionDetector = {
  // Detect if HTML content appears complete
  isHTMLComplete: (content) => {
    const hasDoctype = content.includes('<!DOCTYPE') || content.includes('<!doctype');
    const hasOpeningHtml = content.includes('<html');
    const hasClosingHtml = content.includes('</html>');
    const hasOpeningBody = content.includes('<body');
    const hasClosingBody = content.includes('</body>');
    
    return {
      complete: hasDoctype && hasOpeningHtml && hasClosingHtml && hasOpeningBody && hasClosingBody,
      missing: [
        !hasDoctype && 'DOCTYPE declaration',
        !hasOpeningHtml && 'opening <html> tag',
        !hasClosingHtml && 'closing </html> tag',
        !hasOpeningBody && 'opening <body> tag',
        !hasClosingBody && 'closing </body> tag'
      ].filter(Boolean)
    };
  },

  // Detect if code content appears complete
  isCodeComplete: (content, language) => {
    const lines = content.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    
    // Check for common truncation indicators
    const truncationIndicators = [
      '...',
      '// ...',
      '/* ...',
      '# ...',
      'TODO',
      'PLACEHOLDER'
    ];

    const hasTruncationIndicator = truncationIndicators.some(indicator => 
      content.includes(indicator)
    );

    // Language-specific completion checks
    let languageComplete = true;
    let missing = [];

    if (language === 'javascript' || language === 'typescript') {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        languageComplete = false;
        missing.push('unmatched braces');
      }
    } else if (language === 'python') {
      if (content.includes('def ') && !lastLine.trim() && lines.length > 1) {
        // Python function should not end abruptly
        const lastNonEmptyLine = lines.slice().reverse().find(line => line.trim());
        if (lastNonEmptyLine && lastNonEmptyLine.includes(':') && !lastNonEmptyLine.includes('return')) {
          languageComplete = false;
          missing.push('incomplete function body');
        }
      }
    }

    return {
      complete: !hasTruncationIndicator && languageComplete,
      missing: missing.concat(hasTruncationIndicator ? ['truncation indicators found'] : [])
    };
  },

  // Detect if JSON is complete and valid
  isJSONComplete: (content) => {
    try {
      const parsed = JSON.parse(content);
      return {
        complete: true,
        parsed: parsed,
        missing: []
      };
    } catch (error) {
      return {
        complete: false,
        missing: [`JSON parse error: ${error.message}`],
        error: error
      };
    }
  },

  // Universal completion detector
  detect: (content, contentType, language) => {
    if (contentType === 'html' || language === 'html') {
      return CompletionDetector.isHTMLComplete(content);
    } else if (contentType === 'json' || language === 'json') {
      return CompletionDetector.isJSONComplete(content);
    } else if (['javascript', 'typescript', 'python', 'java', 'csharp'].includes(language)) {
      return CompletionDetector.isCodeComplete(content, language);
    } else {
      // Basic completion check for other content types
      const seemsIncomplete = content.trim().endsWith('...') || 
                             content.includes('TODO') || 
                             content.includes('PLACEHOLDER') ||
                             content.length < 50; // Very short content might be incomplete

      return {
        complete: !seemsIncomplete,
        missing: seemsIncomplete ? ['content appears incomplete'] : []
      };
    }
  }
};

// Response parser with validation
const ResponseParser = {
  // Extract structured output from model response
  extractStructured: (response) => {
    // Look for JSON blocks first
    const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return { success: true, data: parsed, raw: jsonMatch[1] };
      } catch (error) {
        return { success: false, error: `JSON parse error: ${error.message}`, raw: jsonMatch[1] };
      }
    }

    // Look for direct JSON (no code blocks)
    const trimmed = response.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return { success: true, data: parsed, raw: trimmed };
      } catch (error) {
        return { success: false, error: `Direct JSON parse error: ${error.message}`, raw: trimmed };
      }
    }

    return { success: false, error: 'No structured JSON found in response', raw: response };
  },

  // Validate extracted data against schema
  validateResponse: (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Response data must be an object');
    }

    const format = data.format;
    if (!format) {
      throw new Error('Response must include a format field');
    }

    switch (format) {
      case 'files@1':
        FilesV1.validate(data);
        return { schema: 'files@1', valid: true };
      case 'plan@1':
        PlanV1.validate(data);
        return { schema: 'plan@1', valid: true };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
};

// Prompt templates for structured output
const PromptTemplates = {
  // Planning phase prompt
  plan: (task, context) => `SYSTEM: You are a senior software engineer. Output must be valid JSON per the plan@1 schema below. No prose.

USER: Task: ${task}

Context: ${context}

Output contract (plan@1):
{
  "format": "plan@1",
  "files": [
    {"path": "<path>", "op": "create|modify|delete", "reason": "<why this file>"}
  ],
  "acceptance_tests": ["<test description>", "<another test>"]
}

Rules:
- Include all necessary files for the task
- Provide clear reasons for each file operation
- Include meaningful acceptance tests
- Output JSON only, no prose

Respond with JSON only.`,

  // Implementation phase prompt
  files: (plan, context) => `SYSTEM: You are a senior software engineer. Output must be valid JSON per the files@1 schema below. No prose, no placeholders.

USER: Implement the approved plan below. Generate complete, working code for each file.

Approved plan:
${JSON.stringify(plan, null, 2)}

Context: ${context}

Output contract (files@1):
{
  "format": "files@1",
  "intent": "create|modify|delete",
  "files": [
    {"path": "...", "op": "write", "encoding": "utf-8", "eol": "lf", "content": "...", "executable": false}
  ]
}

Rules:
- Generate COMPLETE code - no placeholders, no TODOs, no "..." 
- Include all necessary imports and dependencies
- Code must be production-ready and functional
- Include proper error handling where appropriate
- JSON only, no prose

Respond with JSON only.`,

  // Simple single-file prompt
  singleFile: (task, filetype, language) => `SYSTEM: You are a senior software engineer. Output must be valid JSON per the files@1 schema. Generate complete, working code.

USER: Task: ${task}

Generate a complete ${filetype} file using ${language}.

Output contract (files@1):
{
  "format": "files@1",
  "intent": "create",
  "files": [
    {"path": "generated_file.${language === 'html' ? 'html' : language === 'python' ? 'py' : 'txt'}", "op": "write", "encoding": "utf-8", "content": "..."}
  ]
}

Rules:
- Generate COMPLETE, functional code
- No placeholders, TODOs, or incomplete sections
- Include all necessary imports and structure
- Code must be ready to run/use immediately
- JSON only, no prose

Respond with JSON only.`
};

module.exports = {
  FileItem,
  FilesV1,
  PlanV1,
  CompletionDetector,
  ResponseParser,
  PromptTemplates,
  calculateSHA256
};