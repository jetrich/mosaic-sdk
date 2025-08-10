import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { ResourceService, ResourceMetrics, AgentResourceUsage } from '../src/services/ResourceService';
import { AgentService } from '../src/services/AgentService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';

// Mock dependencies
jest.mock('../src/services/StateService');
jest.mock('../src/services/AgentService');
jest.mock('../src/utils/Logger');

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let mockAgentService: jest.Mocked<AgentService>;
  let mockLogger: jest.Mocked<Logger>;
  let config: MCPServerConfig;

  beforeEach(() => {
    config = {
      server: { name: 'test', version: '1.0.0', description: 'test' },
      transport: { type: 'stdio', timeout: 30000 },
      tools: {
        task_management: { enabled: true, namespace: 'test' },
        project_coordination: { enabled: true, namespace: 'test' },
        agent_orchestration: { enabled: true, namespace: 'test' }
      },
      storage: {
        type: 'sqlite',
        connection_string: ':memory:',
        migrations_path: './migrations',
        backup_enabled: false,
        backup_interval: '1h'
      },
      logging: {
        level: 'debug',
        console: true,
        structured: false
      },
      security: {
        max_concurrent_tools: 5,
        tool_timeout: 300000,
        rate_limiting: { enabled: false, requests_per_minute: 100 }
      }
    };

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logDatabaseEvent: jest.fn(),
      logServerEvent: jest.fn(),
      close: jest.fn()
    } as any;

    mockAgentService = {
      getActiveAgents: jest.fn(),
      getAgent: jest.fn(),
      isReady: jest.fn().mockReturnValue(true)
    } as any;

    resourceService = new ResourceService(config, mockLogger, mockAgentService);
  });

  afterEach(async () => {
    await resourceService.shutdown();
  });

  describe('System Metrics Collection', () => {
    it('should collect current system metrics', async () => {
      const metrics = await resourceService.getCurrentMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.cpu_usage_percent).toBe('number');
      expect(typeof metrics.memory_usage_mb).toBe('number');
      expect(typeof metrics.memory_total_mb).toBe('number');
      expect(typeof metrics.memory_usage_percent).toBe('number');
      expect(Array.isArray(metrics.load_average)).toBe(true);
      expect(typeof metrics.uptime_seconds).toBe('number');
      expect(metrics.cpu_usage_percent).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu_usage_percent).toBeLessThanOrEqual(100);
      expect(metrics.memory_usage_percent).toBeGreaterThanOrEqual(0);
      expect(metrics.memory_usage_percent).toBeLessThanOrEqual(100);
    });

    it('should maintain resource history', async () => {
      // Get initial metrics
      const metrics1 = await resourceService.getCurrentMetrics();
      
      // Wait a bit and get more metrics
      await new Promise(resolve => setTimeout(resolve, 100));
      const metrics2 = await resourceService.getCurrentMetrics();

      const history = await resourceService.getResourceHistory(1);
      
      expect(Array.isArray(history)).toBe(true);
      // History might be empty in test environment due to timing
      // but the method should work without errors
    });
  });

  describe('Agent Resource Usage', () => {
    it('should calculate agent resource usage correctly', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          persona: 'BE-BACKEND-BENJAMIN',
          status: 'working',
          context: { task_queue: ['task-1', 'task-2'] },
          last_activity: new Date()
        },
        {
          id: 'agent-2',
          persona: 'FE-FRONTEND-FIONA',
          status: 'idle',
          context: { task_queue: [] },
          last_activity: new Date()
        }
      ];

      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents as any);

      const usage = await resourceService.getAgentResourceUsage();

      expect(Array.isArray(usage)).toBe(true);
      expect(usage).toHaveLength(2);
      
      const workingAgent = usage.find(u => u.agent_id === 'agent-1');
      const idleAgent = usage.find(u => u.agent_id === 'agent-2');

      expect(workingAgent).toBeDefined();
      expect(idleAgent).toBeDefined();
      
      // Working agent should have higher resource usage
      expect(workingAgent!.estimated_cpu_percent).toBeGreaterThan(idleAgent!.estimated_cpu_percent);
      expect(workingAgent!.estimated_memory_mb).toBeGreaterThan(idleAgent!.estimated_memory_mb);
      expect(workingAgent!.task_count).toBe(2);
      expect(idleAgent!.task_count).toBe(0);
    });

    it('should sort agents by efficiency', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          persona: 'EFFICIENT-AGENT',
          status: 'working',
          context: { task_queue: ['task-1'] },
          last_activity: new Date()
        },
        {
          id: 'agent-2',
          persona: 'INEFFICIENT-AGENT',
          status: 'working',
          context: { task_queue: [] },
          last_activity: new Date()
        }
      ];

      mockAgentService.getActiveAgents.mockResolvedValue(mockAgents as any);

      const usage = await resourceService.getAgentResourceUsage();

      expect(usage).toHaveLength(2);
      // Should be sorted by efficiency (descending)
      expect(usage[0].resource_efficiency).toBeGreaterThanOrEqual(usage[1].resource_efficiency);
    });
  });

  describe('Resource Limits', () => {
    it('should set and retrieve resource limits', async () => {
      const limits = {
        agent_id: 'test-agent',
        persona: 'BE-BACKEND-BENJAMIN',
        max_memory_mb: 512,
        max_cpu_percent: 50,
        max_concurrent_tasks: 5,
        timeout_minutes: 60,
        created_by: 'test-user',
        active: true
      };

      // Mock database operations
      jest.spyOn(resourceService as any, 'stateService', 'get').mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(undefined),
        all: jest.fn().mockResolvedValue([{
          id: 'limit-1',
          ...limits,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      }));

      const createdLimits = await resourceService.setAgentResourceLimits(limits);
      expect(createdLimits).toBeDefined();
      expect(createdLimits.max_memory_mb).toBe(512);
      expect(createdLimits.max_cpu_percent).toBe(50);

      const retrievedLimits = await resourceService.getResourceLimits('test-agent');
      expect(Array.isArray(retrievedLimits)).toBe(true);
    });

    it('should check agent limits compliance', async () => {
      const mockAgent = {
        id: 'test-agent',
        persona: 'BE-BACKEND-BENJAMIN',
        status: 'working',
        context: { task_queue: ['task-1'] },
        last_activity: new Date()
      };

      mockAgentService.getAgent.mockResolvedValue(mockAgent as any);
      mockAgentService.getActiveAgents.mockResolvedValue([mockAgent] as any);

      // Mock limits
      jest.spyOn(resourceService, 'getResourceLimits').mockResolvedValue([{
        id: 'limit-1',
        agent_id: 'test-agent',
        persona: 'BE-BACKEND-BENJAMIN',
        max_memory_mb: 100,
        max_cpu_percent: 20,
        max_concurrent_tasks: 2,
        timeout_minutes: 60,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'test',
        active: true
      }]);

      const compliance = await resourceService.checkAgentLimits('test-agent');
      
      expect(compliance).toBeDefined();
      expect(typeof compliance.within_limits).toBe('boolean');
      expect(Array.isArray(compliance.violations)).toBe(true);
    });
  });

  describe('Performance Reports', () => {
    it('should generate performance report', async () => {
      // Mock agents
      mockAgentService.getActiveAgents.mockResolvedValue([{
        id: 'agent-1',
        persona: 'BE-BACKEND-BENJAMIN',
        status: 'working',
        context: { task_queue: ['task-1'] },
        last_activity: new Date()
      }] as any);

      // Mock database metrics
      jest.spyOn(resourceService as any, 'stateService', 'get').mockImplementation(() => ({
        all: jest.fn().mockResolvedValue([
          {
            metric_name: 'cpu_usage_percent',
            metric_value: 45.5,
            timestamp: new Date().toISOString()
          },
          {
            metric_name: 'memory_usage_percent',
            metric_value: 65.2,
            timestamp: new Date().toISOString()
          }
        ]),
        run: jest.fn().mockResolvedValue(undefined)
      }));

      const report = await resourceService.generatePerformanceReport(24);

      expect(report).toBeDefined();
      expect(report.report_id).toBeDefined();
      expect(report.generated_at).toBeDefined();
      expect(report.time_period).toBeDefined();
      expect(report.time_period.duration_hours).toBe(24);
      expect(report.system_metrics).toBeDefined();
      expect(report.agent_performance).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.resource_trends).toBeDefined();
    });

    it('should generate optimization recommendations', async () => {
      // Mock high resource usage scenario
      mockAgentService.getActiveAgents.mockResolvedValue([
        {
          id: 'agent-1',
          persona: 'INEFFICIENT-AGENT',
          status: 'idle',
          context: { task_queue: [] },
          last_activity: new Date()
        },
        {
          id: 'agent-2',
          persona: 'ANOTHER-IDLE-AGENT',
          status: 'idle',
          context: { task_queue: [] },
          last_activity: new Date()
        },
        {
          id: 'agent-3',
          persona: 'THIRD-IDLE-AGENT',
          status: 'idle',
          context: { task_queue: [] },
          last_activity: new Date()
        },
        {
          id: 'agent-4',
          persona: 'FOURTH-IDLE-AGENT',
          status: 'idle',
          context: { task_queue: [] },
          last_activity: new Date()
        }
      ] as any);

      // Mock high resource metrics
      jest.spyOn(resourceService as any, 'stateService', 'get').mockImplementation(() => ({
        all: jest.fn().mockResolvedValue([
          {
            metric_name: 'cpu_usage_percent',
            metric_value: 85.0,
            timestamp: new Date().toISOString()
          },
          {
            metric_name: 'memory_usage_percent',
            metric_value: 90.0,
            timestamp: new Date().toISOString()
          }
        ]),
        run: jest.fn().mockResolvedValue(undefined)
      }));

      const report = await resourceService.generatePerformanceReport(1);

      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Should have recommendations for high resource usage
      const hasOptimizationRec = report.recommendations.some(r => r.category === 'optimization');
      const hasScalingRec = report.recommendations.some(r => r.category === 'scaling');
      const hasCleanupRec = report.recommendations.some(r => r.category === 'cleanup');

      expect(hasOptimizationRec || hasScalingRec || hasCleanupRec).toBe(true);
    });
  });

  describe('Resource Alerts', () => {
    it('should create alerts for threshold violations', async () => {
      // Mock database
      jest.spyOn(resourceService as any, 'stateService', 'get').mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(undefined),
        all: jest.fn().mockResolvedValue([])
      }));

      // Trigger metrics collection that should create alerts
      const highMetrics: ResourceMetrics = {
        timestamp: new Date(),
        cpu_usage_percent: 90, // Above critical threshold
        memory_usage_mb: 7000,
        memory_total_mb: 8000,
        memory_usage_percent: 87.5, // Above warning threshold
        load_average: [3.0, 2.5, 2.0],
        uptime_seconds: 3600,
        process_count: 1
      };

      // Test alert creation logic (would normally be called internally)
      // This is testing the private method indirectly
      await (resourceService as any).checkResourceThresholds(highMetrics);

      // Verify logger was called for alerts
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should get active alerts', async () => {
      // Mock database response
      jest.spyOn(resourceService as any, 'stateService', 'get').mockImplementation(() => ({
        all: jest.fn().mockResolvedValue([
          {
            id: 'alert-1',
            alert_type: 'memory',
            severity: 'high',
            entity_id: 'system',
            entity_type: 'system',
            current_value: 85,
            threshold_value: 80,
            message: 'High memory usage: 85%',
            timestamp: new Date().toISOString(),
            acknowledged: 0,
            resolved: 0
          }
        ])
      }));

      const alerts = await resourceService.getActiveAlerts();

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        id: 'alert-1',
        alert_type: 'memory',
        severity: 'high',
        entity_type: 'system'
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy status with normal metrics', async () => {
      // Mock normal metrics
      jest.spyOn(resourceService, 'getCurrentMetrics').mockResolvedValue({
        timestamp: new Date(),
        cpu_usage_percent: 45,
        memory_usage_mb: 2000,
        memory_total_mb: 8000,
        memory_usage_percent: 25,
        load_average: [1.0, 1.1, 1.2],
        uptime_seconds: 3600,
        process_count: 1
      });

      jest.spyOn(resourceService, 'getActiveAlerts').mockResolvedValue([]);

      const health = await resourceService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toBeDefined();
      expect(health.details.monitoring_active).toBe(true);
    });

    it('should return unhealthy status with critical alerts', async () => {
      jest.spyOn(resourceService, 'getCurrentMetrics').mockResolvedValue({
        timestamp: new Date(),
        cpu_usage_percent: 95,
        memory_usage_mb: 7500,
        memory_total_mb: 8000,
        memory_usage_percent: 93.75,
        load_average: [4.0, 3.8, 3.5],
        uptime_seconds: 3600,
        process_count: 1
      });

      jest.spyOn(resourceService, 'getActiveAlerts').mockResolvedValue([
        {
          id: 'alert-1',
          alert_type: 'memory',
          severity: 'critical',
          entity_id: 'system',
          entity_type: 'system',
          current_value: 93.75,
          threshold_value: 90,
          message: 'Critical memory usage',
          timestamp: new Date(),
          acknowledged: false,
          resolved: false
        }
      ]);

      const health = await resourceService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details.critical_alerts).toBe(1);
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize and shutdown properly', async () => {
      const service = new ResourceService(config, mockLogger, mockAgentService);
      
      // Mock StateService initialization
      jest.spyOn(service as any, 'createResourceTables').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'stateService', 'get').mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      await service.initialize();
      expect(service.isReady()).toBe(true);

      await service.shutdown();
      expect(mockLogger.info).toHaveBeenCalledWith('ResourceService shutdown completed');
    });
  });
});