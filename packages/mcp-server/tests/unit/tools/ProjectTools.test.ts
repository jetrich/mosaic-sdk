import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProjectTools } from '../../../src/tools/ProjectTools';
import { ProjectService } from '../../../src/services/ProjectService';
import { Logger } from '../../../src/utils/Logger';
import { ProjectStatus, ProjectStatusReport } from '../../../src/types';
import { z } from 'zod';

describe('ProjectTools', () => {
  let projectTools: ProjectTools;
  let mockProjectService: jest.Mocked<ProjectService>;
  let mockLogger: jest.Mocked<Logger>;

  // Mock project data
  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test project description',
    status: 'active' as ProjectStatus,
    owner: 'mcp-user',
    team_members: ['BE-BACKEND-BENJAMIN', 'FE-FRONTEND-FIONA'],
    config: {
      default_agent_model: 'claude-3-sonnet',
      max_concurrent_agents: 5,
      task_auto_assignment: true,
      notification_preferences: {
        email_enabled: false,
        slack_enabled: false,
        task_updates: true,
        agent_alerts: true
      }
    },
    stats: {
      total_tasks: 10,
      completed_tasks: 5,
      active_agents: 2,
      completion_rate: 0.5,
      total_hours_spent: 40
    },
    created_at: new Date('2025-01-20T00:00:00Z'),
    updated_at: new Date('2025-01-23T00:00:00Z')
  };

  const mockProjectStatusReport: ProjectStatusReport = {
    project: mockProject,
    task_statistics: {
      total: 15,
      by_status: {
        pending: 5,
        in_progress: 3,
        completed: 7,
        blocked: 0,
        cancelled: 0
      },
      by_type: {
        epic: 1,
        feature: 3,
        story: 5,
        task: 6,
        subtask: 0,
        atomic: 0
      },
      by_priority: {
        critical: 1,
        high: 3,
        medium: 8,
        low: 3
      },
      overdue: 1,
      due_today: 2,
      due_this_week: 5
    },
    agent_activity: {
      active_agents: ['BE-BACKEND-BENJAMIN', 'FE-FRONTEND-FIONA'],
      tasks_by_agent: {
        'BE-BACKEND-BENJAMIN': 5,
        'FE-FRONTEND-FIONA': 3
      },
      recent_completions: [
        {
          task_id: 'task-001',
          task_title: 'Setup database',
          completed_by: 'BE-BACKEND-BENJAMIN',
          completed_at: new Date('2025-01-22T10:00:00Z')
        }
      ]
    },
    project_health: {
      completion_rate: 46.67,
      on_time_rate: 85.71,
      blocked_tasks: 0,
      critical_path_length: 5,
      estimated_completion: new Date('2025-02-15T00:00:00Z')
    },
    recent_activity: [
      {
        type: 'task_completed',
        description: 'Task "Setup database" completed by BE-BACKEND-BENJAMIN',
        timestamp: new Date('2025-01-22T10:00:00Z')
      }
    ]
  };

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create mock ProjectService
    mockProjectService = {
      createProject: jest.fn(),
      updateProject: jest.fn(),
      listProjects: jest.fn(),
      getProject: jest.fn(),
      getProjectStatus: jest.fn(),
      findProjectByName: jest.fn(),
      switchProject: jest.fn(),
      initialize: jest.fn(),
      setTaskService: jest.fn()
    } as unknown as jest.Mocked<ProjectService>;

    // Create ProjectTools instance
    projectTools = new ProjectTools(mockProjectService, mockLogger);
  });

  describe('getTools', () => {
    it('should return exactly 5 tools', () => {
      const tools = projectTools.getTools();
      
      expect(tools).toHaveLength(5);
      expect(tools.map(t => t.name)).toEqual(['create', 'update', 'list', 'switch', 'status']);
    });

    it('should have correct tool descriptions', () => {
      const tools = projectTools.getTools();
      
      expect(tools[0]?.description).toBe('Create a new project');
      expect(tools[1]?.description).toBe('Update an existing project');
      expect(tools[2]?.description).toBe('List available projects');
      expect(tools[3]?.description).toBe('Switch to a different project context');
      expect(tools[4]?.description).toBe('Get comprehensive project status');
    });

    it('should have valid input schemas', () => {
      const tools = projectTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
      });
    });

    it('should bind handlers correctly', () => {
      const tools = projectTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('createProject', () => {
    describe('input validation', () => {
      it('should require name field', async () => {
        const result = await (projectTools as any).createProject({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockProjectService.createProject).not.toHaveBeenCalled();
      });

      it('should accept valid name', async () => {
        mockProjectService.createProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).createProject({ name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          status: 'active',
          owner: 'mcp-user',
          team_members: []
        });
      });

      it('should reject empty name', async () => {
        const result = await (projectTools as any).createProject({ name: '' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at least 1 character');
        expect(mockProjectService.createProject).not.toHaveBeenCalled();
      });

      it('should reject name longer than 100 characters', async () => {
        const result = await (projectTools as any).createProject({ name: 'a'.repeat(101) });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at most 100 character');
        expect(mockProjectService.createProject).not.toHaveBeenCalled();
      });

      it('should accept optional description', async () => {
        mockProjectService.createProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).createProject({ 
          name: 'Test Project',
          description: 'Test Description'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test Description'
          })
        );
      });

      it('should accept valid status values', async () => {
        const statuses = ['active', 'on_hold', 'completed', 'archived'];
        
        for (const status of statuses) {
          mockProjectService.createProject.mockResolvedValue({ ...mockProject, status: status as any });

          const result = await (projectTools as any).createProject({ name: 'Test', status });

          expect(result.metadata.status).toBe('success');
          expect(mockProjectService.createProject).toHaveBeenCalledWith(
            expect.objectContaining({ status })
          );
        }
      });

      it('should reject invalid status', async () => {
        const result = await (projectTools as any).createProject({ 
          name: 'Test Project',
          status: 'invalid'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockProjectService.createProject).not.toHaveBeenCalled();
      });

      it('should accept optional owner', async () => {
        mockProjectService.createProject.mockResolvedValue({ ...mockProject, owner: 'custom-owner' });

        const result = await (projectTools as any).createProject({ 
          name: 'Test Project',
          owner: 'custom-owner'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            owner: 'custom-owner'
          })
        );
      });

      it('should accept team_members array', async () => {
        const teamMembers = ['BE-BACKEND-BENJAMIN', 'FE-FRONTEND-FIONA'];
        mockProjectService.createProject.mockResolvedValue({ ...mockProject, team_members: teamMembers });

        const result = await (projectTools as any).createProject({ 
          name: 'Test Project',
          team_members: teamMembers
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            team_members: teamMembers
          })
        );
      });

      it('should reject invalid team_members type', async () => {
        const result = await (projectTools as any).createProject({ 
          name: 'Test Project',
          team_members: 'not-an-array'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Expected array');
        expect(mockProjectService.createProject).not.toHaveBeenCalled();
      });
    });

    describe('service integration', () => {
      it('should create project with all fields', async () => {
        const fullProject = {
          ...mockProject,
          description: 'Full description',
          team_members: ['BE-BACKEND-BENJAMIN', 'FE-FRONTEND-FIONA']
        };
        mockProjectService.createProject.mockResolvedValue(fullProject);

        const result = await (projectTools as any).createProject({
          name: 'Test Project',
          description: 'Full description',
          status: 'active',
          owner: 'mcp-user',
          team_members: ['BE-BACKEND-BENJAMIN', 'FE-FRONTEND-FIONA']
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_id).toBe('project-123');
        expect(result.metadata.data.project_name).toBe('Test Project');
        expect(result.output).toContain('Project Created Successfully');
        expect(result.output).toContain('**Description**: Full description');
        expect(result.output).toContain('**Team Members**: BE-BACKEND-BENJAMIN, FE-FRONTEND-FIONA');
      });

      it('should handle duplicate project name error', async () => {
        mockProjectService.createProject.mockRejectedValue(
          new Error('Project with name \'Test Project\' already exists')
        );

        const result = await (projectTools as any).createProject({ name: 'Test Project' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project with name \'Test Project\' already exists');
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should use default values when not provided', async () => {
        mockProjectService.createProject.mockResolvedValue(mockProject);

        await (projectTools as any).createProject({ name: 'Test Project' });

        expect(mockProjectService.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          status: 'active',
          owner: 'mcp-user',
          team_members: []
        });
      });

      it('should include execution time in metadata', async () => {
        mockProjectService.createProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).createProject({ name: 'Test Project' });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });

    describe('output formatting', () => {
      it('should format basic project details', async () => {
        mockProjectService.createProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).createProject({ name: 'Test Project' });

        expect(result.output).toContain('Project Created Successfully');
        expect(result.output).toContain('**Name**: Test Project');
        expect(result.output).toContain('**ID**: project-123');
        expect(result.output).toContain('**Status**: active');
        expect(result.output).toContain('**Owner**: mcp-user');
        expect(result.output).toContain('You can now switch to this project using the switch command');
      });

      it('should omit empty optional fields', async () => {
        const projectNoDescription = { ...mockProject, description: '', team_members: [] };
        mockProjectService.createProject.mockResolvedValue(projectNoDescription);

        const result = await (projectTools as any).createProject({ name: 'Test Project' });

        expect(result.output).not.toContain('**Description**:');
        expect(result.output).not.toContain('**Team Members**:');
      });
    });
  });

  describe('updateProject', () => {
    describe('input validation', () => {
      it('should require project_id field', async () => {
        const result = await (projectTools as any).updateProject({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockProjectService.updateProject).not.toHaveBeenCalled();
      });

      it('should accept valid project_id', async () => {
        mockProjectService.updateProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'Updated Name'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.updateProject).toHaveBeenCalledWith(
          'project-123',
          { name: 'Updated Name' }
        );
      });

      it('should reject empty project_id', async () => {
        const result = await (projectTools as any).updateProject({ project_id: '' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at least 1 character');
        expect(mockProjectService.updateProject).not.toHaveBeenCalled();
      });

      it('should accept optional name update', async () => {
        mockProjectService.updateProject.mockResolvedValue({ ...mockProject, name: 'New Name' });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'New Name'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.updated_fields).toContain('name');
      });

      it('should reject invalid name length', async () => {
        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'a'.repeat(101)
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at most 100 character');
        expect(mockProjectService.updateProject).not.toHaveBeenCalled();
      });

      it('should accept optional description update', async () => {
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          description: 'Updated Description' 
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          description: 'Updated Description'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.updated_fields).toContain('description');
      });

      it('should accept valid status updates', async () => {
        const statuses = ['active', 'on_hold', 'completed', 'archived'];
        
        for (const status of statuses) {
          mockProjectService.updateProject.mockResolvedValue({ 
            ...mockProject, 
            status: status as any 
          });

          const result = await (projectTools as any).updateProject({ 
            project_id: 'project-123',
            status 
          });

          expect(result.metadata.status).toBe('success');
          expect(mockProjectService.updateProject).toHaveBeenCalledWith(
            'project-123',
            expect.objectContaining({ status })
          );
        }
      });

      it('should reject invalid status', async () => {
        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          status: 'invalid'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockProjectService.updateProject).not.toHaveBeenCalled();
      });

      it('should accept owner update', async () => {
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          owner: 'new-owner' 
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          owner: 'new-owner'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.updated_fields).toContain('owner');
      });

      it('should accept team_members update', async () => {
        const newTeam = ['QA-QUALITY-QUINN', 'TEST-AUTOMATION-TARA'];
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          team_members: newTeam 
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          team_members: newTeam
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.updated_fields).toContain('team_members');
      });
    });

    describe('service integration', () => {
      it('should update multiple fields at once', async () => {
        const updatedProject = {
          ...mockProject,
          name: 'Updated Name',
          description: 'Updated Description',
          status: 'on_hold' as any,
          owner: 'new-owner',
          team_members: ['QA-QUALITY-QUINN']
        };
        mockProjectService.updateProject.mockResolvedValue(updatedProject);

        const result = await (projectTools as any).updateProject({
          project_id: 'project-123',
          name: 'Updated Name',
          description: 'Updated Description',
          status: 'on_hold',
          owner: 'new-owner',
          team_members: ['QA-QUALITY-QUINN']
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.updated_fields).toHaveLength(5);
        expect(result.metadata.data.updated_fields).toContain('name');
        expect(result.metadata.data.updated_fields).toContain('description');
        expect(result.metadata.data.updated_fields).toContain('status');
        expect(result.metadata.data.updated_fields).toContain('owner');
        expect(result.metadata.data.updated_fields).toContain('team_members');
      });

      it('should handle project not found error', async () => {
        mockProjectService.updateProject.mockRejectedValue(
          new Error('Project not found: project-999')
        );

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-999',
          name: 'New Name'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project not found: project-999');
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should handle duplicate name error', async () => {
        mockProjectService.updateProject.mockRejectedValue(
          new Error('Project with name \'Existing Name\' already exists')
        );

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'Existing Name'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project with name \'Existing Name\' already exists');
      });

      it('should only update provided fields', async () => {
        mockProjectService.updateProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          description: 'Only updating description'
        });

        expect(mockProjectService.updateProject).toHaveBeenCalledWith(
          'project-123',
          { description: 'Only updating description' }
        );
        expect(result.metadata.data.updated_fields).toEqual(['description']);
      });
    });

    describe('output formatting', () => {
      it('should format update details', async () => {
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          name: 'Updated Name' 
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'Updated Name'
        });

        expect(result.output).toContain('Project Updated Successfully');
        expect(result.output).toContain('**Name**: Updated Name');
        expect(result.output).toContain('**ID**: project-123');
        expect(result.output).toContain('Updated Fields');
        expect(result.output).toContain('- **name**: "Updated Name"');
      });

      it('should show all updated fields', async () => {
        const updates = {
          name: 'New Name',
          description: 'New Description',
          status: 'on_hold'
        };
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          ...updates,
          status: 'on_hold' as any
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          ...updates
        });

        expect(result.output).toContain('- **name**: "New Name"');
        expect(result.output).toContain('- **description**: "New Description"');
        expect(result.output).toContain('- **status**: "on_hold"');
      });

      it('should handle array updates properly', async () => {
        const newTeam = ['QA-QUALITY-QUINN', 'TEST-AUTOMATION-TARA'];
        mockProjectService.updateProject.mockResolvedValue({ 
          ...mockProject, 
          team_members: newTeam 
        });

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          team_members: newTeam
        });

        expect(result.output).toContain('- **team_members**: ["QA-QUALITY-QUINN","TEST-AUTOMATION-TARA"]');
      });

      it('should include execution time in metadata', async () => {
        mockProjectService.updateProject.mockResolvedValue(mockProject);

        const result = await (projectTools as any).updateProject({ 
          project_id: 'project-123',
          name: 'New Name'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('listProjects', () => {
    const mockProjects = [
      mockProject,
      { ...mockProject, id: 'project-456', name: 'Another Project', status: 'completed' as ProjectStatus },
      { ...mockProject, id: 'project-789', name: 'Third Project', status: 'archived' as ProjectStatus }
    ];

    describe('input validation', () => {
      it('should accept default filter', async () => {
        mockProjectService.listProjects.mockResolvedValue([mockProject]);

        const result = await (projectTools as any).listProjects({});

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.listProjects).toHaveBeenCalled();
      });

      it('should accept all filter values', async () => {
        const filters = ['all', 'active', 'completed', 'archived'];
        
        for (const filter of filters) {
          mockProjectService.listProjects.mockResolvedValue(mockProjects);

          const result = await (projectTools as any).listProjects({ filter });

          expect(result.metadata.status).toBe('success');
          expect(result.metadata.data.filter).toBe(filter);
        }
      });

      it('should reject invalid filter value', async () => {
        const result = await (projectTools as any).listProjects({ filter: 'invalid' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockProjectService.listProjects).not.toHaveBeenCalled();
      });

      it('should accept include_stats boolean', async () => {
        mockProjectService.listProjects.mockResolvedValue([mockProject]);

        const result = await (projectTools as any).listProjects({ include_stats: true });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Project Statistics');
      });

      it('should reject invalid include_stats type', async () => {
        const result = await (projectTools as any).listProjects({ include_stats: 'yes' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Expected boolean');
        expect(mockProjectService.listProjects).not.toHaveBeenCalled();
      });
    });

    describe('service integration', () => {
      it('should list all projects when filter is all', async () => {
        mockProjectService.listProjects.mockResolvedValue(mockProjects);

        const result = await (projectTools as any).listProjects({ filter: 'all' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_count).toBe(3);
        expect(result.output).toContain('Total Projects: 3');
        expect(result.output).toContain('Test Project');
        expect(result.output).toContain('Another Project');
        expect(result.output).toContain('Third Project');
      });

      it('should filter projects by status', async () => {
        mockProjectService.listProjects.mockResolvedValue(mockProjects);

        const result = await (projectTools as any).listProjects({ filter: 'active' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_count).toBe(1);
        expect(result.output).toContain('Test Project');
        expect(result.output).not.toContain('Another Project');
        expect(result.output).not.toContain('Third Project');
      });

      it('should handle empty project list', async () => {
        mockProjectService.listProjects.mockResolvedValue([]);

        const result = await (projectTools as any).listProjects({ filter: 'active' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_count).toBe(0);
        expect(result.output).toContain('No projects found matching the filter criteria');
      });

      it('should include statistics when requested', async () => {
        const projectWithStats = {
          ...mockProject,
          stats: {
            total_tasks: 10,
            completed_tasks: 5,
            active_agents: 2,
            completion_rate: 0.5,
            total_hours_spent: 40
          }
        };
        mockProjectService.listProjects.mockResolvedValue([projectWithStats]);

        const result = await (projectTools as any).listProjects({ include_stats: true });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Project Statistics');
        expect(result.output).toContain('Total Tasks: 10');
        expect(result.output).toContain('Completed Tasks: 5');
        expect(result.output).toContain('Active Agents: 2');
        expect(result.output).toContain('Completion Rate: 50%');
      });

      it('should handle service errors gracefully', async () => {
        mockProjectService.listProjects.mockRejectedValue(new Error('Database error'));

        const result = await (projectTools as any).listProjects({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database error');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to list projects',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting', () => {
      it('should format project table correctly', async () => {
        mockProjectService.listProjects.mockResolvedValue([mockProject]);

        const result = await (projectTools as any).listProjects({});

        expect(result.output).toContain('| Name | Status | Owner | Created |');
        expect(result.output).toContain('|------|--------|-------|----------|');
        expect(result.output).toContain('| Test Project | active | mcp-user | 2025-01-20 |');
      });

      it('should include execution time in metadata', async () => {
        mockProjectService.listProjects.mockResolvedValue([mockProject]);

        const result = await (projectTools as any).listProjects({});

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('switchProject', () => {
    describe('input validation', () => {
      it('should require project_name field', async () => {
        const result = await (projectTools as any).switchProject({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockProjectService.switchProject).not.toHaveBeenCalled();
      });

      it('should accept valid project_name', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.switchProject).toHaveBeenCalledWith(
          'Test Project',
          expect.any(Object)
        );
      });

      it('should accept optional project_id', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ 
          project_name: 'Test Project',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.switchProject).toHaveBeenCalledWith(
          'Test Project',
          expect.objectContaining({ projectId: 'project-123' })
        );
      });

      it('should accept create_if_missing boolean', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ 
          project_name: 'Test Project',
          create_if_missing: true
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.switchProject).toHaveBeenCalledWith(
          'Test Project',
          expect.objectContaining({ createIfMissing: true })
        );
      });

      it('should default sync_tasks to true', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.output).toContain('✓ Task synchronization enabled');
      });
    });

    describe('service integration', () => {
      it('should switch to existing project', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_name).toBe('Test Project');
        expect(result.metadata.data.project_id).toBe('project-123');
        expect(result.metadata.data.project_status).toBe('active');
        expect(result.metadata.data.created_new).toBe(false);
      });

      it('should create new project when missing and flag is set', async () => {
        const newProject = { ...mockProject, created_at: new Date() };
        mockProjectService.switchProject.mockResolvedValue(newProject);
        mockProjectService.getProjectStatus.mockResolvedValue({ ...mockProjectStatusReport, project: newProject });

        const result = await (projectTools as any).switchProject({ 
          project_name: 'New Project',
          create_if_missing: true
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.created_new).toBe(true);
        expect(result.output).toContain('✓ New project created');
      });

      it('should include task statistics in output', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.output).toContain('Task Statistics');
        expect(result.output).toContain('**pending**: 5');
        expect(result.output).toContain('**in_progress**: 3');
        expect(result.output).toContain('**completed**: 7');
      });

      it('should handle project not found error', async () => {
        mockProjectService.switchProject.mockRejectedValue(new Error('Project not found: Test Project'));

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project not found: Test Project');
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should handle empty task statistics', async () => {
        const emptyStats = {
          ...mockProjectStatusReport,
          task_statistics: {
            ...mockProjectStatusReport.task_statistics,
            by_status: {
              pending: 0,
              in_progress: 0,
              completed: 0,
              blocked: 0,
              cancelled: 0
            }
          }
        };
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(emptyStats);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('No tasks in this project yet.');
      });
    });

    describe('output formatting', () => {
      it('should format project details correctly', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).switchProject({ project_name: 'Test Project' });

        expect(result.output).toContain('Project Context Switched');
        expect(result.output).toContain('**Project**: Test Project');
        expect(result.output).toContain('**Project ID**: project-123');
        expect(result.output).toContain('**Status**: active');
        expect(result.output).toContain('**Owner**: mcp-user');
      });

      it('should show sync_tasks status', async () => {
        mockProjectService.switchProject.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const resultEnabled = await (projectTools as any).switchProject({ 
          project_name: 'Test Project',
          sync_tasks: true
        });
        expect(resultEnabled.output).toContain('✓ Task synchronization enabled');

        const resultDisabled = await (projectTools as any).switchProject({ 
          project_name: 'Test Project',
          sync_tasks: false
        });
        expect(resultDisabled.output).toContain('⚠️ Task synchronization disabled');
      });
    });
  });

  describe('getProjectStatus', () => {
    describe('input validation', () => {
      it('should require either project_name or project_id', async () => {
        const result = await (projectTools as any).getProjectStatus({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Either project_name or project_id must be provided');
        expect(mockProjectService.getProjectStatus).not.toHaveBeenCalled();
      });

      it('should accept project_name', async () => {
        mockProjectService.findProjectByName.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.findProjectByName).toHaveBeenCalledWith('Test Project');
        expect(mockProjectService.getProjectStatus).toHaveBeenCalledWith('project-123');
      });

      it('should accept project_id', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.findProjectByName).not.toHaveBeenCalled();
        expect(mockProjectService.getProjectStatus).toHaveBeenCalledWith('project-123');
      });

      it('should prefer project_id over project_name', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          project_name: 'Test Project'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockProjectService.findProjectByName).not.toHaveBeenCalled();
        expect(mockProjectService.getProjectStatus).toHaveBeenCalledWith('project-123');
      });

      it('should accept optional include_agents flag', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          include_agents: false
        });

        expect(result.metadata.status).toBe('success');
        expect(result.output).not.toContain('Agent Activity');
      });

      it('should accept optional include_activity flag', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          include_activity: false
        });

        expect(result.metadata.status).toBe('success');
        expect(result.output).not.toContain('Recent Activity');
      });

      it('should accept optional activity_limit', async () => {
        const reportWithManyActivities = {
          ...mockProjectStatusReport,
          recent_activity: Array(20).fill(null).map((_, i) => ({
            type: 'task_created' as const,
            description: `Activity ${i}`,
            timestamp: new Date()
          }))
        };
        mockProjectService.getProjectStatus.mockResolvedValue(reportWithManyActivities);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          activity_limit: 5
        });

        expect(result.metadata.status).toBe('success');
        const activityCount = (result.output.match(/Activity \d+/g) || []).length;
        expect(activityCount).toBe(5);
      });
    });

    describe('service integration', () => {
      it('should get project status by name', async () => {
        mockProjectService.findProjectByName.mockResolvedValue(mockProject);
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_name: 'Test Project' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.project_id).toBe('project-123');
        expect(result.metadata.data.project_name).toBe('Test Project');
        expect(result.metadata.data.total_tasks).toBe(15);
        expect(result.metadata.data.completion_rate).toBe(46.67);
      });

      it('should handle project not found by name', async () => {
        mockProjectService.findProjectByName.mockResolvedValue(null);

        const result = await (projectTools as any).getProjectStatus({ project_name: 'Non-existent' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project not found: Non-existent');
      });

      it('should include comprehensive statistics', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('Task Statistics');
        expect(result.output).toContain('**Total Tasks**: 15');
        expect(result.output).toContain('By Status:');
        expect(result.output).toContain('⏳ **pending**: 5');
        expect(result.output).toContain('🚀 **in_progress**: 3');
        expect(result.output).toContain('✅ **completed**: 7');
      });

      it('should include priority breakdown', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('By Priority:');
        expect(result.output).toContain('🔴 **critical**: 1');
        expect(result.output).toContain('🟠 **high**: 3');
        expect(result.output).toContain('🟡 **medium**: 8');
        expect(result.output).toContain('🟢 **low**: 3');
      });

      it('should include timeline information', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('Timeline:');
        expect(result.output).toContain('**Overdue**: 1 ⚠️');
        expect(result.output).toContain('**Due Today**: 2');
        expect(result.output).toContain('**Due This Week**: 5');
      });

      it('should include agent activity when enabled', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          include_agents: true
        });

        expect(result.output).toContain('Agent Activity');
        expect(result.output).toContain('**Active Agents**: 2');
        expect(result.output).toContain('Tasks by Agent:');
        expect(result.output).toContain('**BE-BACKEND-BENJAMIN**: 5 tasks');
        expect(result.output).toContain('**FE-FRONTEND-FIONA**: 3 tasks');
        expect(result.output).toContain('Recent Completions:');
        expect(result.output).toContain('"Setup database" by BE-BACKEND-BENJAMIN');
      });

      it('should include project health metrics', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('Project Health');
        expect(result.output).toContain('**Completion Rate**: 46.67% 🔴');
        expect(result.output).toContain('**On-Time Rate**: 85.71% 🟡');
        expect(result.output).toContain('**Blocked Tasks**: 0');
        expect(result.output).toContain('**Estimated Completion**: 2025-02-15');
      });

      it('should handle missing estimated completion', async () => {
        const reportNoEstimate = {
          ...mockProjectStatusReport,
          project_health: {
            ...mockProjectStatusReport.project_health,
            estimated_completion: null as any
          }
        };
        mockProjectService.getProjectStatus.mockResolvedValue(reportNoEstimate);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('**Estimated Completion**: Unable to estimate');
      });

      it('should include recent activity when enabled', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ 
          project_id: 'project-123',
          include_activity: true
        });

        expect(result.output).toContain('Recent Activity');
        expect(result.output).toContain('✅ Task "Setup database" completed by BE-BACKEND-BENJAMIN');
      });

      it('should use correct activity icons', async () => {
        const reportWithVariedActivities = {
          ...mockProjectStatusReport,
          recent_activity: [
            { type: 'task_created' as const, description: 'Task created', timestamp: new Date() },
            { type: 'task_completed' as const, description: 'Task completed', timestamp: new Date() },
            { type: 'task_updated' as const, description: 'Task updated', timestamp: new Date() },
            { type: 'agent_assigned' as const, description: 'Agent assigned', timestamp: new Date() },
            { type: 'task_created' as const, description: 'Unknown activity', timestamp: new Date() }
          ]
        };
        mockProjectService.getProjectStatus.mockResolvedValue(reportWithVariedActivities);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('➕ Task created');
        expect(result.output).toContain('✅ Task completed');
        expect(result.output).toContain('📝 Task updated');
        expect(result.output).toContain('👤 Agent assigned');
      });

      it('should handle service errors gracefully', async () => {
        mockProjectService.getProjectStatus.mockRejectedValue(new Error('Database connection failed'));

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database connection failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get project status',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting', () => {
      it('should use health emojis based on percentage', async () => {
        const testCases = [
          { rate: 95, emoji: '🟢' },
          { rate: 75, emoji: '🟡' },
          { rate: 55, emoji: '🟠' },
          { rate: 45, emoji: '🔴' }
        ];

        for (const testCase of testCases) {
          const report = {
            ...mockProjectStatusReport,
            project_health: {
              ...mockProjectStatusReport.project_health,
              completion_rate: testCase.rate
            }
          };
          mockProjectService.getProjectStatus.mockResolvedValue(report);

          const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

          expect(result.output).toContain(`**Completion Rate**: ${testCase.rate}% ${testCase.emoji}`);
        }
      });

      it('should show warning for high blocked task count', async () => {
        const reportHighBlocked = {
          ...mockProjectStatusReport,
          project_health: {
            ...mockProjectStatusReport.project_health,
            blocked_tasks: 10
          }
        };
        mockProjectService.getProjectStatus.mockResolvedValue(reportHighBlocked);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('**Blocked Tasks**: 10 ⚠️');
      });

      it('should include last updated timestamp', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.output).toContain('**Last Updated**:');
        expect(result.output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should include execution time in metadata', async () => {
        mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

        const result = await (projectTools as any).getProjectStatus({ project_id: 'project-123' });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null or undefined service responses', async () => {
      mockProjectService.listProjects.mockResolvedValue(null as any);

      const result = await (projectTools as any).listProjects({});

      expect(result.metadata.status).toBe('error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle malformed project data', async () => {
      const malformedProject = { id: 'test', name: 'Test' } as any;
      mockProjectService.listProjects.mockResolvedValue([malformedProject]);

      const result = await (projectTools as any).listProjects({});

      // Should not crash, but may have missing data in output
      expect(result.metadata.status).toBe('success');
    });

    it('should handle concurrent tool calls', async () => {
      mockProjectService.listProjects.mockResolvedValue([mockProject]);
      mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

      const promises = [
        (projectTools as any).listProjects({}),
        (projectTools as any).getProjectStatus({ project_id: 'project-123' })
      ];

      const results = await Promise.all(promises);

      expect(results[0].metadata.status).toBe('success');
      expect(results[1].metadata.status).toBe('success');
    });

    it('should log all operations', async () => {
      mockProjectService.listProjects.mockResolvedValue([mockProject]);
      mockProjectService.switchProject.mockResolvedValue(mockProject);
      mockProjectService.getProjectStatus.mockResolvedValue(mockProjectStatusReport);

      await (projectTools as any).listProjects({});
      expect(mockLogger.info).toHaveBeenCalledWith('Listing projects', expect.any(Object));

      await (projectTools as any).switchProject({ project_name: 'Test' });
      expect(mockLogger.info).toHaveBeenCalledWith('Switching project', expect.any(Object));

      await (projectTools as any).getProjectStatus({ project_id: 'test' });
      expect(mockLogger.info).toHaveBeenCalledWith('Getting project status', expect.any(Object));
    });
  });
});