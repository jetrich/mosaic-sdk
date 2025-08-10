import { randomUUID } from 'crypto';
import * as os from 'os';
import { MCPServerConfig, ValidationError } from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { AgentService } from './AgentService';

export interface ResourceMetrics {
  timestamp: Date;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  memory_total_mb: number;
  memory_usage_percent: number;
  disk_usage_mb?: number;
  disk_total_mb?: number;
  disk_usage_percent?: number;
  load_average: number[];
  uptime_seconds: number;
  process_count: number;
}

export interface AgentResourceUsage {
  agent_id: string;
  persona: string;
  status: string;
  estimated_memory_mb: number;
  estimated_cpu_percent: number;
  task_count: number;
  last_activity: Date;
  resource_efficiency: number; // tasks per MB ratio
}

export interface ResourceLimits {
  id: string;
  agent_id?: string;
  persona?: string;
  max_memory_mb: number;
  max_cpu_percent: number;
  max_concurrent_tasks: number;
  timeout_minutes?: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  active: boolean;
}

export interface ResourceAlert {
  id: string;
  alert_type: 'memory' | 'cpu' | 'disk' | 'agent_limit' | 'system_threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_id?: string; // agent_id or system
  entity_type: 'system' | 'agent';
  current_value: number;
  threshold_value: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolved_at?: Date;
}

export interface PerformanceReport {
  report_id: string;
  generated_at: Date;
  time_period: {
    start: Date;
    end: Date;
    duration_hours: number;
  };
  system_metrics: {
    avg_cpu_usage: number;
    max_cpu_usage: number;
    avg_memory_usage: number;
    max_memory_usage: number;
    avg_load: number;
    peak_agent_count: number;
    total_tasks_processed: number;
  };
  agent_performance: {
    total_agents: number;
    most_efficient: AgentResourceUsage[];
    least_efficient: AgentResourceUsage[];
    resource_violations: number;
    average_efficiency: number;
  };
  recommendations: {
    category: 'optimization' | 'scaling' | 'configuration' | 'cleanup';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    action_items: string[];
  }[];
  resource_trends: {
    cpu_trend: 'increasing' | 'stable' | 'decreasing';
    memory_trend: 'increasing' | 'stable' | 'decreasing';
    efficiency_trend: 'improving' | 'stable' | 'declining';
  };
}

export class ResourceService {
  private logger: Logger;
  private stateService: StateService;
  private agentService: AgentService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private resourceHistory: ResourceMetrics[] = [];
  private maxHistorySize = 1000; // Keep last 1000 readings
  private alertThresholds = {
    cpu_warning: 70,
    cpu_critical: 85,
    memory_warning: 80,
    memory_critical: 90,
    disk_warning: 80,
    disk_critical: 95
  };

  constructor(config: MCPServerConfig, logger: Logger, agentService: AgentService) {
    this.logger = logger;
    this.stateService = new StateService(config, logger);
    this.agentService = agentService;
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
    await this.createResourceTables();
    this.startResourceMonitoring();
    this.logger.info('ResourceService initialized with monitoring enabled');
  }

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.info('ResourceService shutdown completed');
  }

  private async createResourceTables(): Promise<void> {
    // Resource limits table
    await this.stateService.run(`
      CREATE TABLE IF NOT EXISTS resource_limits (
        id TEXT PRIMARY KEY,
        agent_id TEXT,
        persona TEXT,
        max_memory_mb INTEGER NOT NULL,
        max_cpu_percent INTEGER NOT NULL,
        max_concurrent_tasks INTEGER NOT NULL,
        timeout_minutes INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        active BOOLEAN DEFAULT 1,
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `);

    // Resource alerts table
    await this.stateService.run(`
      CREATE TABLE IF NOT EXISTS resource_alerts (
        id TEXT PRIMARY KEY,
        alert_type TEXT NOT NULL CHECK (alert_type IN ('memory', 'cpu', 'disk', 'agent_limit', 'system_threshold')),
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        entity_id TEXT,
        entity_type TEXT NOT NULL CHECK (entity_type IN ('system', 'agent')),
        current_value REAL NOT NULL,
        threshold_value REAL NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT 0,
        resolved BOOLEAN DEFAULT 0,
        resolved_at TEXT
      )
    `);

    // Performance reports table
    await this.stateService.run(`
      CREATE TABLE IF NOT EXISTS performance_reports (
        id TEXT PRIMARY KEY,
        report_data TEXT NOT NULL, -- JSON blob
        generated_at TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL
      )
    `);

    this.logger.info('Resource management tables created');
  }

  // Core monitoring functionality
  private startResourceMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        await this.storeMetrics(metrics);
        await this.checkResourceThresholds(metrics);
        this.maintainHistory(metrics);
      } catch (error) {
        this.logger.error('Resource monitoring failed', error);
      }
    }, 30000);
  }

  async collectSystemMetrics(): Promise<ResourceMetrics> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU usage estimation (simplified)
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min((loadAvg[0]! / cpuCount) * 100, 100);

    const metrics: ResourceMetrics = {
      timestamp: new Date(),
      cpu_usage_percent: cpuUsage,
      memory_usage_mb: Math.round(usedMem / 1024 / 1024),
      memory_total_mb: Math.round(totalMem / 1024 / 1024),
      memory_usage_percent: Math.round((usedMem / totalMem) * 100),
      load_average: loadAvg,
      uptime_seconds: os.uptime(),
      process_count: 1 // Simplified for this implementation
    };

    return metrics;
  }

  private async storeMetrics(metrics: ResourceMetrics): Promise<void> {
    const metricEntries = [
      {
        id: randomUUID(),
        metric_type: 'system',
        entity_id: 'system',
        metric_name: 'cpu_usage_percent',
        metric_value: metrics.cpu_usage_percent,
        timestamp: metrics.timestamp.toISOString(),
        metadata: JSON.stringify({ load_average: metrics.load_average })
      },
      {
        id: randomUUID(),
        metric_type: 'system',
        entity_id: 'system',
        metric_name: 'memory_usage_percent',
        metric_value: metrics.memory_usage_percent,
        timestamp: metrics.timestamp.toISOString(),
        metadata: JSON.stringify({ 
          usage_mb: metrics.memory_usage_mb,
          total_mb: metrics.memory_total_mb 
        })
      }
    ];

    for (const entry of metricEntries) {
      await this.stateService.run(
        'INSERT INTO metrics (id, metric_type, entity_id, metric_name, metric_value, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entry.id, entry.metric_type, entry.entity_id, entry.metric_name, entry.metric_value, entry.metadata, entry.timestamp]
      );
    }
  }

  private maintainHistory(metrics: ResourceMetrics): void {
    this.resourceHistory.push(metrics);
    if (this.resourceHistory.length > this.maxHistorySize) {
      this.resourceHistory.shift();
    }
  }

  private async checkResourceThresholds(metrics: ResourceMetrics): Promise<void> {
    const alerts: Partial<ResourceAlert>[] = [];

    // CPU threshold checks
    if (metrics.cpu_usage_percent >= this.alertThresholds.cpu_critical) {
      alerts.push({
        alert_type: 'cpu',
        severity: 'critical',
        entity_type: 'system',
        current_value: metrics.cpu_usage_percent,
        threshold_value: this.alertThresholds.cpu_critical,
        message: `Critical CPU usage: ${metrics.cpu_usage_percent.toFixed(1)}%`
      });
    } else if (metrics.cpu_usage_percent >= this.alertThresholds.cpu_warning) {
      alerts.push({
        alert_type: 'cpu',
        severity: 'medium',
        entity_type: 'system',
        current_value: metrics.cpu_usage_percent,
        threshold_value: this.alertThresholds.cpu_warning,
        message: `High CPU usage: ${metrics.cpu_usage_percent.toFixed(1)}%`
      });
    }

    // Memory threshold checks
    if (metrics.memory_usage_percent >= this.alertThresholds.memory_critical) {
      alerts.push({
        alert_type: 'memory',
        severity: 'critical',
        entity_type: 'system',
        current_value: metrics.memory_usage_percent,
        threshold_value: this.alertThresholds.memory_critical,
        message: `Critical memory usage: ${metrics.memory_usage_percent}% (${metrics.memory_usage_mb}MB)`
      });
    } else if (metrics.memory_usage_percent >= this.alertThresholds.memory_warning) {
      alerts.push({
        alert_type: 'memory',
        severity: 'medium',
        entity_type: 'system',
        current_value: metrics.memory_usage_percent,
        threshold_value: this.alertThresholds.memory_warning,
        message: `High memory usage: ${metrics.memory_usage_percent}% (${metrics.memory_usage_mb}MB)`
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.createAlert(alert as ResourceAlert);
    }
  }

  private async createAlert(alert: Partial<ResourceAlert>): Promise<void> {
    const alertData = {
      id: randomUUID(),
      ...alert,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    await this.stateService.run(
      `INSERT INTO resource_alerts 
       (id, alert_type, severity, entity_id, entity_type, current_value, threshold_value, message, timestamp, acknowledged, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertData.id,
        alertData.alert_type,
        alertData.severity,
        alertData.entity_id || null,
        alertData.entity_type,
        alertData.current_value,
        alertData.threshold_value,
        alertData.message,
        alertData.timestamp.toISOString(),
        alertData.acknowledged,
        alertData.resolved
      ]
    );

    this.logger.warn('Resource alert created', alertData);
  }

  // Public API methods
  async getCurrentMetrics(): Promise<ResourceMetrics> {
    return await this.collectSystemMetrics();
  }

  async getResourceHistory(minutes: number = 60): Promise<ResourceMetrics[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.resourceHistory.filter(m => m.timestamp >= cutoffTime);
  }

  async getActiveAlerts(): Promise<ResourceAlert[]> {
    const rows = await this.stateService.all(
      'SELECT * FROM resource_alerts WHERE resolved = 0 ORDER BY timestamp DESC'
    );
    
    return rows.map(row => {
      const alert: ResourceAlert = {
        id: row.id,
        alert_type: row.alert_type,
        severity: row.severity,
        entity_id: row.entity_id,
        entity_type: row.entity_type,
        current_value: row.current_value,
        threshold_value: row.threshold_value,
        message: row.message,
        timestamp: new Date(row.timestamp),
        acknowledged: Boolean(row.acknowledged),
        resolved: Boolean(row.resolved)
      };
      if (row.resolved_at) {
        alert.resolved_at = new Date(row.resolved_at);
      }
      return alert;
    });
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.stateService.run(
      'UPDATE resource_alerts SET acknowledged = 1 WHERE id = ?',
      [alertId]
    );
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.stateService.run(
      'UPDATE resource_alerts SET resolved = 1, resolved_at = ? WHERE id = ?',
      [new Date().toISOString(), alertId]
    );
  }

  // Agent resource management
  async getAgentResourceUsage(): Promise<AgentResourceUsage[]> {
    const agents = await this.agentService.getActiveAgents();
    const usage: AgentResourceUsage[] = [];

    for (const agent of agents) {
      // Estimate resource usage based on agent activity and task count
      const taskCount = agent.context.task_queue.length;
      const baseMemoryMB = 50; // Base memory per agent
      const memoryPerTask = 25; // Additional memory per task
      const estimatedMemory = baseMemoryMB + (taskCount * memoryPerTask);
      
      // CPU estimation based on status and task load
      let estimatedCPU = 0;
      switch (agent.status) {
        case 'working':
          estimatedCPU = Math.min(10 + (taskCount * 5), 30);
          break;
        case 'waiting':
          estimatedCPU = 2;
          break;
        default:
          estimatedCPU = 1;
      }

      const efficiency = taskCount > 0 ? taskCount / estimatedMemory : 0;

      usage.push({
        agent_id: agent.id,
        persona: agent.persona,
        status: agent.status,
        estimated_memory_mb: estimatedMemory,
        estimated_cpu_percent: estimatedCPU,
        task_count: taskCount,
        last_activity: agent.last_activity,
        resource_efficiency: efficiency
      });
    }

    return usage.sort((a, b) => b.resource_efficiency - a.resource_efficiency);
  }

  async setAgentResourceLimits(limits: Omit<ResourceLimits, 'id' | 'created_at' | 'updated_at'>): Promise<ResourceLimits> {
    const limitData: ResourceLimits = {
      id: randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
      ...limits
    };

    await this.stateService.run(
      `INSERT INTO resource_limits 
       (id, agent_id, persona, max_memory_mb, max_cpu_percent, max_concurrent_tasks, timeout_minutes, created_at, updated_at, created_by, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        limitData.id,
        limitData.agent_id || null,
        limitData.persona || null,
        limitData.max_memory_mb,
        limitData.max_cpu_percent,
        limitData.max_concurrent_tasks,
        limitData.timeout_minutes || null,
        limitData.created_at.toISOString(),
        limitData.updated_at.toISOString(),
        limitData.created_by,
        limitData.active
      ]
    );

    return limitData;
  }

  async getResourceLimits(agentId?: string, persona?: string): Promise<ResourceLimits[]> {
    let sql = 'SELECT * FROM resource_limits WHERE active = 1';
    const params: any[] = [];

    if (agentId) {
      sql += ' AND agent_id = ?';
      params.push(agentId);
    }

    if (persona) {
      sql += ' AND persona = ?';
      params.push(persona);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await this.stateService.all(sql, params);
    
    return rows.map(row => ({
      id: row.id,
      agent_id: row.agent_id,
      persona: row.persona,
      max_memory_mb: row.max_memory_mb,
      max_cpu_percent: row.max_cpu_percent,
      max_concurrent_tasks: row.max_concurrent_tasks,
      timeout_minutes: row.timeout_minutes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      active: Boolean(row.active)
    }));
  }

  async checkAgentLimits(agentId: string): Promise<{ violations: string[], within_limits: boolean }> {
    const agent = await this.agentService.getAgent(agentId);
    if (!agent) {
      throw new ValidationError(`Agent ${agentId} not found`);
    }

    const limits = await this.getResourceLimits(agentId, agent.persona);
    if (limits.length === 0) {
      return { violations: [], within_limits: true };
    }

    const currentUsage = (await this.getAgentResourceUsage()).find(u => u.agent_id === agentId);
    if (!currentUsage) {
      return { violations: [], within_limits: true };
    }

    const violations: string[] = [];
    const limit = limits[0]!; // Use the most recent limit

    if (currentUsage.estimated_memory_mb > limit.max_memory_mb) {
      violations.push(`Memory usage ${currentUsage.estimated_memory_mb}MB exceeds limit ${limit.max_memory_mb}MB`);
    }

    if (currentUsage.estimated_cpu_percent > limit.max_cpu_percent) {
      violations.push(`CPU usage ${currentUsage.estimated_cpu_percent}% exceeds limit ${limit.max_cpu_percent}%`);
    }

    if (currentUsage.task_count > limit.max_concurrent_tasks) {
      violations.push(`Task count ${currentUsage.task_count} exceeds limit ${limit.max_concurrent_tasks}`);
    }

    return {
      violations,
      within_limits: violations.length === 0
    };
  }

  async generatePerformanceReport(hours: number = 24): Promise<PerformanceReport> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    // Get metrics from database
    const metrics = await this.stateService.all(
      'SELECT * FROM metrics WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp',
      [startTime.toISOString(), endTime.toISOString()]
    );

    // Calculate system metrics
    const cpuMetrics = metrics.filter(m => m.metric_name === 'cpu_usage_percent');
    const memoryMetrics = metrics.filter(m => m.metric_name === 'memory_usage_percent');

    const avgCpu = cpuMetrics.length > 0 ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) / cpuMetrics.length : 0;
    const maxCpu = cpuMetrics.length > 0 ? Math.max(...cpuMetrics.map(m => m.metric_value)) : 0;
    const avgMemory = memoryMetrics.length > 0 ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) / memoryMetrics.length : 0;
    const maxMemory = memoryMetrics.length > 0 ? Math.max(...memoryMetrics.map(m => m.metric_value)) : 0;

    // Get agent performance data
    const agentUsage = await this.getAgentResourceUsage();
    const mostEfficient = agentUsage.slice(0, 5);
    const leastEfficient = agentUsage.slice(-5);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(avgCpu, avgMemory, agentUsage);

    // Determine trends (simplified)
    const cpuTrend = maxCpu > 80 ? 'increasing' : avgCpu < 50 ? 'decreasing' : 'stable';
    const memoryTrend = maxMemory > 80 ? 'increasing' : avgMemory < 60 ? 'decreasing' : 'stable';
    const avgEfficiency = agentUsage.length > 0 ? agentUsage.reduce((sum, a) => sum + a.resource_efficiency, 0) / agentUsage.length : 0;
    const efficiencyTrend = avgEfficiency > 0.5 ? 'improving' : avgEfficiency < 0.2 ? 'declining' : 'stable';

    const report: PerformanceReport = {
      report_id: randomUUID(),
      generated_at: new Date(),
      time_period: {
        start: startTime,
        end: endTime,
        duration_hours: hours
      },
      system_metrics: {
        avg_cpu_usage: Math.round(avgCpu * 100) / 100,
        max_cpu_usage: Math.round(maxCpu * 100) / 100,
        avg_memory_usage: Math.round(avgMemory * 100) / 100,
        max_memory_usage: Math.round(maxMemory * 100) / 100,
        avg_load: 0, // Simplified
        peak_agent_count: agentUsage.length,
        total_tasks_processed: agentUsage.reduce((sum, a) => sum + a.task_count, 0)
      },
      agent_performance: {
        total_agents: agentUsage.length,
        most_efficient: mostEfficient,
        least_efficient: leastEfficient,
        resource_violations: 0, // TODO: Calculate actual violations
        average_efficiency: Math.round(avgEfficiency * 1000) / 1000
      },
      recommendations,
      resource_trends: {
        cpu_trend: cpuTrend as any,
        memory_trend: memoryTrend as any,
        efficiency_trend: efficiencyTrend as any
      }
    };

    // Store the report
    await this.stateService.run(
      'INSERT INTO performance_reports (id, report_data, generated_at, period_start, period_end) VALUES (?, ?, ?, ?, ?)',
      [
        report.report_id,
        JSON.stringify(report),
        report.generated_at.toISOString(),
        startTime.toISOString(),
        endTime.toISOString()
      ]
    );

    return report;
  }

  private async generateRecommendations(avgCpu: number, avgMemory: number, agentUsage: AgentResourceUsage[]): Promise<PerformanceReport['recommendations']> {
    const recommendations: PerformanceReport['recommendations'] = [];

    // High resource usage recommendations
    if (avgCpu > 70) {
      recommendations.push({
        category: 'optimization',
        priority: 'high',
        description: 'High average CPU usage detected',
        action_items: [
          'Consider reducing concurrent agent count',
          'Optimize task scheduling',
          'Review agent efficiency metrics'
        ]
      });
    }

    if (avgMemory > 80) {
      recommendations.push({
        category: 'scaling',
        priority: 'critical',
        description: 'High memory usage may impact performance',
        action_items: [
          'Implement agent memory limits',
          'Consider system scaling',
          'Review memory leaks in agent tasks'
        ]
      });
    }

    // Agent efficiency recommendations
    const inefficientAgents = agentUsage.filter(a => a.resource_efficiency < 0.1);
    if (inefficientAgents.length > 0) {
      recommendations.push({
        category: 'optimization',
        priority: 'medium',
        description: `${inefficientAgents.length} agents showing low efficiency`,
        action_items: [
          'Review task allocation strategies',
          'Consider agent termination for idle agents',
          'Implement auto-scaling policies'
        ]
      });
    }

    // Cleanup recommendations
    const idleAgents = agentUsage.filter(a => a.status === 'idle' && a.task_count === 0);
    if (idleAgents.length > 3) {
      recommendations.push({
        category: 'cleanup',
        priority: 'low',
        description: `${idleAgents.length} idle agents without tasks`,
        action_items: [
          'Terminate unused idle agents',
          'Implement automatic cleanup policies',
          'Review agent deployment strategies'
        ]
      });
    }

    return recommendations;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const metrics = await this.getCurrentMetrics();
      const alerts = await this.getActiveAlerts();
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');

      return {
        status: criticalAlerts.length > 0 ? 'unhealthy' : 'healthy',
        details: {
          current_cpu: metrics.cpu_usage_percent,
          current_memory: metrics.memory_usage_percent,
          active_alerts: alerts.length,
          critical_alerts: criticalAlerts.length,
          monitoring_active: this.monitoringInterval !== null
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  isReady(): boolean {
    return this.stateService.isInitialized() && this.monitoringInterval !== null;
  }
}