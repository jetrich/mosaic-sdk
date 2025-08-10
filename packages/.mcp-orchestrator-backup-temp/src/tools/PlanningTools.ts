/**
 * MCP-Compliant Planning Tools for MosAIc Planning Plugin Integration
 * Proper implementation following MCP protocol standards
 */

import { MCPTool, ToolResponse } from '../types';

export class PlanningTools {
  private businessCommand: any;
  private allCommand: any;

  constructor() {
    try {
      const path = require('path');
      const os = require('os');
      
      // Try multiple paths for planning plugin
      const pluginPaths = [
        '../../../planning-plugin/src/commands', // Development path
        './planning-plugin/src/commands', // Relative to MCP server installation
        path.join(__dirname, '../../planning-plugin/src/commands'), // Adjacent to MCP server
        path.join(os.homedir(), '.config/mosaic/mcp-server/planning-plugin/src/commands'), // Installed alongside MCP server
        path.join(os.homedir(), '.config/mosaic/plugins/planning-plugin/src/commands') // Separate plugin installation
      ];
      
      let PlanBusinessCommand, PlanAllCommand;
      
      for (const pluginPath of pluginPaths) {
        try {
          PlanBusinessCommand = require(path.join(pluginPath, 'plan-business'));
          PlanAllCommand = require(path.join(pluginPath, 'plan-all'));
          console.log(`Planning plugin loaded from: ${pluginPath}`);
          break;
        } catch (e) {
          // Try next path
          continue;
        }
      }
      
      if (PlanBusinessCommand && PlanAllCommand) {
        this.businessCommand = new PlanBusinessCommand();
        this.allCommand = new PlanAllCommand();
      } else {
        throw new Error('Planning plugin commands not found in any search path');
      }
    } catch (error: any) {
      console.warn('Planning plugin commands unavailable:', error.message);
      this.businessCommand = null;
      this.allCommand = null;
    }
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'mosaic_plan_business',
        description: 'Execute business strategy planning using MosAIc UPP methodology',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project identifier'
            },
            description: {
              type: 'string', 
              description: 'Project description for business planning'
            },
            stakeholders: {
              type: 'string',
              description: 'Optional JSON string of stakeholder information'
            },
            market: {
              type: 'string',
              description: 'Optional market context information'
            },
            force: {
              type: 'boolean',
              description: 'Force execution even if dependencies are missing',
              default: false
            }
          },
          required: ['project', 'description']
        },
        handler: this.handlePlanBusiness.bind(this)
      },
      {
        name: 'mosaic_plan_all',
        description: 'Execute complete business-to-technical planning pipeline with scope control',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project identifier'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            timeline: {
              type: 'number',
              description: 'Optional project timeline in months'
            },
            budget: {
              type: 'string',
              description: 'Optional budget level (startup, enterprise, etc.)'
            },
            teamSize: {
              type: 'number',
              description: 'Optional team size'
            },
            skipCompleted: {
              type: 'boolean',
              description: 'Skip already completed planning modules',
              default: true
            },
            verbose: {
              type: 'boolean',
              description: 'Enable verbose output',
              default: false
            }
          },
          required: ['project', 'description']
        },
        handler: this.handlePlanAll.bind(this)
      }
    ];
  }

  private async handlePlanBusiness(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      // Check if business command is available
      if (!this.businessCommand) {
        return {
          title: 'Business Planning Unavailable',
          metadata: {
            operation: 'mosaic_plan_business',
            status: 'error',
            timestamp: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime
          },
          output: '❌ **Planning plugin business command not available**\n\nThe planning plugin dependencies are missing. Please ensure the MosAIc planning plugin is properly installed.'
        };
      }

      const {
        project: projectId,
        description: projectDescription,
        stakeholders,
        market,
        force = false
      } = args;

      // Parse stakeholder JSON if provided
      let stakeholderInput;
      if (stakeholders) {
        try {
          stakeholderInput = JSON.parse(stakeholders);
        } catch (e) {
          return {
            title: 'Business Planning Failed',
            metadata: {
              operation: 'mosaic_plan_business',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: '❌ **Invalid stakeholders JSON format**\n\nPlease provide stakeholder information as valid JSON.'
          };
        }
      }

      const options = {
        projectId,
        projectDescription,
        stakeholderInput,
        marketContext: market,
        force
      };

      // Execute the business planning command
      const result = await this.businessCommand.execute(options);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        // Format successful response
        let output = `# 🚀 Business Planning Complete for ${projectId}\n\n`;
        
        if (result.result) {
          output += `## Planning Results\n${JSON.stringify(result.result, null, 2)}\n\n`;
        }
        
        if (result.nextSteps) {
          output += `## Next Steps\n${result.nextSteps}\n\n`;
        }
        
        output += `**Duration**: ${duration}ms\n`;
        output += `**Timestamp**: ${new Date().toISOString()}`;

        return {
          title: `Business Planning Completed: ${projectId}`,
          metadata: {
            operation: 'mosaic_plan_business',
            status: 'success',
            data: {
              project_id: projectId,
              duration: result.duration || duration,
              has_next_steps: !!result.nextSteps
            },
            timestamp: new Date().toISOString(),
            execution_time_ms: duration
          },
          output
        };
      } else {
        // Format error response
        let output = `# ❌ Business Planning Failed for ${projectId}\n\n`;
        output += `**Error**: ${result.error || 'Unknown error occurred'}\n\n`;
        
        if (result.fallback) {
          output += `## Fallback Strategy Available\n`;
          output += `The system generated a fallback strategy. Please review the logs for details.\n\n`;
        }
        
        output += `**Duration**: ${duration}ms`;

        return {
          title: `Business Planning Failed: ${projectId}`,
          metadata: {
            operation: 'mosaic_plan_business',
            status: 'error',
            data: {
              project_id: projectId,
              error: result.error,
              has_fallback: !!result.fallback
            },
            timestamp: new Date().toISOString(),
            execution_time_ms: duration
          },
          output
        };
      }

    } catch (error: any) {
      return {
        title: 'Business Planning Error',
        metadata: {
          operation: 'mosaic_plan_business',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `❌ **Business planning execution failed**\n\n**Error**: ${error.message}\n\nPlease check the planning plugin installation and try again.`
      };
    }
  }

  private async handlePlanAll(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      // Check if all command is available
      if (!this.allCommand) {
        return {
          title: 'Complete Planning Unavailable',
          metadata: {
            operation: 'mosaic_plan_all',
            status: 'error',
            timestamp: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime
          },
          output: '❌ **Planning plugin all command not available**\n\nThe planning plugin dependencies are missing. Please ensure the MosAIc planning plugin is properly installed.'
        };
      }

      const {
        project: projectId,
        description,
        timeline,
        budget,
        teamSize,
        skipCompleted = true,
        verbose = false
      } = args;

      const options = {
        projectId,
        description,
        timeline,
        budget,
        teamSize,
        skipCompleted,
        verbose
      };

      // Execute the complete planning pipeline
      const result = await this.allCommand.execute(options);
      const duration = Date.now() - startTime;
      
      // Format the response
      let output = `# 🎯 Complete Planning Pipeline Results for ${projectId}\n\n`;
      
      if (result.success || result.pipelineComplete) {
        output += `## ✅ Pipeline Status: ${result.pipelineComplete ? 'Complete' : 'Partial Success'}\n\n`;
        
        if (result.modulesExecuted && result.modulesExecuted.length > 0) {
          output += `## 📋 Modules Executed (${result.modulesExecuted.length})\n`;
          result.modulesExecuted.forEach((module: string) => {
            output += `- ✅ ${module}\n`;
          });
          output += '\n';
        }
        
        if (result.modulesSkipped && result.modulesSkipped.length > 0) {
          output += `## ⏭️ Modules Skipped (${result.modulesSkipped.length})\n`;
          result.modulesSkipped.forEach((module: string) => {
            output += `- ⏭️ ${module}\n`;
          });
          output += '\n';
        }
        
        if (result.results) {
          output += `## 📊 Results Summary\n${JSON.stringify(result.results, null, 2)}\n\n`;
        }
      } else {
        output += `## ❌ Pipeline Status: Failed\n\n`;
        
        if (result.errors && result.errors.length > 0) {
          output += `## 🚨 Errors (${result.errors.length})\n`;
          result.errors.forEach((error: string) => {
            output += `- ❌ ${error}\n`;
          });
          output += '\n';
        }
      }
      
      if (result.nextSteps) {
        output += `## 🎯 Next Steps\n${result.nextSteps}\n\n`;
      }
      
      output += `**Duration**: ${result.duration || duration}ms\n`;
      output += `**Timestamp**: ${new Date().toISOString()}`;

      return {
        title: `Complete Planning Pipeline: ${projectId}`,
        metadata: {
          operation: 'mosaic_plan_all',
          status: (result.success || result.pipelineComplete) ? 'success' : 'error',
          data: {
            project_id: projectId,
            pipeline_complete: result.pipelineComplete,
            modules_executed: result.modulesExecuted?.length || 0,
            modules_skipped: result.modulesSkipped?.length || 0,
            errors_count: result.errors?.length || 0,
            duration: result.duration || duration
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: duration
        },
        output
      };

    } catch (error: any) {
      return {
        title: 'Complete Planning Error',
        metadata: {
          operation: 'mosaic_plan_all',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `❌ **Complete planning pipeline execution failed**\n\n**Error**: ${error.message}\n\nPlease check the planning plugin installation and try again.`
      };
    }
  }
}