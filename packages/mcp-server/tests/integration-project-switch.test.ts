import { ProjectService } from '../src/services/ProjectService';
import { TaskService } from '../src/services/TaskService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Project Switch Integration Tests', () => {
  let projectService: ProjectService;
  let taskService: TaskService;
  let logger: Logger;
  let testDataDir: string;

  beforeAll(async () => {
    // Create a temporary test database directory
    testDataDir = path.join(__dirname, 'test-data-' + Date.now());
    await fs.mkdir(testDataDir, { recursive: true });

    const config: MCPServerConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      transport: {
        type: 'stdio',
        timeout: 30000
      },
      logging: {
        level: 'error', // Keep quiet during tests
        console: false,
        structured: false
      },
      security: {
        max_concurrent_tools: 10,
        tool_timeout: 30000,
        rate_limiting: { enabled: false, requests_per_minute: 100 }
      },
      tools: {
        task_management: { enabled: true, namespace: 'task' },
        project_coordination: { enabled: true, namespace: 'project' },
        agent_orchestration: { enabled: true, namespace: 'agent' }
      },
      storage: {
        type: 'sqlite',
        connection_string: path.join(testDataDir, 'test.db'),
        migrations_path: path.join(__dirname, '../src/migrations'),
        backup_enabled: false,
        backup_interval: '1h'
      }
    };

    logger = new Logger({
      level: 'error',
      console: false,
      structured: false
    });
    
    taskService = new TaskService(config, logger);
    projectService = new ProjectService(config, logger);

    // Initialize services
    await taskService.initialize();
    await projectService.initialize();
    projectService.setTaskService(taskService);
  });

  afterAll(async () => {
    // Clean up test database
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('switchProject', () => {
    it('should switch to an existing project', async () => {
      // The default project should exist
      const project = await projectService.switchProject('Default Project');
      
      expect(project).toBeDefined();
      expect(project.name).toBe('Default Project');
      expect(project.status).toBe('active');
      
      // Verify TaskService was updated
      expect(taskService.getCurrentProject()).toBe(project.id);
    });

    it('should create a new project when createIfMissing is true', async () => {
      const projectName = 'Test Project ' + Date.now();
      
      const project = await projectService.switchProject(projectName, {
        createIfMissing: true
      });
      
      expect(project).toBeDefined();
      expect(project.name).toBe(projectName);
      expect(project.status).toBe('active');
      expect(project.owner).toBe('system');
      
      // Verify project was actually created
      const foundProject = await projectService.findProjectByName(projectName);
      expect(foundProject).toBeDefined();
      expect(foundProject?.id).toBe(project.id);
    });

    it('should throw error when project does not exist and createIfMissing is false', async () => {
      const projectName = 'Non-Existent Project ' + Date.now();
      
      await expect(
        projectService.switchProject(projectName)
      ).rejects.toThrow(`Project not found: ${projectName}`);
    });

    it('should not allow switching to a project with invalid status', async () => {
      const projectName = 'Archived Project ' + Date.now();
      
      // First create a project
      await projectService.createProject({
        name: projectName,
        status: 'archived'
      });
      
      // Try to switch to it
      await expect(
        projectService.switchProject(projectName)
      ).rejects.toThrow(/Only 'active' or 'on_hold' projects can be selected/);
    });

    it('should validate project name matches ID when both are provided', async () => {
      // Create a project first
      const project = await projectService.createProject({
        name: 'Project A'
      });
      
      // Try to switch with mismatched name and ID
      await expect(
        projectService.switchProject('Different Name', {
          projectId: project.id
        })
      ).rejects.toThrow(/exists but has name/);
    });

    it('should update task context when switching projects', async () => {
      // Create two projects
      const project1 = await projectService.createProject({
        name: 'Project 1 ' + Date.now()
      });
      const project2 = await projectService.createProject({
        name: 'Project 2 ' + Date.now()
      });
      
      // Switch to project 1
      await projectService.switchProject(project1.name);
      expect(taskService.getCurrentProject()).toBe(project1.id);
      
      // Create a task - should be in project 1
      const task1 = await taskService.createTask({
        title: 'Task in Project 1',
        type: 'task'
      });
      expect(task1.project_id).toBe(project1.id);
      
      // Switch to project 2
      await projectService.switchProject(project2.name);
      expect(taskService.getCurrentProject()).toBe(project2.id);
      
      // Create another task - should be in project 2
      const task2 = await taskService.createTask({
        title: 'Task in Project 2',
        type: 'task'
      });
      expect(task2.project_id).toBe(project2.id);
    });
  });

  describe('Project creation', () => {
    it('should enforce unique project names', async () => {
      const projectName = 'Unique Project ' + Date.now();
      
      // Create project
      await projectService.createProject({
        name: projectName
      });
      
      // Try to create another with same name
      await expect(
        projectService.createProject({
          name: projectName
        })
      ).rejects.toThrow(/already exists/);
    });

    it('should create project with default configuration', async () => {
      const project = await projectService.createProject({
        name: 'Config Test ' + Date.now()
      });
      
      expect(project.config).toBeDefined();
      expect(project.config.default_agent_model).toBe('claude-3-5-sonnet');
      expect(project.config.max_concurrent_agents).toBe(5);
      expect(project.config.task_auto_assignment).toBe(false);
      
      expect(project.stats).toBeDefined();
      expect(project.stats.total_tasks).toBe(0);
      expect(project.stats.completed_tasks).toBe(0);
    });
  });
});