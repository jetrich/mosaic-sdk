import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { ResourceService } from '../services/ResourceService';
import { Logger } from '../utils/Logger';

// Phase 3: Resource Management Tools Schema
const ResourceMonitorSchema = z.object({
  include_history: z.boolean().default(false),
  history_minutes: z.number().min(1).max(1440).default(60),
  include_alerts: z.boolean().default(true),
  include_agent_usage: z.boolean().default(true)
});

const AgentLimitsSchema = z.object({
  action: z.enum(['set', 'get', 'check', 'remove']),
  agent_id: z.string().optional(),
  persona: z.string().optional(),
  limits: z.object({
    max_memory_mb: z.number().min(10).max(8192),
    max_cpu_percent: z.number().min(1).max(100),
    max_concurrent_tasks: z.number().min(1).max(50),
    timeout_minutes: z.number().min(1).max(1440).optional()
  }).optional(),
  created_by: z.string().default('system')
});

const PerformanceReportSchema = z.object({
  time_period_hours: z.number().min(1).max(168).default(24),
  include_recommendations: z.boolean().default(true),
  include_trends: z.boolean().default(true),
  format: z.enum(['detailed', 'summary', 'json']).default('detailed'),
  save_report: z.boolean().default(true)
});

const AlertManagementSchema = z.object({
  action: z.enum(['list', 'acknowledge', 'resolve']),
  alert_id: z.string().optional(),
  severity_filter: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  entity_type: z.enum(['system', 'agent']).optional()
});

export class ResourceTools {
  private resourceService: ResourceService;
  private logger: Logger;

  constructor(resourceService: ResourceService, logger: Logger) {
    this.resourceService = resourceService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'mosaic_resource_monitor',
        description: 'Monitor system and agent resource usage with real-time metrics, historical data, and active alerts',
        inputSchema: {
          type: 'object',
          properties: {
            include_history: {
              type: 'boolean',
              description: 'Include historical resource data',
              default: false
            },
            history_minutes: {
              type: 'number',
              description: 'Minutes of history to include (1-1440)',
              minimum: 1,
              maximum: 1440,
              default: 60
            },
            include_alerts: {
              type: 'boolean',
              description: 'Include active resource alerts',
              default: true
            },
            include_agent_usage: {
              type: 'boolean',
              description: 'Include per-agent resource usage',
              default: true
            }
          }
        },
        handler: this.handleResourceMonitor.bind(this)
      },
      {
        name: 'mosaic_agent_limits',
        description: 'Set, get, check, or remove resource limits for agents to prevent resource abuse and ensure system stability',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['set', 'get', 'check', 'remove'],
              description: 'Action to perform on agent resource limits'
            },
            agent_id: {
              type: 'string',
              description: 'Specific agent ID (optional, can use persona instead)'
            },
            persona: {
              type: 'string',
              description: 'Agent persona pattern (e.g., BE-BACKEND-BENJAMIN)'
            },
            limits: {
              type: 'object',
              properties: {
                max_memory_mb: {
                  type: 'number',
                  minimum: 10,
                  maximum: 8192,
                  description: 'Maximum memory usage in MB'
                },
                max_cpu_percent: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  description: 'Maximum CPU usage percentage'
                },
                max_concurrent_tasks: {
                  type: 'number',
                  minimum: 1,
                  maximum: 50,
                  description: 'Maximum concurrent tasks'
                },
                timeout_minutes: {
                  type: 'number',
                  minimum: 1,
                  maximum: 1440,
                  description: 'Task timeout in minutes (optional)'
                }
              },
              required: ['max_memory_mb', 'max_cpu_percent', 'max_concurrent_tasks'],
              description: 'Resource limits to set (required for set action)'
            },
            created_by: {
              type: 'string',
              description: 'User who is setting the limits',
              default: 'system'
            }
          },
          required: ['action']
        },
        handler: this.handleAgentLimits.bind(this)
      },
      {
        name: 'mosaic_performance_report',
        description: 'Generate comprehensive performance analytics with resource usage trends, efficiency metrics, and optimization recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            time_period_hours: {
              type: 'number',
              minimum: 1,
              maximum: 168,
              description: 'Time period for report in hours (1-168)',
              default: 24
            },
            include_recommendations: {
              type: 'boolean',
              description: 'Include optimization recommendations',
              default: true
            },
            include_trends: {
              type: 'boolean',
              description: 'Include resource usage trends',
              default: true
            },
            format: {
              type: 'string',
              enum: ['detailed', 'summary', 'json'],
              description: 'Report output format',
              default: 'detailed'
            },
            save_report: {
              type: 'boolean',
              description: 'Save report to database for future reference',
              default: true
            }
          }
        },
        handler: this.handlePerformanceReport.bind(this)
      },
      {
        name: 'mosaic_resource_alerts',
        description: 'Manage resource alerts - list active alerts, acknowledge notifications, or resolve issues',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'acknowledge', 'resolve'],
              description: 'Action to perform on alerts'
            },
            alert_id: {
              type: 'string',
              description: 'Specific alert ID (required for acknowledge/resolve actions)'
            },
            severity_filter: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Filter alerts by severity level'
            },
            entity_type: {
              type: 'string',
              enum: ['system', 'agent'],
              description: 'Filter alerts by entity type'
            }
          },
          required: ['action']
        },
        handler: this.handleResourceAlerts.bind(this)
      }
    ];
  }

  private async handleResourceMonitor(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const validatedArgs = ResourceMonitorSchema.parse(args);
      
      // Get current metrics
      const currentMetrics = await this.resourceService.getCurrentMetrics();
      
      // Get historical data if requested
      let history = undefined;
      if (validatedArgs.include_history) {
        history = await this.resourceService.getResourceHistory(validatedArgs.history_minutes);
      }
      
      // Get active alerts if requested
      let alerts: any = undefined;
      if (validatedArgs.include_alerts) {
        alerts = await this.resourceService.getActiveAlerts();
      }
      
      // Get agent usage if requested
      let agentUsage: any = undefined;
      if (validatedArgs.include_agent_usage) {
        agentUsage = await this.resourceService.getAgentResourceUsage();
      }

      const response = {
        current_metrics: currentMetrics,
        historical_data: history,
        active_alerts: alerts,
        agent_usage: agentUsage,
        summary: {
          system_status: this.getSystemStatus(currentMetrics),
          alert_count: alerts?.length || 0,
          critical_alerts: alerts?.filter((a: any) => a.severity === 'critical').length || 0,
          active_agents: agentUsage?.length || 0,
          total_estimated_memory: agentUsage?.reduce((sum: number, a: any) => sum + a.estimated_memory_mb, 0) || 0
        }
      };

      this.logger.info('Resource monitoring completed', {
        include_history: validatedArgs.include_history,
        include_alerts: validatedArgs.include_alerts,
        include_agent_usage: validatedArgs.include_agent_usage
      });

      return {
        title: 'Resource Monitor Report',
        metadata: {
          operation: 'mosaic_resource_monitor',
          status: 'success',
          data: response,
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: this.formatResourceMonitorOutput(response, validatedArgs)
      };

    } catch (error) {
      this.logger.error('Resource monitoring failed', error);
      return {
        title: 'Resource Monitor Error',
        metadata: {
          operation: 'mosaic_resource_monitor',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `Resource monitoring failed: ${(error as Error).message}`
      };
    }
  }

  private async handleAgentLimits(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const validatedArgs = AgentLimitsSchema.parse(args);
      let result: any = {};

      switch (validatedArgs.action) {
        case 'set':
          if (!validatedArgs.limits) {
            throw new Error('Limits are required for set action');
          }
          const limitData: any = {
            agent_id: validatedArgs.agent_id,
            persona: validatedArgs.persona,
            created_by: validatedArgs.created_by,
            active: true,
            max_memory_mb: validatedArgs.limits.max_memory_mb,
            max_cpu_percent: validatedArgs.limits.max_cpu_percent,
            max_concurrent_tasks: validatedArgs.limits.max_concurrent_tasks
          };
          if (validatedArgs.limits.timeout_minutes !== undefined) {
            limitData.timeout_minutes = validatedArgs.limits.timeout_minutes;
          }
          result = await this.resourceService.setAgentResourceLimits(limitData);
          break;

        case 'get':
          result = await this.resourceService.getResourceLimits(
            validatedArgs.agent_id,
            validatedArgs.persona
          );
          break;

        case 'check':
          if (!validatedArgs.agent_id) {
            throw new Error('Agent ID is required for check action');
          }
          result = await this.resourceService.checkAgentLimits(validatedArgs.agent_id);
          break;

        case 'remove':
          // Implementation would require a removeResourceLimits method
          throw new Error('Remove action not implemented yet');

        default:
          throw new Error(`Unknown action: ${validatedArgs.action}`);
      }

      this.logger.info('Agent limits operation completed', {
        action: validatedArgs.action,
        agent_id: validatedArgs.agent_id,
        persona: validatedArgs.persona
      });

      return {
        title: `Agent Limits - ${validatedArgs.action.toUpperCase()}`,
        metadata: {
          operation: 'mosaic_agent_limits',
          status: 'success',
          data: result,
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: this.formatAgentLimitsOutput(validatedArgs.action, result)
      };

    } catch (error) {
      this.logger.error('Agent limits operation failed', error);
      return {
        title: 'Agent Limits Error',
        metadata: {
          operation: 'mosaic_agent_limits',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `Agent limits operation failed: ${(error as Error).message}`
      };
    }
  }

  private async handlePerformanceReport(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const validatedArgs = PerformanceReportSchema.parse(args);
      
      const report = await this.resourceService.generatePerformanceReport(
        validatedArgs.time_period_hours
      );

      this.logger.info('Performance report generated', {
        time_period_hours: validatedArgs.time_period_hours,
        format: validatedArgs.format,
        report_id: report.report_id
      });

      return {
        title: 'Performance Analytics Report',
        metadata: {
          operation: 'mosaic_performance_report',
          status: 'success',
          data: report,
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: this.formatPerformanceReportOutput(report, validatedArgs)
      };

    } catch (error) {
      this.logger.error('Performance report generation failed', error);
      return {
        title: 'Performance Report Error',
        metadata: {
          operation: 'mosaic_performance_report',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `Performance report generation failed: ${(error as Error).message}`
      };
    }
  }

  private async handleResourceAlerts(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const validatedArgs = AlertManagementSchema.parse(args);
      let result: any = {};

      switch (validatedArgs.action) {
        case 'list':
          const allAlerts = await this.resourceService.getActiveAlerts();
          result = allAlerts.filter(alert => {
            if (validatedArgs.severity_filter && alert.severity !== validatedArgs.severity_filter) {
              return false;
            }
            if (validatedArgs.entity_type && alert.entity_type !== validatedArgs.entity_type) {
              return false;
            }
            return true;
          });
          break;

        case 'acknowledge':
          if (!validatedArgs.alert_id) {
            throw new Error('Alert ID is required for acknowledge action');
          }
          await this.resourceService.acknowledgeAlert(validatedArgs.alert_id);
          result = { acknowledged: true, alert_id: validatedArgs.alert_id };
          break;

        case 'resolve':
          if (!validatedArgs.alert_id) {
            throw new Error('Alert ID is required for resolve action');
          }
          await this.resourceService.resolveAlert(validatedArgs.alert_id);
          result = { resolved: true, alert_id: validatedArgs.alert_id };
          break;

        default:
          throw new Error(`Unknown action: ${validatedArgs.action}`);
      }

      this.logger.info('Resource alerts operation completed', {
        action: validatedArgs.action,
        alert_id: validatedArgs.alert_id
      });

      return {
        title: `Resource Alerts - ${validatedArgs.action.toUpperCase()}`,
        metadata: {
          operation: 'mosaic_resource_alerts',
          status: 'success',
          data: result,
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: this.formatResourceAlertsOutput(validatedArgs.action, result)
      };

    } catch (error) {
      this.logger.error('Resource alerts operation failed', error);
      return {
        title: 'Resource Alerts Error',
        metadata: {
          operation: 'mosaic_resource_alerts',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `Resource alerts operation failed: ${(error as Error).message}`
      };
    }
  }

  // Helper methods for formatting output

  private getSystemStatus(metrics: any): 'healthy' | 'warning' | 'critical' {
    if (metrics.cpu_usage_percent > 85 || metrics.memory_usage_percent > 90) {
      return 'critical';
    }
    if (metrics.cpu_usage_percent > 70 || metrics.memory_usage_percent > 80) {
      return 'warning';
    }
    return 'healthy';
  }

  private formatResourceMonitorOutput(response: any, args: any): string {
    let output = `# Resource Monitor Report
Generated: ${new Date().toISOString()}

## Current System Metrics
- CPU Usage: ${response.current_metrics.cpu_usage_percent.toFixed(1)}%
- Memory Usage: ${response.current_metrics.memory_usage_mb}MB (${response.current_metrics.memory_usage_percent}%)
- System Status: ${response.summary.system_status.toUpperCase()}
- Uptime: ${Math.floor(response.current_metrics.uptime_seconds / 3600)}h ${Math.floor((response.current_metrics.uptime_seconds % 3600) / 60)}m

## Summary
- Active Alerts: ${response.summary.alert_count} (${response.summary.critical_alerts} critical)
- Active Agents: ${response.summary.active_agents}
- Total Agent Memory: ${response.summary.total_estimated_memory}MB`;

    if (response.active_alerts && response.active_alerts.length > 0) {
      output += `\n\n## Active Alerts`;
      response.active_alerts.forEach((alert: any) => {
        output += `\n- [${alert.severity.toUpperCase()}] ${alert.message} (${alert.timestamp})`;
      });
    }

    if (response.agent_usage && response.agent_usage.length > 0) {
      output += `\n\n## Agent Resource Usage`;
      response.agent_usage.slice(0, 10).forEach((agent: any) => {
        output += `\n- ${agent.persona} (${agent.status}): ${agent.estimated_memory_mb}MB, ${agent.estimated_cpu_percent}% CPU, ${agent.task_count} tasks`;
      });
    }

    if (response.historical_data && args.include_history) {
      const historyLength = response.historical_data.length;
      output += `\n\n## Historical Data
- Data Points: ${historyLength} (last ${args.history_minutes} minutes)`;
      if (historyLength > 0) {
        const avgCpu = response.historical_data.reduce((sum: number, m: any) => sum + m.cpu_usage_percent, 0) / historyLength;
        const avgMemory = response.historical_data.reduce((sum: number, m: any) => sum + m.memory_usage_percent, 0) / historyLength;
        output += `\n- Average CPU: ${avgCpu.toFixed(1)}%`;
        output += `\n- Average Memory: ${avgMemory.toFixed(1)}%`;
      }
    }

    return output;
  }

  private formatAgentLimitsOutput(action: string, result: any): string {
    switch (action) {
      case 'set':
        return `# Agent Resource Limits Set

Limit ID: ${result.id}
Agent ID: ${result.agent_id || 'N/A'}
Persona: ${result.persona || 'N/A'}

## Limits Applied
- Max Memory: ${result.max_memory_mb}MB
- Max CPU: ${result.max_cpu_percent}%
- Max Tasks: ${result.max_concurrent_tasks}
- Timeout: ${result.timeout_minutes || 'N/A'} minutes

Created by: ${result.created_by}
Created at: ${result.created_at}`;

      case 'get':
        if (result.length === 0) {
          return '# No Resource Limits Found\n\nNo active resource limits match the specified criteria.';
        }
        
        let output = `# Active Resource Limits (${result.length} found)\n`;
        result.forEach((limit: any) => {
          output += `\n## ${limit.id}
- Agent: ${limit.agent_id || 'Any'}
- Persona: ${limit.persona || 'Any'}
- Memory Limit: ${limit.max_memory_mb}MB
- CPU Limit: ${limit.max_cpu_percent}%
- Task Limit: ${limit.max_concurrent_tasks}
- Created: ${limit.created_at}`;
        });
        return output;

      case 'check':
        return `# Agent Limit Check

Agent ID: ${result.agent_id || 'Unknown'}
Within Limits: ${result.within_limits ? 'YES' : 'NO'}

${result.violations.length > 0 ? `## Violations Found
${result.violations.map((v: string) => `- ${v}`).join('\n')}` : `## No Violations
All resource usage is within configured limits.`}`;

      default:
        return JSON.stringify(result, null, 2);
    }
  }

  private formatPerformanceReportOutput(report: any, args: any): string {
    if (args.format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    if (args.format === 'summary') {
      return `# Performance Summary (${report.time_period.duration_hours}h)

## System Performance
- Average CPU: ${report.system_metrics.avg_cpu_usage}%
- Peak CPU: ${report.system_metrics.max_cpu_usage}%
- Average Memory: ${report.system_metrics.avg_memory_usage}%
- Peak Memory: ${report.system_metrics.max_memory_usage}%

## Agent Performance
- Total Agents: ${report.agent_performance.total_agents}
- Tasks Processed: ${report.system_metrics.total_tasks_processed}
- Average Efficiency: ${report.agent_performance.average_efficiency}

## Trends
- CPU: ${report.resource_trends.cpu_trend}
- Memory: ${report.resource_trends.memory_trend}
- Efficiency: ${report.resource_trends.efficiency_trend}`;
    }

    // Detailed format
    let output = `# Performance Analytics Report
Report ID: ${report.report_id}
Generated: ${report.generated_at}
Period: ${report.time_period.start} to ${report.time_period.end} (${report.time_period.duration_hours}h)

## System Metrics
- Average CPU Usage: ${report.system_metrics.avg_cpu_usage}%
- Peak CPU Usage: ${report.system_metrics.max_cpu_usage}%
- Average Memory Usage: ${report.system_metrics.avg_memory_usage}%
- Peak Memory Usage: ${report.system_metrics.max_memory_usage}%
- Peak Agent Count: ${report.system_metrics.peak_agent_count}
- Total Tasks Processed: ${report.system_metrics.total_tasks_processed}

## Agent Performance
- Total Agents: ${report.agent_performance.total_agents}
- Average Efficiency: ${report.agent_performance.average_efficiency}
- Resource Violations: ${report.agent_performance.resource_violations}`;

    if (report.agent_performance.most_efficient.length > 0) {
      output += `\n\n### Most Efficient Agents`;
      report.agent_performance.most_efficient.forEach((agent: any) => {
        output += `\n- ${agent.persona}: ${agent.resource_efficiency.toFixed(3)} tasks/MB`;
      });
    }

    if (report.agent_performance.least_efficient.length > 0) {
      output += `\n\n### Least Efficient Agents`;
      report.agent_performance.least_efficient.forEach((agent: any) => {
        output += `\n- ${agent.persona}: ${agent.resource_efficiency.toFixed(3)} tasks/MB`;
      });
    }

    if (args.include_trends) {
      output += `\n\n## Resource Trends
- CPU Trend: ${report.resource_trends.cpu_trend}
- Memory Trend: ${report.resource_trends.memory_trend}
- Efficiency Trend: ${report.resource_trends.efficiency_trend}`;
    }

    if (args.include_recommendations && report.recommendations.length > 0) {
      output += `\n\n## Recommendations`;
      report.recommendations.forEach((rec: any) => {
        output += `\n\n### ${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()}
${rec.description}

Action Items:`;
        rec.action_items.forEach((item: string) => {
          output += `\n- ${item}`;
        });
      });
    }

    return output;
  }

  private formatResourceAlertsOutput(action: string, result: any): string {
    switch (action) {
      case 'list':
        if (result.length === 0) {
          return '# No Active Alerts\n\nNo active resource alerts found.';
        }
        
        let output = `# Active Resource Alerts (${result.length})\n`;
        result.forEach((alert: any) => {
          output += `\n## ${alert.severity.toUpperCase()}: ${alert.alert_type.toUpperCase()}
Message: ${alert.message}
Entity: ${alert.entity_type} (${alert.entity_id || 'system'})
Current: ${alert.current_value} | Threshold: ${alert.threshold_value}
Time: ${alert.timestamp}
Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}
ID: ${alert.id}`;
        });
        return output;

      case 'acknowledge':
        return `# Alert Acknowledged
Alert ID: ${result.alert_id}
Status: Successfully acknowledged`;

      case 'resolve':
        return `# Alert Resolved
Alert ID: ${result.alert_id}
Status: Successfully resolved`;

      default:
        return JSON.stringify(result, null, 2);
    }
  }
}