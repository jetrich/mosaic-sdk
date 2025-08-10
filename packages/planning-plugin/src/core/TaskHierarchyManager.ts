/**
 * Task Hierarchy Manager
 * 
 * Manages the creation and maintenance of UPP task hierarchy files and database entries.
 * Creates the proper directory structure and populates task files following the 
 * documented UPP standards.
 */

import { Logger } from '../utils/Logger';
import { StateTracker } from './state-tracker';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UPPTask, UPPHierarchy } from './UPPDecomposer';

export interface HierarchyManagerConfig {
  projectId: string;
  baseDirectory: string;
}

export interface TaskFileStructure {
  epicDir: string;
  featureDir: string;
  storyDir: string;
  taskDir: string;
  subtaskDir: string;
  atomicFile: string;
}

/**
 * Task Hierarchy Manager
 */
export class TaskHierarchyManager {
  private logger: Logger;
  private stateTracker: StateTracker;
  private config!: HierarchyManagerConfig;

  constructor(logger: Logger, stateTracker: StateTracker) {
    this.logger = logger;
    this.stateTracker = stateTracker;
  }

  /**
   * Initialize hierarchy manager
   */
  async initialize(config: HierarchyManagerConfig): Promise<void> {
    this.config = config;
    
    this.logger.info('Initializing task hierarchy manager', {
      projectId: config.projectId,
      baseDirectory: config.baseDirectory
    });

    // Ensure base directory exists
    await this.ensureDirectoryExists(config.baseDirectory);
  }

  /**
   * Create complete task hierarchy files from UPP decomposition
   */
  async createTaskHierarchyFiles(hierarchy: UPPHierarchy): Promise<string[]> {
    const createdFiles: string[] = [];
    
    this.logger.info('Creating task hierarchy files', {
      totalTasks: hierarchy.metadata.totalTasks,
      epicId: hierarchy.epic.id
    });

    try {
      // Step 1: Create Epic directory structure
      const epicStructure = await this.createEpicStructure(hierarchy.epic);
      createdFiles.push(epicStructure.epicDir);

      // Step 2: Create Features
      for (const feature of hierarchy.features) {
        const featureStructure = await this.createFeatureStructure(feature, epicStructure);
        createdFiles.push(featureStructure.featureDir);

        // Step 3: Create Stories for this feature
        const featureStories = hierarchy.stories.filter(story => story.parentId === feature.id);
        for (const story of featureStories) {
          const storyStructure = await this.createStoryStructure(story, featureStructure);
          createdFiles.push(storyStructure.storyDir);

          // Step 4: Create Tasks for this story
          const storyTasks = hierarchy.tasks.filter(task => task.parentId === story.id);
          for (const task of storyTasks) {
            const taskStructure = await this.createTaskStructure(task, storyStructure);
            createdFiles.push(taskStructure.taskDir);

            // Step 5: Create Subtasks for this task
            const taskSubtasks = hierarchy.subtasks.filter(subtask => subtask.parentId === task.id);
            for (const subtask of taskSubtasks) {
              const subtaskStructure = await this.createSubtaskStructure(subtask, taskStructure);
              createdFiles.push(subtaskStructure.subtaskDir);

              // Step 6: Create Atomic tasks for this subtask
              const subtaskAtomics = hierarchy.atomic.filter(atomic => atomic.parentId === subtask.id);
              for (const atomic of subtaskAtomics) {
                const atomicFile = await this.createAtomicTaskFile(atomic, subtaskStructure);
                createdFiles.push(atomicFile);
              }
            }
          }
        }
      }

      // Step 7: Create master task list and dependencies
      const masterFile = await this.createMasterTaskList(hierarchy);
      createdFiles.push(masterFile);

      const dependencyFile = await this.createDependencyMap(hierarchy);
      createdFiles.push(dependencyFile);

      this.logger.info('Task hierarchy files created successfully', {
        totalFiles: createdFiles.length,
        epicId: hierarchy.epic.id
      });

      return createdFiles;

    } catch (error) {
      this.logger.error('Failed to create task hierarchy files', error);
      throw error;
    }
  }

  /**
   * Populate database with task hierarchy
   */
  async populateTaskDatabase(hierarchy: UPPHierarchy): Promise<void> {
    this.logger.info('Populating task database', {
      totalTasks: hierarchy.metadata.totalTasks
    });

    try {
      // Create database entries for all tasks
      await this.createDatabaseEntry(hierarchy.epic);

      for (const feature of hierarchy.features) {
        await this.createDatabaseEntry(feature);
      }

      for (const story of hierarchy.stories) {
        await this.createDatabaseEntry(story);
      }

      for (const task of hierarchy.tasks) {
        await this.createDatabaseEntry(task);
      }

      for (const subtask of hierarchy.subtasks) {
        await this.createDatabaseEntry(subtask);
      }

      for (const atomic of hierarchy.atomic) {
        await this.createDatabaseEntry(atomic);
      }

      // Create dependency relationships
      for (const dependency of hierarchy.dependencies) {
        await this.createDependencyEntry(dependency);
      }

      this.logger.info('Task database populated successfully');

    } catch (error) {
      this.logger.error('Failed to populate task database', error);
      throw error;
    }
  }

  /**
   * Create Epic directory structure
   */
  private async createEpicStructure(epic: UPPTask): Promise<TaskFileStructure> {
    const epicDirName = `${epic.id}-${this.sanitizeFileName(epic.title)}`;
    const epicDir = path.join(this.config.baseDirectory, epicDirName);

    await this.ensureDirectoryExists(epicDir);
    await this.ensureDirectoryExists(path.join(epicDir, 'features'));
    await this.ensureDirectoryExists(path.join(epicDir, 'planning'));
    await this.ensureDirectoryExists(path.join(epicDir, 'reports'));
    await this.ensureDirectoryExists(path.join(epicDir, 'workspace'));

    // Create Epic README
    const epicReadme = await this.createEpicReadme(epic, epicDir);

    return {
      epicDir,
      featureDir: path.join(epicDir, 'features'),
      storyDir: '',
      taskDir: '',
      subtaskDir: '',
      atomicFile: ''
    };
  }

  /**
   * Create Feature directory structure
   */
  private async createFeatureStructure(
    feature: UPPTask, 
    epicStructure: TaskFileStructure
  ): Promise<TaskFileStructure> {
    const featureDirName = `${feature.id}-${this.sanitizeFileName(feature.title)}`;
    const featureDir = path.join(epicStructure.featureDir, featureDirName);

    await this.ensureDirectoryExists(featureDir);
    await this.ensureDirectoryExists(path.join(featureDir, 'reports'));

    // Create Feature README
    const featureReadme = await this.createFeatureReadme(feature, featureDir);

    return {
      epicDir: epicStructure.epicDir,
      featureDir,
      storyDir: featureDir,
      taskDir: '',
      subtaskDir: '',
      atomicFile: ''
    };
  }

  /**
   * Create Story directory structure
   */
  private async createStoryStructure(
    story: UPPTask, 
    featureStructure: TaskFileStructure
  ): Promise<TaskFileStructure> {
    const storyDirName = `${story.id}-${this.sanitizeFileName(story.title)}`;
    const storyDir = path.join(featureStructure.featureDir, storyDirName);

    await this.ensureDirectoryExists(storyDir);
    await this.ensureDirectoryExists(path.join(storyDir, 'reports'));

    // Create Story README
    const storyReadme = await this.createStoryReadme(story, storyDir);

    return {
      ...featureStructure,
      storyDir,
      taskDir: storyDir,
      subtaskDir: '',
      atomicFile: ''
    };
  }

  /**
   * Create Task directory structure
   */
  private async createTaskStructure(
    task: UPPTask, 
    storyStructure: TaskFileStructure
  ): Promise<TaskFileStructure> {
    const taskDirName = `${task.id}-${this.sanitizeFileName(task.title)}`;
    const taskDir = path.join(storyStructure.storyDir, taskDirName);

    await this.ensureDirectoryExists(taskDir);
    await this.ensureDirectoryExists(path.join(taskDir, 'reports'));

    // Create Task README
    const taskReadme = await this.createTaskReadme(task, taskDir);

    return {
      ...storyStructure,
      taskDir,
      subtaskDir: taskDir,
      atomicFile: ''
    };
  }

  /**
   * Create Subtask directory structure
   */
  private async createSubtaskStructure(
    subtask: UPPTask, 
    taskStructure: TaskFileStructure
  ): Promise<TaskFileStructure> {
    const subtaskDirName = `${subtask.id}-${this.sanitizeFileName(subtask.title)}`;
    const subtaskDir = path.join(taskStructure.taskDir, subtaskDirName);

    await this.ensureDirectoryExists(subtaskDir);
    await this.ensureDirectoryExists(path.join(subtaskDir, 'reports'));

    // Create Subtask README
    const subtaskReadme = await this.createSubtaskReadme(subtask, subtaskDir);

    return {
      ...taskStructure,
      subtaskDir,
      atomicFile: subtaskDir
    };
  }

  /**
   * Create Atomic task file
   */
  private async createAtomicTaskFile(
    atomic: UPPTask, 
    subtaskStructure: TaskFileStructure
  ): Promise<string> {
    const atomicFileName = `${atomic.id}-${this.sanitizeFileName(atomic.title)}.md`;
    const atomicFile = path.join(subtaskStructure.subtaskDir, atomicFileName);

    const content = this.generateAtomicTaskContent(atomic);
    await fs.writeFile(atomicFile, content, 'utf8');

    return atomicFile;
  }

  /**
   * Generate content for different task levels
   */
  private async createEpicReadme(epic: UPPTask, epicDir: string): Promise<string> {
    const readmePath = path.join(epicDir, 'README.md');
    const content = `# Epic: ${epic.title}

**Epic ID**: ${epic.id}  
**Status**: ${epic.status}  
**Estimated Hours**: ${epic.estimatedHours}  
**Created**: ${epic.metadata.createdAt.toISOString()}  

## Description

${epic.description}

## Business Value

[Business value and success criteria]

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Dependencies

${epic.metadata.dependencies?.map(dep => `- ${dep}`).join('\n') || 'None'}

## Features

[Features will be populated as they are created]

## Progress

- **Status**: ${epic.status}
- **Progress**: 0% (0/0 features complete)
- **Estimated Completion**: TBD

## Notes

[Epic-level notes and decisions]

---

*Epic created by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(readmePath, content, 'utf8');
    return readmePath;
  }

  private async createFeatureReadme(feature: UPPTask, featureDir: string): Promise<string> {
    const readmePath = path.join(featureDir, 'README.md');
    const content = `# Feature: ${feature.title}

**Feature ID**: ${feature.id}  
**Parent**: ${feature.parentId}  
**Status**: ${feature.status}  
**Estimated Hours**: ${feature.estimatedHours}  
**Created**: ${feature.metadata.createdAt.toISOString()}  

## Description

${feature.description}

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## User Stories

[Stories will be populated as they are created]

## Technical Notes

[Technical implementation notes]

## Progress

- **Status**: ${feature.status}
- **Progress**: 0% (0/0 stories complete)

---

*Feature created by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(readmePath, content, 'utf8');
    return readmePath;
  }

  private async createStoryReadme(story: UPPTask, storyDir: string): Promise<string> {
    const readmePath = path.join(storyDir, 'README.md');
    const content = `# User Story: ${story.title}

**Story ID**: ${story.id}  
**Parent Feature**: ${story.parentId}  
**Status**: ${story.status}  
**Estimated Hours**: ${story.estimatedHours}  
**Created**: ${story.metadata.createdAt.toISOString()}  

## Story

${story.description}

## Acceptance Criteria

- [ ] [Given/When/Then criteria]

## Tasks

[Tasks will be populated as they are created]

## Definition of Done

- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Acceptance criteria verified

---

*Story created by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(readmePath, content, 'utf8');
    return readmePath;
  }

  private async createTaskReadme(task: UPPTask, taskDir: string): Promise<string> {
    const readmePath = path.join(taskDir, 'README.md');
    const content = `# Task: ${task.title}

**Task ID**: ${task.id}  
**Parent Story**: ${task.parentId}  
**Status**: ${task.status}  
**Estimated Hours**: ${task.estimatedHours}  
**Assigned To**: ${task.assignedAgent || 'Unassigned'}  
**Created**: ${task.metadata.createdAt.toISOString()}  

## Description

${task.description}

## Technical Requirements

[Specific technical requirements]

## Subtasks

[Subtasks will be populated as they are created]

## Implementation Notes

[Technical implementation notes]

---

*Task created by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(readmePath, content, 'utf8');
    return readmePath;
  }

  private async createSubtaskReadme(subtask: UPPTask, subtaskDir: string): Promise<string> {
    const readmePath = path.join(subtaskDir, 'README.md');
    const content = `# Subtask: ${subtask.title}

**Subtask ID**: ${subtask.id}  
**Parent Task**: ${subtask.parentId}  
**Status**: ${subtask.status}  
**Estimated Hours**: ${subtask.estimatedHours}  
**Assigned To**: ${subtask.assignedAgent || 'Unassigned'}  
**Created**: ${subtask.metadata.createdAt.toISOString()}  

## Description

${subtask.description}

## Work Items

[Specific work items to complete]

## Atomic Tasks

[Atomic tasks will be populated as files]

---

*Subtask created by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(readmePath, content, 'utf8');
    return readmePath;
  }

  private generateAtomicTaskContent(atomic: UPPTask): string {
    return `# Atomic Task: ${atomic.title}

**Task ID**: ${atomic.id}  
**Parent Subtask**: ${atomic.parentId}  
**Status**: ${atomic.status}  
**Estimated Time**: ${atomic.estimatedHours ? Math.round(atomic.estimatedHours * 60) : 30} minutes  
**Assigned To**: ${atomic.assignedAgent || 'Unassigned'}  
**Created**: ${atomic.metadata.createdAt.toISOString()}  

## Description

${atomic.description}

## Steps to Complete

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Acceptance Criteria

- [ ] [Specific, measurable criterion]

## Done Criteria

- [ ] Implementation complete
- [ ] Self-tested
- [ ] Ready for integration

## Notes

[Implementation notes]

---

*Atomic task created by Tony Planning Orchestrator on ${new Date().toISOString()}*

**⚡ This task should take ≤30 minutes to complete**
`;
  }

  /**
   * Create master task list
   */
  private async createMasterTaskList(hierarchy: UPPHierarchy): Promise<string> {
    const masterFile = path.join(this.config.baseDirectory, '..', '..', 'MASTER_TASK_LIST.md');
    
    const content = `# Master Task List - ${this.config.projectId}

**Epic**: ${hierarchy.epic.title} (${hierarchy.epic.id})  
**Total Tasks**: ${hierarchy.metadata.totalTasks}  
**Total Estimated Hours**: ${hierarchy.metadata.totalEstimatedHours}  
**Generated**: ${new Date().toISOString()}  

## Task Hierarchy Summary

- **Epic**: 1 (${hierarchy.epic.id})
- **Features**: ${hierarchy.features.length}
- **Stories**: ${hierarchy.stories.length}
- **Tasks**: ${hierarchy.tasks.length}
- **Subtasks**: ${hierarchy.subtasks.length}
- **Atomic Tasks**: ${hierarchy.atomic.length}

## Features Overview

${hierarchy.features.map(feature => 
  `### ${feature.id} - ${feature.title}\n**Status**: ${feature.status} | **Hours**: ${feature.estimatedHours}\n${feature.description}\n`
).join('\n')}

## Next Steps

1. Review task hierarchy
2. Assign agents to atomic tasks
3. Begin parallel implementation
4. Monitor progress through task completion

---

*Generated by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(masterFile, content, 'utf8');
    return masterFile;
  }

  /**
   * Create dependency map
   */
  private async createDependencyMap(hierarchy: UPPHierarchy): Promise<string> {
    const depFile = path.join(this.config.baseDirectory, '..', '..', 'DEPENDENCY_MAP.md');
    
    const content = `# Task Dependency Map - ${this.config.projectId}

**Epic**: ${hierarchy.epic.id}  
**Dependencies**: ${hierarchy.dependencies.length}  
**Generated**: ${new Date().toISOString()}  

## Dependency Relationships

${hierarchy.dependencies.length > 0 ? 
  hierarchy.dependencies.map(dep => 
    `### ${dep.taskId}\nDepends on: ${dep.dependsOn.join(', ')}\n`
  ).join('\n') : 
  'No dependencies identified.'
}

## Parallel Execution Opportunities

[Tasks that can be executed in parallel]

---

*Generated by Tony Planning Orchestrator on ${new Date().toISOString()}*
`;

    await fs.writeFile(depFile, content, 'utf8');
    return depFile;
  }

  /**
   * Database operations
   */
  private async createDatabaseEntry(task: UPPTask): Promise<void> {
    // Use StateTracker to create database entries
    const stateTracker = this.stateTracker as any;
    if (stateTracker.addMetadata) {
      await stateTracker.addMetadata(`task_${task.id}`, {
        id: task.id,
        title: task.title,
        description: task.description,
        level: task.level,
        parentId: task.parentId,
        estimatedHours: task.estimatedHours,
        assignedAgent: task.assignedAgent,
        status: task.status,
        metadata: task.metadata
      });
    }
  }

  private async createDependencyEntry(dependency: { taskId: string; dependsOn: string[] }): Promise<void> {
    const stateTracker = this.stateTracker as any;
    if (stateTracker.addMetadata) {
      await stateTracker.addMetadata(`dependency_${dependency.taskId}`, dependency);
    }
  }

  /**
   * Utility methods
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}