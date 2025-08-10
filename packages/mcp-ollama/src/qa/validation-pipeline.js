/**
 * Quality Assurance Pipeline for Structured Generation
 * Validates generated content against quality standards
 */

const fs = require('fs');
const path = require('path');
const { CompletionDetector, calculateSHA256 } = require('../schemas/structured-output.js');

class ValidationPipeline {
  constructor() {
    this.validationRules = {
      'web-development': this.createWebValidationRules(),
      'backend-code': this.createCodeValidationRules(),
      'algorithms': this.createCodeValidationRules(),
      'documentation': this.createDocValidationRules(),
      'quick-answer': this.createBasicValidationRules()
    };
  }

  /**
   * Run complete validation pipeline on generated content
   */
  async validateGeneratedContent(files, taskType, options = {}) {
    const results = {
      overall_score: 0,
      passed: true,
      validations: [],
      errors: [],
      warnings: [],
      recommendations: []
    };

    const rules = this.validationRules[taskType] || this.validationRules['quick-answer'];
    let totalScore = 0;
    let maxScore = 0;

    for (const file of files) {
      const fileResult = await this.validateSingleFile(file, rules, taskType);
      
      results.validations.push(fileResult);
      totalScore += fileResult.score;
      maxScore += fileResult.max_score;

      if (!fileResult.passed) {
        results.passed = false;
      }

      results.errors.push(...fileResult.errors);
      results.warnings.push(...fileResult.warnings);
      results.recommendations.push(...fileResult.recommendations);
    }

    results.overall_score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return results;
  }

  /**
   * Validate a single file against rules
   */
  async validateSingleFile(file, rules, taskType) {
    const result = {
      file_path: file.path,
      score: 0,
      max_score: 0,
      passed: true,
      errors: [],
      warnings: [],
      recommendations: [],
      checks: []
    };

    // Basic file validation
    if (!file.content || file.content.trim().length === 0) {
      result.errors.push('File content is empty');
      result.passed = false;
      return result;
    }

    // Run completion detection
    const extension = path.extname(file.path).slice(1);
    const language = this.detectLanguageFromExtension(extension);
    const completionResult = CompletionDetector.detect(file.content, extension, language);
    
    result.checks.push({
      name: 'completion_check',
      passed: completionResult.complete,
      score: completionResult.complete ? 20 : 0,
      max_score: 20,
      details: completionResult.missing.length > 0 ? 
        `Missing: ${completionResult.missing.join(', ')}` : 'Content appears complete'
    });

    if (!completionResult.complete) {
      result.warnings.push(`Content may be incomplete: ${completionResult.missing.join(', ')}`);
    }

    // Run task-specific validation rules
    for (const rule of rules) {
      const ruleResult = await this.runValidationRule(rule, file, taskType);
      result.checks.push(ruleResult);
      
      result.score += ruleResult.score;
      result.max_score += ruleResult.max_score;

      if (ruleResult.errors?.length > 0) {
        result.errors.push(...ruleResult.errors);
        result.passed = false;
      }

      if (ruleResult.warnings?.length > 0) {
        result.warnings.push(...ruleResult.warnings);
      }

      if (ruleResult.recommendations?.length > 0) {
        result.recommendations.push(...ruleResult.recommendations);
      }
    }

    // Add completion score to total
    result.score += result.checks[0].score;
    result.max_score += result.checks[0].max_score;

    return result;
  }

  /**
   * Run a single validation rule
   */
  async runValidationRule(rule, file, taskType) {
    const result = {
      name: rule.name,
      passed: false,
      score: 0,
      max_score: rule.max_score || 10,
      errors: [],
      warnings: [],
      recommendations: [],
      details: ''
    };

    try {
      const ruleResult = await rule.validate(file.content, file.path, taskType);
      
      result.passed = ruleResult.passed;
      result.score = ruleResult.passed ? result.max_score : 0;
      result.details = ruleResult.details || '';

      if (ruleResult.errors) result.errors.push(...ruleResult.errors);
      if (ruleResult.warnings) result.warnings.push(...ruleResult.warnings);
      if (ruleResult.recommendations) result.recommendations.push(...ruleResult.recommendations);

    } catch (error) {
      result.errors.push(`Validation rule failed: ${error.message}`);
      result.details = `Rule execution error: ${error.message}`;
    }

    return result;
  }

  /**
   * Create web development validation rules
   */
  createWebValidationRules() {
    return [
      {
        name: 'html_structure',
        max_score: 25,
        validate: async (content) => {
          const hasDoctype = content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>');
          const hasHtmlTag = content.includes('<html') && content.includes('</html>');
          const hasHeadTag = content.includes('<head>') && content.includes('</head>');
          const hasBodyTag = content.includes('<body') && content.includes('</body>');
          
          const passed = hasDoctype && hasHtmlTag && hasHeadTag && hasBodyTag;
          const missing = [];
          
          if (!hasDoctype) missing.push('DOCTYPE declaration');
          if (!hasHtmlTag) missing.push('HTML tags');
          if (!hasHeadTag) missing.push('HEAD section');
          if (!hasBodyTag) missing.push('BODY tags');
          
          return {
            passed,
            details: passed ? 'Complete HTML structure' : `Missing: ${missing.join(', ')}`,
            warnings: missing.length > 0 ? [`Missing HTML elements: ${missing.join(', ')}`] : []
          };
        }
      },
      {
        name: 'css_styling',
        max_score: 20,
        validate: async (content) => {
          const hasInlineStyles = content.includes('<style') && content.includes('</style>');
          const hasExternalCSS = content.includes('link rel="stylesheet"');
          const hasStyledElements = content.match(/style\s*=\s*["'][^"']+["']/);
          
          const passed = hasInlineStyles || hasExternalCSS || hasStyledElements;
          
          return {
            passed,
            details: passed ? 'CSS styling present' : 'No CSS styling found',
            recommendations: !passed ? ['Consider adding CSS styling for better presentation'] : []
          };
        }
      },
      {
        name: 'semantic_html',
        max_score: 15,
        validate: async (content) => {
          const semanticTags = ['<header', '<nav', '<main', '<section', '<article', '<aside', '<footer'];
          const foundTags = semanticTags.filter(tag => content.includes(tag));
          const passed = foundTags.length >= 2;
          
          return {
            passed,
            details: `Found ${foundTags.length} semantic tags: ${foundTags.join(', ')}`,
            recommendations: !passed ? ['Consider using semantic HTML5 elements for better structure'] : []
          };
        }
      },
      {
        name: 'accessibility',
        max_score: 15,
        validate: async (content) => {
          const hasAltTags = !content.includes('<img') || content.includes('alt=');
          const hasLangAttr = content.includes('lang=');
          const hasTitle = content.includes('<title>');
          
          const score = (hasAltTags ? 1 : 0) + (hasLangAttr ? 1 : 0) + (hasTitle ? 1 : 0);
          const passed = score >= 2;
          
          const issues = [];
          if (!hasAltTags) issues.push('Images missing alt attributes');
          if (!hasLangAttr) issues.push('Missing lang attribute');
          if (!hasTitle) issues.push('Missing title tag');
          
          return {
            passed,
            details: `Accessibility score: ${score}/3`,
            warnings: issues
          };
        }
      }
    ];
  }

  /**
   * Create code validation rules
   */
  createCodeValidationRules() {
    return [
      {
        name: 'function_definition',
        max_score: 30,
        validate: async (content) => {
          const hasFunctions = content.includes('def ') || content.includes('function') || content.includes('class ');
          
          return {
            passed: hasFunctions,
            details: hasFunctions ? 'Function/class definitions found' : 'No function definitions found',
            errors: !hasFunctions ? ['Code should contain at least one function or class definition'] : []
          };
        }
      },
      {
        name: 'error_handling',
        max_score: 20,
        validate: async (content) => {
          const hasErrorHandling = content.includes('try') || content.includes('except') || 
                                   content.includes('catch') || content.includes('throw');
          
          return {
            passed: hasErrorHandling,
            details: hasErrorHandling ? 'Error handling present' : 'No error handling found',
            recommendations: !hasErrorHandling ? ['Consider adding error handling for robustness'] : []
          };
        }
      },
      {
        name: 'documentation',
        max_score: 15,
        validate: async (content) => {
          const hasComments = content.includes('//') || content.includes('#') || content.includes('"""') || content.includes('/*');
          const hasDocstrings = content.includes('"""') || content.includes("'''");
          
          const passed = hasComments || hasDocstrings;
          
          return {
            passed,
            details: passed ? 'Code documentation found' : 'No code documentation found',
            recommendations: !passed ? ['Add comments or docstrings to explain code functionality'] : []
          };
        }
      }
    ];
  }

  /**
   * Create documentation validation rules
   */
  createDocValidationRules() {
    return [
      {
        name: 'structure',
        max_score: 25,
        validate: async (content) => {
          const hasHeadings = content.includes('#') || content.includes('<h');
          const hasParagraphs = content.length > 200;
          
          const passed = hasHeadings && hasParagraphs;
          
          return {
            passed,
            details: `Document structure: headings=${hasHeadings}, substantial_content=${hasParagraphs}`,
            warnings: !passed ? ['Documentation should have clear structure with headings'] : []
          };
        }
      }
    ];
  }

  /**
   * Create basic validation rules
   */
  createBasicValidationRules() {
    return [
      {
        name: 'content_length',
        max_score: 20,
        validate: async (content) => {
          const passed = content.trim().length >= 50;
          
          return {
            passed,
            details: `Content length: ${content.length} characters`,
            errors: !passed ? ['Content too short to be meaningful'] : []
          };
        }
      }
    ];
  }

  /**
   * Detect language from file extension
   */
  detectLanguageFromExtension(extension) {
    const languageMap = {
      'html': 'html',
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return languageMap[extension] || 'text';
  }

  /**
   * Generate validation report
   */
  generateReport(validationResults) {
    const report = {
      timestamp: new Date().toISOString(),
      overall_score: validationResults.overall_score,
      grade: this.getGrade(validationResults.overall_score),
      passed: validationResults.passed,
      summary: {
        total_files: validationResults.validations.length,
        files_passed: validationResults.validations.filter(v => v.passed).length,
        total_errors: validationResults.errors.length,
        total_warnings: validationResults.warnings.length,
        total_recommendations: validationResults.recommendations.length
      },
      details: validationResults.validations,
      recommendations: [...new Set(validationResults.recommendations)] // Remove duplicates
    };

    return report;
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B'; 
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

module.exports = { ValidationPipeline };