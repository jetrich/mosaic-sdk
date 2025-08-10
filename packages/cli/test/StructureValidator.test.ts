/**
 * Structure Validator Tests
 * Tests for framework alignment validation
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { StructureValidator } from "../src/validators/StructureValidator";

describe("StructureValidator", () => {
  let validator: StructureValidator;
  let tempDir: string;

  beforeEach(() => {
    validator = new StructureValidator();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mosaic-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("validateProjectStructure", () => {
    it("should pass validation for compliant structure", async () => {
      // Create compliant structure
      const projectName = "test-project";
      const docsPath = path.join(tempDir, "docs", projectName);

      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "task-management"));
      fs.mkdirSync(path.join(docsPath, "architecture"));
      fs.mkdirSync(path.join(docsPath, "api"));
      fs.mkdirSync(path.join(docsPath, "operations"));

      // Create _project.yaml
      const projectYaml = `project:
  name: "${projectName}"
  type: "application"`;
      fs.writeFileSync(path.join(docsPath, "_project.yaml"), projectYaml);

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.projectName).toBe(projectName);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it("should fail validation for domain folders at docs root", async () => {
      // Create non-compliant structure (domain folders at root)
      const docsPath = path.join(tempDir, "docs");
      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "architecture"));
      fs.mkdirSync(path.join(docsPath, "api"));

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const domainViolations = result.errors.filter(
        (error) => error.type === "DOMAIN_SHELF_VIOLATION",
      );
      expect(domainViolations.length).toBeGreaterThan(0);
    });

    it("should detect missing project folder", async () => {
      // Create docs folder but no project structure
      const docsPath = path.join(tempDir, "docs");
      fs.mkdirSync(docsPath, { recursive: true });

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.valid).toBe(false);

      const missingProjectErrors = result.errors.filter(
        (error) => error.type === "MISSING_PROJECT_FOLDER",
      );
      expect(missingProjectErrors.length).toBe(1);
    });

    it("should detect missing _project.yaml", async () => {
      // Create project structure but no _project.yaml
      const projectName = "test-project";
      const docsPath = path.join(tempDir, "docs", projectName);

      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "task-management"));
      fs.mkdirSync(path.join(docsPath, "architecture"));

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.valid).toBe(false);

      const missingYamlErrors = result.errors.filter(
        (error) => error.type === "MISSING_PROJECT_YAML",
      );
      expect(missingYamlErrors.length).toBe(1);
    });

    it("should provide suggestions for fixes", async () => {
      // Create structure with domain folders at root
      const docsPath = path.join(tempDir, "docs");
      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "architecture"));

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.suggestions.length).toBeGreaterThan(0);

      const migrationSuggestion = result.suggestions.find(
        (suggestion) => suggestion.type === "MIGRATION_NEEDED",
      );
      expect(migrationSuggestion).toBeDefined();
      expect(migrationSuggestion?.command).toBe("mosaic docs migrate");
    });

    it("should validate execution time is reasonable", async () => {
      const result = await validator.validateProjectStructure(tempDir);

      // Should complete in under 1 second for typical project
      expect(result.executionTime).toBeLessThan(1000);
    });

    it("should handle non-existent paths gracefully", async () => {
      const nonExistentPath = path.join(tempDir, "non-existent");

      const result = await validator.validateProjectStructure(nonExistentPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect invalid _project.yaml content", async () => {
      // Create project structure with invalid _project.yaml
      const projectName = "test-project";
      const docsPath = path.join(tempDir, "docs", projectName);

      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "task-management"));

      // Create invalid YAML (missing required fields)
      const invalidYaml = "invalid: yaml content";
      fs.writeFileSync(path.join(docsPath, "_project.yaml"), invalidYaml);

      const result = await validator.validateProjectStructure(tempDir);

      expect(result.valid).toBe(false);

      const invalidYamlErrors = result.errors.filter(
        (error) => error.type === "INVALID_PROJECT_YAML",
      );
      expect(invalidYamlErrors.length).toBe(1);
    });

    it("should warn about missing task-management structure", async () => {
      // Create project structure without task-management
      const projectName = "test-project";
      const docsPath = path.join(tempDir, "docs", projectName);

      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(path.join(docsPath, "architecture"));
      fs.mkdirSync(path.join(docsPath, "api"));

      const projectYaml = `project:
  name: "${projectName}"`;
      fs.writeFileSync(path.join(docsPath, "_project.yaml"), projectYaml);

      const result = await validator.validateProjectStructure(tempDir);

      const taskMgmtWarnings = result.warnings.filter(
        (warning) => warning.type === "MISSING_TASK_MANAGEMENT",
      );
      expect(taskMgmtWarnings.length).toBe(1);
    });
  });
});
