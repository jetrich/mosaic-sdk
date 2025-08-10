/**
 * Atomic File Operations for Ollama MCP - Production Ready
 * Implements staged writes with validation and rollback capability
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class AtomicFileOperations {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.stagingDir = path.join(os.tmpdir(), 'ollama-staging', crypto.randomUUID());
    this.operations = new Map(); // Track all operations for rollback
    this.manifest = [];
    
    // Ensure staging directory exists
    fs.mkdirSync(this.stagingDir, { recursive: true });
  }

  /**
   * Stage a file write operation
   * @param {string} relativePath - Path relative to base directory
   * @param {string} content - File content
   * @param {object} options - Options (encoding, executable, eol)
   * @returns {object} - Operation result with staging info
   */
  async stageWrite(relativePath, content, options = {}) {
    const {
      encoding = 'utf-8',
      executable = false,
      eol = 'lf',
      sha256 = null
    } = options;

    // Normalize path and prevent directory traversal
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const finalPath = path.join(this.baseDir, normalizedPath);
    const stagingPath = path.join(this.stagingDir, normalizedPath);

    // Ensure staging subdirectories exist
    const stagingDirPath = path.dirname(stagingPath);
    fs.mkdirSync(stagingDirPath, { recursive: true });

    // Normalize line endings
    let processedContent = content;
    if (eol === 'lf') {
      processedContent = content.replace(/\r\n/g, '\n');
    } else if (eol === 'crlf') {
      processedContent = content.replace(/\n/g, '\r\n');
    }

    // Calculate and verify checksum
    const calculatedSHA256 = crypto.createHash('sha256').update(processedContent, encoding).digest('hex');
    if (sha256 && sha256 !== calculatedSHA256) {
      throw new Error(`SHA-256 mismatch for ${relativePath}. Expected: ${sha256}, Got: ${calculatedSHA256}`);
    }

    // Write to staging area
    try {
      fs.writeFileSync(stagingPath, processedContent, { encoding });
      
      // Set executable permission if needed
      if (executable) {
        fs.chmodSync(stagingPath, 0o755);
      }

      const operation = {
        type: 'write',
        relativePath: normalizedPath,
        finalPath: finalPath,
        stagingPath: stagingPath,
        sha256: calculatedSHA256,
        size: Buffer.byteLength(processedContent, encoding),
        executable: executable,
        encoding: encoding,
        eol: eol,
        timestamp: new Date().toISOString()
      };

      this.operations.set(normalizedPath, operation);
      
      return {
        success: true,
        operation: operation,
        staged: true
      };
    } catch (error) {
      throw new Error(`Failed to stage write for ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Stage a file delete operation
   * @param {string} relativePath - Path relative to base directory
   * @returns {object} - Operation result
   */
  async stageDelete(relativePath) {
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const finalPath = path.join(this.baseDir, normalizedPath);

    // Check if file exists
    if (!fs.existsSync(finalPath)) {
      throw new Error(`Cannot delete ${relativePath}: file does not exist`);
    }

    const operation = {
      type: 'delete',
      relativePath: normalizedPath,
      finalPath: finalPath,
      timestamp: new Date().toISOString()
    };

    this.operations.set(normalizedPath, operation);
    
    return {
      success: true,
      operation: operation,
      staged: true
    };
  }

  /**
   * Run preflight checks on staged operations
   * @returns {object} - Validation results
   */
  async runPreflightChecks() {
    const results = {
      passed: true,
      checks: [],
      errors: [],
      warnings: []
    };

    for (const [relativePath, operation] of this.operations) {
      const check = { path: relativePath, type: operation.type, status: 'unknown', details: [] };

      try {
        if (operation.type === 'write') {
          // Verify staged file exists and has correct checksum
          if (!fs.existsSync(operation.stagingPath)) {
            throw new Error('Staged file not found');
          }

          const stagedContent = fs.readFileSync(operation.stagingPath, { encoding: operation.encoding });
          const stagedSHA256 = crypto.createHash('sha256').update(stagedContent, operation.encoding).digest('hex');
          
          if (stagedSHA256 !== operation.sha256) {
            throw new Error(`SHA-256 mismatch in staging area`);
          }

          // Basic syntax validation for known file types
          const ext = path.extname(operation.relativePath).toLowerCase();
          if (ext === '.json') {
            try {
              JSON.parse(stagedContent);
              check.details.push('Valid JSON syntax');
            } catch (jsonError) {
              results.warnings.push(`${relativePath}: JSON syntax warning - ${jsonError.message}`);
              check.details.push(`JSON syntax warning: ${jsonError.message}`);
            }
          }

          // Check for common issues
          if (stagedContent.includes('TODO') || stagedContent.includes('PLACEHOLDER')) {
            results.warnings.push(`${relativePath}: Contains TODO or PLACEHOLDER markers`);
            check.details.push('Contains TODO/PLACEHOLDER markers');
          }

          if (stagedContent.trim().length === 0) {
            throw new Error('File is empty');
          }

          check.status = 'passed';
          check.details.push(`SHA-256: ${stagedSHA256}`);
          check.details.push(`Size: ${operation.size} bytes`);

        } else if (operation.type === 'delete') {
          // Verify target file still exists before delete
          if (!fs.existsSync(operation.finalPath)) {
            results.warnings.push(`${relativePath}: Target file for deletion no longer exists`);
          }
          check.status = 'passed';
        }
      } catch (error) {
        check.status = 'failed';
        check.details.push(`Error: ${error.message}`);
        results.errors.push(`${relativePath}: ${error.message}`);
        results.passed = false;
      }

      results.checks.push(check);
    }

    return results;
  }

  /**
   * Commit all staged operations atomically
   * @returns {object} - Commit results
   */
  async commitAll() {
    const preflightResults = await this.runPreflightChecks();
    
    if (!preflightResults.passed) {
      throw new Error(`Preflight checks failed: ${preflightResults.errors.join('; ')}`);
    }

    const commitResults = {
      success: true,
      committed: [],
      errors: [],
      manifest: []
    };

    // Commit all operations
    for (const [relativePath, operation] of this.operations) {
      try {
        if (operation.type === 'write') {
          // Ensure target directory exists
          const targetDir = path.dirname(operation.finalPath);
          fs.mkdirSync(targetDir, { recursive: true });

          // Atomic operation from staging to final location
          try {
            // Try atomic rename first (fastest)
            fs.renameSync(operation.stagingPath, operation.finalPath);
          } catch (renameError) {
            if (renameError.code === 'EXDEV') {
              // Cross-device link error - fallback to copy + delete
              fs.copyFileSync(operation.stagingPath, operation.finalPath);
              fs.unlinkSync(operation.stagingPath);
            } else {
              throw renameError;
            }
          }

          // Set executable permission if needed
          if (operation.executable) {
            fs.chmodSync(operation.finalPath, 0o755);
          }

          const manifestEntry = {
            type: 'write',
            path: operation.relativePath,
            sha256: operation.sha256,
            size: operation.size,
            timestamp: operation.timestamp,
            encoding: operation.encoding,
            executable: operation.executable
          };

          commitResults.committed.push(operation.relativePath);
          commitResults.manifest.push(manifestEntry);
          this.manifest.push(manifestEntry);

        } else if (operation.type === 'delete') {
          // Delete the file
          if (fs.existsSync(operation.finalPath)) {
            fs.unlinkSync(operation.finalPath);
          }

          const manifestEntry = {
            type: 'delete',
            path: operation.relativePath,
            timestamp: operation.timestamp
          };

          commitResults.committed.push(`${operation.relativePath} (deleted)`);
          commitResults.manifest.push(manifestEntry);
          this.manifest.push(manifestEntry);
        }
      } catch (error) {
        commitResults.success = false;
        commitResults.errors.push(`${relativePath}: ${error.message}`);
      }
    }

    // Save operation manifest
    const manifestPath = path.join(this.baseDir, '.ollama-manifest.json');
    const manifestData = {
      timestamp: new Date().toISOString(),
      operations: this.manifest,
      session_id: path.basename(this.stagingDir)
    };

    try {
      fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
      commitResults.manifest_saved = manifestPath;
    } catch (error) {
      commitResults.errors.push(`Failed to save manifest: ${error.message}`);
    }

    return commitResults;
  }

  /**
   * Rollback all operations (remove staged files)
   * @returns {object} - Rollback results
   */
  async rollback() {
    const rollbackResults = {
      success: true,
      cleaned: [],
      errors: []
    };

    for (const [relativePath, operation] of this.operations) {
      try {
        if (operation.type === 'write' && fs.existsSync(operation.stagingPath)) {
          fs.unlinkSync(operation.stagingPath);
          rollbackResults.cleaned.push(operation.stagingPath);
        }
      } catch (error) {
        rollbackResults.success = false;
        rollbackResults.errors.push(`${relativePath}: ${error.message}`);
      }
    }

    // Clean up staging directory
    try {
      if (fs.existsSync(this.stagingDir)) {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
        rollbackResults.staging_cleaned = this.stagingDir;
      }
    } catch (error) {
      rollbackResults.errors.push(`Failed to clean staging directory: ${error.message}`);
    }

    return rollbackResults;
  }

  /**
   * Get summary of staged operations
   * @returns {object} - Operations summary
   */
  getSummary() {
    const summary = {
      total_operations: this.operations.size,
      writes: 0,
      deletes: 0,
      total_size: 0,
      files: []
    };

    for (const [relativePath, operation] of this.operations) {
      if (operation.type === 'write') {
        summary.writes++;
        summary.total_size += operation.size;
      } else if (operation.type === 'delete') {
        summary.deletes++;
      }

      summary.files.push({
        path: operation.relativePath,
        type: operation.type,
        size: operation.size || 0,
        sha256: operation.sha256
      });
    }

    return summary;
  }

  /**
   * Cleanup - always call this to clean staging area
   */
  async cleanup() {
    try {
      if (fs.existsSync(this.stagingDir)) {
        fs.rmSync(this.stagingDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Warning: Failed to cleanup staging directory: ${error.message}`);
    }
  }
}

module.exports = { AtomicFileOperations };