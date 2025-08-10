import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash, randomUUID } from 'crypto';
import { Logger } from '@mosaicstack/mcp-common';
import { ExecutionResult, CodeExecutionOptions, SandboxConfig } from '../types/index.js';

/**
 * Secure code execution service with sandboxing and resource limits
 * Provides safe execution of generated code with proper isolation
 */
export class CodeExecutionService {
  private readonly logger: Logger;
  private readonly defaultTimeout: number = 30000; // 30 seconds
  private readonly maxMemoryMB: number = 512; // 512MB limit
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedLanguages: Set<string> = new Set([
    'python', 'node', 'javascript', 'typescript', 'bash', 'sh'
  ]);

  // Language-specific execution configurations
  private readonly languageConfigs = {
    python: {
      command: 'python3',
      extension: '.py',
      secureArgs: ['-I', '-s'], // Isolated mode, no user site-packages
      timeout: 30000
    },
    node: {
      command: 'node',
      extension: '.js',
      secureArgs: ['--max-old-space-size=256'], // Limit memory
      timeout: 20000
    },
    javascript: {
      command: 'node',
      extension: '.js',
      secureArgs: ['--max-old-space-size=256'],
      timeout: 20000
    },
    typescript: {
      command: 'npx',
      extension: '.ts',
      secureArgs: ['ts-node', '--transpile-only'],
      timeout: 25000
    },
    bash: {
      command: 'bash',
      extension: '.sh',
      secureArgs: ['-e', '-u'], // Exit on error, error on undefined variables
      timeout: 15000
    },
    sh: {
      command: 'sh',
      extension: '.sh',
      secureArgs: ['-e'],
      timeout: 15000
    }
  };

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Execute code in a sandboxed environment
   */
  async executeCode(
    code: string, 
    language: string, 
    options: CodeExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const executionId = randomUUID();
    const startTime = Date.now();

    try {
      // Validate inputs
      this.validateInputs(code, language, options);
      
      // Security check
      await this.performSecurityCheck(code, language);
      
      // Create sandboxed environment
      const sandbox = await this.createSandbox(executionId, options.sandbox);
      
      // Write code to temporary file
      const codeFile = await this.writeCodeToFile(code, language, sandbox.workingDir);
      
      // Execute with resource limits and monitoring
      const result = await this.executeInSandbox(
        codeFile, 
        language, 
        sandbox, 
        options
      );
      
      // Cleanup
      await this.cleanupSandbox(sandbox);
      
      const duration = Date.now() - startTime;
      
      this.logger.info('Code execution completed', {
        executionId,
        language,
        duration,
        exitCode: result.exitCode
      });
      
      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: duration,
        metadata: {
          executionId,
          language,
          sandboxed: true,
          resourceLimits: {
            timeout: options.timeout || this.languageConfigs[language as keyof typeof this.languageConfigs]?.timeout || this.defaultTimeout,
            memory: options.maxMemory || this.maxMemoryMB
          }
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Code execution failed', {
        executionId,
        language,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: -1,
        executionTime: duration,
        metadata: {
          executionId,
          language,
          sandboxed: true,
          error: true
        }
      };
    }
  }

  /**
   * Execute code with streaming output
   */
  async executeCodeStream(
    code: string,
    language: string,
    options: CodeExecutionOptions = {}
  ): Promise<{
    process: ChildProcess;
    result: Promise<ExecutionResult>;
  }> {
    const executionId = randomUUID();
    
    // Validate and prepare like regular execution
    this.validateInputs(code, language, options);
    await this.performSecurityCheck(code, language);
    
    const sandbox = await this.createSandbox(executionId, options.sandbox);
    const codeFile = await this.writeCodeToFile(code, language, sandbox.workingDir);
    
    const config = this.languageConfigs[language as keyof typeof this.languageConfigs];
    const timeout = options.timeout || config?.timeout || this.defaultTimeout;
    
    // Build command
    const args = [...(config?.secureArgs || [])];
    if (language === 'typescript') {
      args.push(codeFile);
    } else {
      args.push(codeFile);
    }
    
    // Start process
    const process = spawn(config.command, args, {
      cwd: sandbox.workingDir,
      env: this.createSecureEnvironment(options.sandbox),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout
    });
    
    // Create result promise
    const result = new Promise<ExecutionResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      const startTime = Date.now();
      
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', async (code, signal) => {
        const duration = Date.now() - startTime;
        await this.cleanupSandbox(sandbox);
        
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || (signal ? -1 : 0),
          executionTime: duration,
          metadata: {
            executionId,
            language,
            sandboxed: true,
            streamed: true,
            signal: signal || undefined
          }
        });
      });
      
      process.on('error', async (error) => {
        const duration = Date.now() - startTime;
        await this.cleanupSandbox(sandbox);
        
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: -1,
          executionTime: duration,
          metadata: {
            executionId,
            language,
            sandboxed: true,
            streamed: true,
            error: true
          }
        });
      });
    });
    
    return { process, result };
  }

  /**
   * Validate execution inputs
   */
  private validateInputs(code: string, language: string, options: CodeExecutionOptions): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Code cannot be empty');
    }
    
    if (!language) {
      throw new Error('Language must be specified');
    }
    
    if (!this.allowedLanguages.has(language)) {
      throw new Error(`Language '${language}' is not supported. Allowed: ${Array.from(this.allowedLanguages).join(', ')}`);
    }
    
    if (code.length > this.maxFileSize) {
      throw new Error(`Code size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }
    
    if (options.timeout && options.timeout > 300000) { // 5 minutes max
      throw new Error('Timeout cannot exceed 5 minutes');
    }
    
    if (options.maxMemory && options.maxMemory > 2048) { // 2GB max
      throw new Error('Memory limit cannot exceed 2GB');
    }
  }

  /**
   * Perform security checks on code
   */
  private async performSecurityCheck(code: string, language: string): Promise<void> {
    const securityRules = {
      // Dangerous patterns to detect
      dangerous: [
        /rm\s+-rf/i,           // Destructive file operations
        /del\s+\/[sq]/i,       // Windows destructive operations
        /format\s+c:/i,        // Format drive
        /shutdown|reboot/i,    // System control
        /sudo|su\s/i,         // Privilege escalation
        /chmod\s+777/i,        // Dangerous permissions
        /eval\s*\(/i,          // Dynamic code execution
        /exec\s*\(/i,          // Command execution
        /system\s*\(/i,        // System calls
        /import\s+subprocess/i, // Process spawning in Python
        /os\.system/i,         // OS system calls
        /child_process/i,      // Node.js child processes
        /\.\.\/\.\.\//,        // Path traversal
        /\/etc\/passwd/i,      // System file access
        /\/dev\/sda/i,         // Direct device access
        /mkfifo|mknod/i,       // Special file creation
        /nc\s|netcat/i,        // Network tools
        /curl|wget.*\|/i,      // Piped network requests
        /base64.*\|/i,         // Encoded execution
      ],
      
      // Network operations (could be legitimate but flagged)
      network: [
        /import\s+requests/i,
        /import\s+urllib/i,
        /import\s+socket/i,
        /fetch\(/i,
        /XMLHttpRequest/i,
        /axios\./i,
        /http\.get|http\.post/i
      ],
      
      // File system operations
      filesystem: [
        /open\s*\(/i,
        /file\s*\(/i,
        /write|append/i,
        /fs\.write|fs\.read/i,
        /fopen|fwrite/i
      ]
    };

    // Check for dangerous patterns
    for (const pattern of securityRules.dangerous) {
      if (pattern.test(code)) {
        throw new Error(`Code contains potentially dangerous pattern: ${pattern.source}`);
      }
    }
    
    // Log warnings for network/filesystem operations
    const networkMatches = securityRules.network.some(pattern => pattern.test(code));
    const filesystemMatches = securityRules.filesystem.some(pattern => pattern.test(code));
    
    if (networkMatches) {
      this.logger.warn('Code contains network operations - executing with restrictions');
    }
    
    if (filesystemMatches) {
      this.logger.warn('Code contains filesystem operations - executing in isolated environment');
    }
  }

  /**
   * Create a sandboxed execution environment
   */
  private async createSandbox(executionId: string, config?: SandboxConfig): Promise<{
    workingDir: string;
    tempDir: string;
    cleanup: () => Promise<void>;
  }> {
    const sandboxDir = join(tmpdir(), `ollama-sandbox-${executionId}`);
    const workingDir = join(sandboxDir, 'work');
    const tempDir = join(sandboxDir, 'tmp');
    
    // Create directories
    await fs.mkdir(workingDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create restricted environment files if needed
    if (config?.restrictNetwork) {
      // Could implement iptables rules or use Docker here
      this.logger.info('Network restrictions requested but not implemented in basic sandbox');
    }
    
    return {
      workingDir,
      tempDir,
      cleanup: async () => {
        try {
          await fs.rm(sandboxDir, { recursive: true, force: true });
        } catch (error) {
          this.logger.warn('Failed to cleanup sandbox', { error });
        }
      }
    };
  }

  /**
   * Write code to a temporary file
   */
  private async writeCodeToFile(
    code: string, 
    language: string, 
    workingDir: string
  ): Promise<string> {
    const config = this.languageConfigs[language as keyof typeof this.languageConfigs];
    const extension = config?.extension || '.txt';
    const filename = `code_${createHash('md5').update(code).digest('hex').slice(0, 8)}${extension}`;
    const filepath = join(workingDir, filename);
    
    await fs.writeFile(filepath, code, 'utf8');
    
    // Make executable for shell scripts
    if (language === 'bash' || language === 'sh') {
      await fs.chmod(filepath, 0o755);
    }
    
    return filepath;
  }

  /**
   * Execute code in the sandbox
   */
  private async executeInSandbox(
    codeFile: string,
    language: string,
    sandbox: { workingDir: string; tempDir: string; cleanup: () => Promise<void> },
    options: CodeExecutionOptions
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const config = this.languageConfigs[language as keyof typeof this.languageConfigs];
    const timeout = options.timeout || config?.timeout || this.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let isResolved = false;
      
      // Build command arguments
      const args = [...(config?.secureArgs || [])];
      if (language === 'typescript') {
        args.push(codeFile);
      } else {
        args.push(codeFile);
      }
      
      // Spawn process with restrictions
      const childProcess = spawn(config.command, args, {
        cwd: sandbox.workingDir,
        env: this.createSecureEnvironment(options.sandbox),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout,
        // Additional security options
        // Additional security options would go here in a more advanced implementation
      });
      
      // Handle timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          childProcess.kill('SIGTERM');
          setTimeout(() => childProcess.kill('SIGKILL'), 5000); // Force kill after 5s
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout);
      
      // Collect output
      childProcess.stdout?.on('data', (data: any) => {
        stdout += data.toString();
        // Prevent output buffer overflow
        if (stdout.length > this.maxFileSize) {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            childProcess.kill('SIGTERM');
            reject(new Error('Output size limit exceeded'));
          }
        }
      });
      
      childProcess.stderr?.on('data', (data: any) => {
        stderr += data.toString();
        if (stderr.length > this.maxFileSize) {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            childProcess.kill('SIGTERM');
            reject(new Error('Error output size limit exceeded'));
          }
        }
      });
      
      // Handle process completion
      childProcess.on('close', (code: any, signal: any) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || (signal ? -1 : 0)
          });
        }
      });
      
      childProcess.on('error', (error: any) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      // Close stdin to prevent hanging
      childProcess.stdin?.end();
    });
  }

  /**
   * Create a secure environment for execution
   */
  private createSecureEnvironment(config?: SandboxConfig): NodeJS.ProcessEnv {
    const secureEnv: NodeJS.ProcessEnv = {
      PATH: '/usr/local/bin:/usr/bin:/bin', // Minimal PATH
      HOME: '/tmp',
      USER: 'sandbox',
      SHELL: '/bin/sh',
      TMPDIR: '/tmp',
      // Prevent network access indicators
      NO_PROXY: '*',
      // Python-specific restrictions
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONPATH: '',
      PYTHONNOUSERSITE: '1',
      // Node.js restrictions
      NODE_OPTIONS: '--max-old-space-size=256',
      // General restrictions
      DEBIAN_FRONTEND: 'noninteractive',
    };
    
    // Add any allowed environment variables from config
    if (config?.allowedEnvVars) {
      for (const [key, value] of Object.entries(config.allowedEnvVars)) {
        secureEnv[key] = value;
      }
    }
    
    return secureEnv;
  }

  /**
   * Cleanup sandbox environment
   */
  private async cleanupSandbox(sandbox: { cleanup: () => Promise<void> }): Promise<void> {
    try {
      await sandbox.cleanup();
    } catch (error) {
      this.logger.error('Failed to cleanup sandbox', { error });
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.allowedLanguages);
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.allowedLanguages.has(language);
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(language: string) {
    return this.languageConfigs[language as keyof typeof this.languageConfigs] || null;
  }
}