/**
 * Structure Validator - Framework Alignment Enforcement
 * Validates project structure against universal MosAIc alignment rules
 */

import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
  projectName?: string;
  executionTime: number;
}

export interface ValidationError {
  type: ValidationErrorType;
  path: string;
  message: string;
  fix?: string;
  severity: "ERROR" | "WARNING" | "INFO";
}

export interface ValidationWarning {
  type: string;
  path: string;
  message: string;
  suggestion?: string;
}

export interface Suggestion {
  type: string;
  description: string;
  command?: string;
  autoFixable: boolean;
}

export type ValidationErrorType =
  | "MISSING_PROJECT_FOLDER"
  | "DOMAIN_SHELF_VIOLATION"
  | "INVALID_PATH_STRUCTURE"
  | "MISSING_PROJECT_YAML"
  | "INVALID_PROJECT_YAML"
  | "ANTI_PATTERN_DETECTED"
  | "MULTIPLE_MANDATORY_STRUCTURE"
  | "NESTED_DOCUMENTATION";

export interface ProjectStructure {
  projectName: string;
  docsPath: string;
  hasProjectFolder: boolean;
  hasProjectYaml: boolean;
  taskManagementStructure: boolean;
  domainFolders: string[];
  antiPatterns: AntiPattern[];
}

export interface AntiPattern {
  type: string;
  path: string;
  description: string;
  severity: "ERROR" | "WARNING";
}

export class StructureValidator {
  private readonly ANTI_PATTERNS = [
    {
      pattern: /^docs\/(architecture|api|operations|infrastructure)\/$/,
      type: "DOMAIN_SHELF_VIOLATION",
      message: "Domain folders must be under project folder, not at docs root",
      severity: "ERROR" as const,
      fix: "Move to docs/{ProjectName}/{domain}/",
    },
    {
      pattern: /.*\/docs\/.*\/docs\//,
      type: "NESTED_DOCUMENTATION",
      message: "Documentation folders should not be nested",
      severity: "ERROR" as const,
      fix: "Use single docs/ folder at project root",
    },
    {
      pattern: /.*MANDATORY_STRUCTURE\.md$/,
      type: "MULTIPLE_MANDATORY_STRUCTURE",
      message: "Multiple MANDATORY_STRUCTURE.md files detected",
      severity: "WARNING" as const,
      fix: "Keep only one MANDATORY_STRUCTURE.md at project root",
    },
  ];

  /**
   * Validate project structure against universal alignment rules
   */
  public async validateProjectStructure(
    projectPath: string,
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      executionTime: 0,
    };

    try {
      // Detect project structure
      const structure = await this.analyzeProjectStructure(projectPath);
      result.projectName = structure.projectName;

      // Run validation checks
      await this.checkProjectFolderExists(structure, result);
      await this.checkProjectYamlExists(structure, result);
      await this.checkPathPatterns(structure, result);
      await this.detectAntiPatterns(projectPath, result);
      await this.validateTaskManagementStructure(structure, result);

      // Generate suggestions
      this.generateSuggestions(structure, result);

      // Determine overall validity
      result.valid = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        type: "INVALID_PATH_STRUCTURE",
        path: projectPath,
        message: `Failed to analyze project structure: ${(error as Error).message}`,
        severity: "ERROR",
      });
      result.valid = false;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  /**
   * Analyze project structure and extract key information
   */
  private async analyzeProjectStructure(
    projectPath: string,
  ): Promise<ProjectStructure> {
    const docsPath = path.join(projectPath, "docs");
    const structure: ProjectStructure = {
      projectName: "",
      docsPath,
      hasProjectFolder: false,
      hasProjectYaml: false,
      taskManagementStructure: false,
      domainFolders: [],
      antiPatterns: [],
    };

    // Check if docs folder exists
    if (!fs.existsSync(docsPath)) {
      return structure;
    }

    // Detect project name and structure
    const docsContents = fs.readdirSync(docsPath, { withFileTypes: true });

    for (const item of docsContents) {
      if (item.isDirectory()) {
        const itemPath = path.join(docsPath, item.name);

        // Check if this looks like a project folder (contains expected structure)
        if (this.looksLikeProjectFolder(itemPath)) {
          structure.projectName = item.name;
          structure.hasProjectFolder = true;

          // Check for _project.yaml
          const projectYamlPath = path.join(itemPath, "_project.yaml");
          structure.hasProjectYaml = fs.existsSync(projectYamlPath);

          // Check task-management structure
          const taskMgmtPath = path.join(itemPath, "task-management");
          structure.taskManagementStructure = fs.existsSync(taskMgmtPath);

          break;
        } else if (this.isDomainFolder(item.name)) {
          structure.domainFolders.push(item.name);
        }
      }
    }

    return structure;
  }

  /**
   * Check if a folder looks like a project folder
   */
  private looksLikeProjectFolder(folderPath: string): boolean {
    if (!fs.existsSync(folderPath)) return false;

    const contents = fs.readdirSync(folderPath);
    const expectedFolders = [
      "task-management",
      "architecture",
      "api",
      "operations",
    ];

    // Must have at least task-management or 2+ expected folders
    const hasTaskManagement = contents.includes("task-management");
    const expectedCount = expectedFolders.filter((folder) =>
      contents.includes(folder),
    ).length;

    return hasTaskManagement || expectedCount >= 2;
  }

  /**
   * Check if folder name is a domain folder
   */
  private isDomainFolder(name: string): boolean {
    const domainFolders = [
      "architecture",
      "api",
      "operations",
      "infrastructure",
    ];
    return domainFolders.includes(name);
  }

  /**
   * Check if project folder exists under docs/
   */
  private async checkProjectFolderExists(
    structure: ProjectStructure,
    result: ValidationResult,
  ): Promise<void> {
    if (!structure.hasProjectFolder) {
      result.errors.push({
        type: "MISSING_PROJECT_FOLDER",
        path: structure.docsPath,
        message:
          "No project folder found under docs/. Each project must have docs/{ProjectName}/ structure.",
        fix: "Create docs/{ProjectName}/ folder and move domain folders inside",
        severity: "ERROR",
      });
    }
  }

  /**
   * Check if _project.yaml exists and is valid
   */
  private async checkProjectYamlExists(
    structure: ProjectStructure,
    result: ValidationResult,
  ): Promise<void> {
    if (structure.hasProjectFolder && !structure.hasProjectYaml) {
      const projectPath = path.join(structure.docsPath, structure.projectName);
      result.errors.push({
        type: "MISSING_PROJECT_YAML",
        path: path.join(projectPath, "_project.yaml"),
        message: "Missing _project.yaml file in project folder",
        fix: "Create _project.yaml with project metadata",
        severity: "ERROR",
      });
    }

    // Validate _project.yaml content if it exists
    if (structure.hasProjectYaml) {
      try {
        const yamlPath = path.join(
          structure.docsPath,
          structure.projectName,
          "_project.yaml",
        );
        const yamlContent = fs.readFileSync(yamlPath, "utf8");

        // Simple validation - check for basic project structure
        if (
          !yamlContent.includes("project:") ||
          !yamlContent.includes("name:")
        ) {
          result.errors.push({
            type: "INVALID_PROJECT_YAML",
            path: yamlPath,
            message: "_project.yaml missing required project.name field",
            fix: "Add project.name field to _project.yaml",
            severity: "ERROR",
          });
        }
      } catch (error) {
        result.errors.push({
          type: "INVALID_PROJECT_YAML",
          path: path.join(
            structure.docsPath,
            structure.projectName,
            "_project.yaml",
          ),
          message: `Invalid _project.yaml format: ${(error as Error).message}`,
          fix: "Fix YAML syntax in _project.yaml",
          severity: "ERROR",
        });
      }
    }
  }

  /**
   * Check path patterns for violations
   */
  private async checkPathPatterns(
    structure: ProjectStructure,
    result: ValidationResult,
  ): Promise<void> {
    // Check for domain folders at docs root (anti-pattern)
    if (structure.domainFolders.length > 0) {
      for (const folder of structure.domainFolders) {
        result.errors.push({
          type: "DOMAIN_SHELF_VIOLATION",
          path: path.join(structure.docsPath, folder),
          message: `Domain folder "${folder}" found at docs root. Must be under docs/{ProjectName}/`,
          fix: `Move to docs/{ProjectName}/${folder}/`,
          severity: "ERROR",
        });
      }
    }
  }

  /**
   * Detect anti-patterns in project structure
   */
  private async detectAntiPatterns(
    projectPath: string,
    result: ValidationResult,
  ): Promise<void> {
    const antiPatterns = await this.scanForAntiPatterns(projectPath);

    for (const pattern of antiPatterns) {
      result.errors.push({
        type: pattern.type as ValidationErrorType,
        path: pattern.path,
        message: pattern.description,
        severity: pattern.severity,
      });
    }
  }

  /**
   * Scan filesystem for anti-patterns
   */
  private async scanForAntiPatterns(
    projectPath: string,
  ): Promise<AntiPattern[]> {
    const patterns: AntiPattern[] = [];

    const scanDirectory = (dirPath: string, relativePath: string = "") => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const relativeItemPath = path.join(relativePath, item.name);

        // Check against anti-patterns
        for (const antiPattern of this.ANTI_PATTERNS) {
          if (
            antiPattern.pattern.test(
              relativeItemPath + (item.isDirectory() ? "/" : ""),
            )
          ) {
            patterns.push({
              type: antiPattern.type,
              path: itemPath,
              description: antiPattern.message,
              severity: antiPattern.severity,
            });
          }
        }

        // Recursively scan directories
        if (item.isDirectory()) {
          scanDirectory(itemPath, relativeItemPath);
        }
      }
    };

    scanDirectory(projectPath);
    return patterns;
  }

  /**
   * Validate task-management structure follows UPP methodology
   */
  private async validateTaskManagementStructure(
    structure: ProjectStructure,
    result: ValidationResult,
  ): Promise<void> {
    if (!structure.taskManagementStructure) {
      result.warnings.push({
        type: "MISSING_TASK_MANAGEMENT",
        path: path.join(
          structure.docsPath,
          structure.projectName,
          "task-management",
        ),
        message:
          "No task-management folder found. UPP methodology requires task-management structure.",
        suggestion:
          "Create task-management folder with epics/, planning/, active/, completed/ structure",
      });
    }
  }

  /**
   * Generate actionable suggestions based on validation results
   */
  private generateSuggestions(
    structure: ProjectStructure,
    result: ValidationResult,
  ): void {
    // Suggest migration if domain folders at root
    if (structure.domainFolders.length > 0) {
      result.suggestions.push({
        type: "MIGRATION_NEEDED",
        description: "Migrate domain folders to unified project structure",
        command: "mosaic docs migrate",
        autoFixable: true,
      });
    }

    // Suggest project initialization if no structure
    if (!structure.hasProjectFolder) {
      result.suggestions.push({
        type: "INIT_PROJECT_STRUCTURE",
        description: "Initialize compliant project structure",
        command: "mosaic docs init",
        autoFixable: true,
      });
    }

    // Suggest _project.yaml creation
    if (structure.hasProjectFolder && !structure.hasProjectYaml) {
      result.suggestions.push({
        type: "CREATE_PROJECT_YAML",
        description: "Create _project.yaml with project metadata",
        command: "mosaic docs init --project-yaml-only",
        autoFixable: true,
      });
    }
  }
}
