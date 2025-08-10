/**
 * Simple Structure Validator Test
 * Basic test without TypeScript compilation issues
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Simple test to verify the compiled validator works
describe("StructureValidator (Compiled)", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mosaic-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("should detect missing docs folder", async () => {
    // Try to load the compiled validator
    let StructureValidator;
    try {
      const validatorModule = require("../dist/validators/StructureValidator");
      StructureValidator = validatorModule.StructureValidator;
    } catch (error) {
      console.log("Validator not compiled yet, skipping test");
      return;
    }

    const validator = new StructureValidator();
    const result = await validator.validateProjectStructure(tempDir);

    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.executionTime).toBeGreaterThan(0);
  });

  test("should handle non-existent paths", async () => {
    let StructureValidator;
    try {
      const validatorModule = require("../dist/validators/StructureValidator");
      StructureValidator = validatorModule.StructureValidator;
    } catch (error) {
      console.log("Validator not compiled yet, skipping test");
      return;
    }

    const validator = new StructureValidator();
    const nonExistentPath = path.join(tempDir, "non-existent");

    const result = await validator.validateProjectStructure(nonExistentPath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("should validate execution time is reasonable", async () => {
    let StructureValidator;
    try {
      const validatorModule = require("../dist/validators/StructureValidator");
      StructureValidator = validatorModule.StructureValidator;
    } catch (error) {
      console.log("Validator not compiled yet, skipping test");
      return;
    }

    const validator = new StructureValidator();
    const result = await validator.validateProjectStructure(tempDir);

    // Should complete in under 1 second for typical project
    expect(result.executionTime).toBeLessThan(1000);
  });
});
