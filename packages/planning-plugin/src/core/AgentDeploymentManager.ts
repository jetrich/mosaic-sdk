/**
 * Agent Deployment Manager
 * 
 * Handles spawning and managing specialized Claude agents for UPP decomposition.
 * Manages agent lifecycle, resource allocation, and communication protocols.
 */

import { Logger } from '../utils/Logger';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export interface AgentDeploymentConfig {
  persona: string;
  taskType: string;
  instructions: string;
  resourceLimits: {
    maxMemoryMB: number;
    maxTimeoutMs: number;
  };
  tools: string[];
}

export interface AgentDeploymentResult {
  agentId: string;
  processId: number;
  status: 'spawned' | 'running' | 'completed' | 'failed';
  communication: {
    stdin: NodeJS.WritableStream;
    stdout: NodeJS.ReadableStream;
    stderr: NodeJS.ReadableStream;
  };
  metadata: {
    spawnedAt: Date;
    persona: string;
    taskType: string;
  };
}

/**
 * Agent Deployment Manager
 */
export class AgentDeploymentManager {
  private logger: Logger;
  private activeAgents: Map<string, AgentDeploymentResult> = new Map();
  private agentCounter = 0;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Deploy a specialized agent for UPP decomposition
   */
  async deployAgent(config: AgentDeploymentConfig): Promise<AgentDeploymentResult> {
    const agentId = `agent-${++this.agentCounter}-${Date.now()}`;
    
    this.logger.info('Deploying specialized agent', {
      agentId,
      persona: config.persona,
      taskType: config.taskType
    });

    try {
      // Create agent spawn command
      const agentCommand = this.buildAgentCommand(agentId, config);
      
      // Spawn the agent process
      const agentProcess = spawn('claude', agentCommand.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...agentCommand.environment
        }
      });

      // Create deployment result
      const deployment: AgentDeploymentResult = {
        agentId,
        processId: agentProcess.pid || 0,
        status: 'spawned',
        communication: {
          stdin: agentProcess.stdin,
          stdout: agentProcess.stdout,
          stderr: agentProcess.stderr
        },
        metadata: {
          spawnedAt: new Date(),
          persona: config.persona,
          taskType: config.taskType
        }
      };

      // Set up process handlers
      this.setupAgentHandlers(agentProcess, deployment);

      // Store active agent
      this.activeAgents.set(agentId, deployment);

      this.logger.info('Agent deployed successfully', {
        agentId,
        processId: deployment.processId
      });

      return deployment;

    } catch (error: any) {
      this.logger.error('Agent deployment failed', {
        agentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute task with deployed agent
   */
  async executeWithAgent(
    agentId: string, 
    task: any
  ): Promise<any> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.logger.info('Executing task with agent', {
      agentId,
      taskType: task.type
    });

    try {
      // Update agent status
      agent.status = 'running';
      this.activeAgents.set(agentId, agent);

      // Send task to agent
      const taskPayload = JSON.stringify({
        type: 'execute_task',
        task,
        timestamp: new Date().toISOString()
      });

      agent.communication.stdin?.write(taskPayload + '\n');

      // Wait for response
      const response = await this.waitForAgentResponse(agent);

      // Update agent status
      agent.status = 'completed';
      this.activeAgents.set(agentId, agent);

      return response;

    } catch (error: any) {
      // Update agent status to failed
      agent.status = 'failed';
      this.activeAgents.set(agentId, agent);

      this.logger.error('Agent task execution failed', {
        agentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Terminate agent and clean up resources
   */
  async terminateAgent(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      this.logger.warn('Attempted to terminate non-existent agent', { agentId });
      return;
    }

    this.logger.info('Terminating agent', {
      agentId,
      processId: agent.processId
    });

    try {
      // Send termination signal
      process.kill(agent.processId, 'SIGTERM');

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        setTimeout(resolve, 2000); // Wait 2 seconds
      });

      // Force kill if still running
      try {
        process.kill(agent.processId, 'SIGKILL');
      } catch (e) {
        // Process already terminated
      }

      // Remove from active agents
      this.activeAgents.delete(agentId);

      this.logger.info('Agent terminated successfully', { agentId });

    } catch (error: any) {
      this.logger.error('Agent termination failed', {
        agentId,
        error: error.message
      });
    }
  }

  /**
   * Get status of all active agents
   */
  getActiveAgents(): Map<string, AgentDeploymentResult> {
    return new Map(this.activeAgents);
  }

  /**
   * Clean up all agents
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up agent deployment manager');

    const agentIds = Array.from(this.activeAgents.keys());
    const terminationPromises = agentIds.map(agentId => 
      this.terminateAgent(agentId).catch(error => 
        this.logger.error('Error terminating agent during cleanup', {
          agentId,
          error: error.message
        })
      )
    );

    await Promise.all(terminationPromises);

    this.activeAgents.clear();
    this.agentCounter = 0;

    this.logger.info('Agent deployment manager cleanup completed');
  }

  /**
   * Build agent spawn command
   */
  private buildAgentCommand(agentId: string, config: AgentDeploymentConfig) {
    const args = [
      '-p', config.instructions,
      '--persona', config.persona,
      '--mode', 'agent',
      '--task-type', config.taskType,
      '--agent-id', agentId
    ];

    // Add tools
    if (config.tools && config.tools.length > 0) {
      args.push('--tools', config.tools.join(','));
    }

    const environment = {
      CLAUDE_AGENT_MODE: 'true',
      CLAUDE_AGENT_ID: agentId,
      CLAUDE_PERSONA: config.persona,
      CLAUDE_TASK_TYPE: config.taskType,
      CLAUDE_MAX_MEMORY_MB: config.resourceLimits.maxMemoryMB.toString(),
      CLAUDE_TIMEOUT_MS: config.resourceLimits.maxTimeoutMs.toString()
    };

    return { args, environment };
  }

  /**
   * Set up process event handlers
   */
  private setupAgentHandlers(
    process: ChildProcess, 
    deployment: AgentDeploymentResult
  ): void {
    const agentId = deployment.agentId;

    process.on('error', (error) => {
      this.logger.error('Agent process error', {
        agentId,
        error: error.message
      });
      deployment.status = 'failed';
      this.activeAgents.set(agentId, deployment);
    });

    process.on('exit', (code, signal) => {
      this.logger.info('Agent process exited', {
        agentId,
        code,
        signal
      });
      
      deployment.status = code === 0 ? 'completed' : 'failed';
      this.activeAgents.set(agentId, deployment);
    });

    // Set up stdout/stderr logging
    process.stdout?.on('data', (data) => {
      this.logger.debug('Agent stdout', {
        agentId,
        data: data.toString().trim()
      });
    });

    process.stderr?.on('data', (data) => {
      this.logger.warn('Agent stderr', {
        agentId,
        data: data.toString().trim()
      });
    });
  }

  /**
   * Wait for agent response
   */
  private async waitForAgentResponse(
    agent: AgentDeploymentResult,
    timeoutMs = 30000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let responseBuffer = '';
      let timeoutHandle: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        agent.communication.stdout.removeAllListeners('data');
      };

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error(`Agent response timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Listen for response
      agent.communication.stdout.on('data', (data) => {
        responseBuffer += data.toString();
        
        // Check for complete response (looking for newline-terminated JSON)
        const lines = responseBuffer.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line.trim());
              cleanup();
              resolve(response);
              return;
            } catch (e) {
              // Not valid JSON, continue accumulating
            }
          }
        }
      });
    });
  }
}