import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ProjectService } from '../src/services/ProjectService';
import { StateService } from '../src/services/StateService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';

// Mock the dependencies
jest.mock('../src/services/StateService');
jest.mock('../src/utils/Logger');

describe('ProjectService - getProjectStatus', () => {
  let projectService: ProjectService;
  let mockStateService: jest.Mocked<StateService>;
  let mockLogger: jest.Mocked<Logger>;
  let config: MCPServerConfig;

  beforeEach(() => {
    // Create mock config
    config = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      transport: {
        type: 'stdio',
        timeout: 30000
      },
      tools: {
        task_management: { enabled: true, namespace: 'task', timeout: 30000 },
        project_coordination: { enabled: true, namespace: 'project', timeout: 30000 },
        agent_orchestration: { enabled: true, namespace: 'agent', timeout: 30000 }
      },
      storage: {
        type: 'sqlite',
        connection_string: ':memory:',
        migrations_path: './migrations',
        backup_enabled: false,
        backup_interval: '1h'
      },
      logging: {
        level: 'info',
        console: false,
        structured: true
      },
      security: {
        rate_limiting: {
          enabled: false,
          requests_per_minute: 100
        },
        api_key_auth: {
          enabled: false,
          keys: []
        },
        allowed_origins: ['*']
      },
      tasks: {
        max_concurrent: 10,
        default_timeout: 300000,
        retry_attempts: 3,
        retry_delay: 1000
      },
      dataDir: './test-data',
      version: '1.0.0'
    };

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create mock StateService
    mockStateService = {
      insert: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
      close: jest.fn(),
      createTable: jest.fn()
    } as unknown as jest.Mocked<StateService>;

    // Create ProjectService instance
    projectService = new ProjectService(config, mockLogger);
    
    // Replace the internal stateService with our mock
    (projectService as any).stateService = mockStateService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a comprehensive project status report', async () => {
    const projectId = 'test-project-123';
    
    // Mock project data
    const mockProject = {
      id: projectId,
      name: 'Test Project',
      status: 'active',
      owner: 'test-user',
      created_at: new Date(),
      updated_at: new Date(),
      team_members: ['user1', 'user2'],
      config: {
        default_agent_model: 'claude-3-5-sonnet',
        max_concurrent_agents: 5,
        task_auto_assignment: false,
        notification_preferences: {
          email: true,
          slack: false
        }
      },
      stats: {
        total_tasks: 15,
        completed_tasks: 8,
        active_agents: 2,
        total_agents: 3
      }
    };

    // Mock the StateService method calls
    (projectService as any).getProject = jest.fn().mockResolvedValue(mockProject);

    mockStateService.all.mockImplementation((query: string) => {
      if (query.includes('GROUP BY status')) {
        return Promise.resolve([
          { status: 'pending', count: 3 },
          { status: 'in_progress', count: 4 },
          { status: 'completed', count: 8 }
        ]);
      } else if (query.includes('GROUP BY type')) {
        return Promise.resolve([
          { type: 'task', count: 10 },
          { type: 'epic', count: 3 },
          { type: 'story', count: 2 }
        ]);
      } else if (query.includes('GROUP BY priority')) {
        return Promise.resolve([
          { priority: 'high', count: 2 },
          { priority: 'medium', count: 8 },
          { priority: 'low', count: 5 }
        ]);
      } else if (query.includes('SELECT assignee')) {
        return Promise.resolve([
          { assignee: 'user1' },
          { assignee: 'user2' },
          { assignee: null }
        ]);
      } else if (query.includes('tasks WHERE status IN')) {
        return Promise.resolve([
          { id: 'task-1', title: 'Task 1', priority: 'high', assignee: 'user1' },
          { id: 'task-2', title: 'Task 2', priority: 'medium', assignee: 'user2' }
        ]);
      }
      return Promise.resolve([]);
    });

    // Mock recent activities
    mockStateService.all.mockImplementationOnce(() => 
      Promise.resolve([
        {
          id: 'activity-1',
          type: 'task_created',
          description: 'Task "New Feature" created',
          timestamp: new Date()
        },
        {
          id: 'activity-2',
          type: 'task_completed',
          description: 'Task "Bug Fix" completed',
          timestamp: new Date()
        }
      ])
    );

    const status = await projectService.getProjectStatus(projectId);

    expect(status).toBeDefined();
    expect(status.project).toEqual(mockProject);
    expect(status.taskStats).toBeDefined();
    expect(status.taskStats.byStatus).toHaveLength(3);
    expect(status.taskStats.byType).toHaveLength(3);
    expect(status.taskStats.byPriority).toHaveLength(3);
    expect(status.taskStats.assignees).toHaveLength(3);
    expect(status.criticalTasks).toHaveLength(2);
    expect(status.recentActivity).toHaveLength(2);
  });

  it('should handle non-existent project', async () => {
    (projectService as any).getProject = jest.fn().mockResolvedValue(null);

    await expect(projectService.getProjectStatus('non-existent'))
      .rejects.toThrow('Project not found: non-existent');
  });

  it('should handle database errors gracefully', async () => {
    const projectId = 'test-project-123';
    
    (projectService as any).getProject = jest.fn().mockRejectedValue(new Error('Database error'));

    await expect(projectService.getProjectStatus(projectId))
      .rejects.toThrow('Database error');
  });

  it('should calculate correct completion percentage', async () => {
    const projectId = 'test-project-123';
    
    const mockProject = {
      id: projectId,
      name: 'Test Project',
      status: 'active'
    };

    (projectService as any).getProject = jest.fn().mockResolvedValue(mockProject);

    mockStateService.all.mockImplementation((query: string) => {
      if (query.includes('GROUP BY status')) {
        return Promise.resolve([
          { status: 'pending', count: 2 },
          { status: 'in_progress', count: 3 },
          { status: 'completed', count: 5 }
        ]);
      }
      return Promise.resolve([]);
    });

    const status = await projectService.getProjectStatus(projectId);

    expect(status.summary.totalTasks).toBe(10);
    expect(status.summary.completedTasks).toBe(5);
    expect(status.summary.completionPercentage).toBe(50);
  });
});