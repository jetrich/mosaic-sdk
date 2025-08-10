# Project Switch Implementation

## Overview

This document describes the implementation of the `mosaic_project_switch` functionality in the MCP Orchestrator service.

## Features Implemented

### 1. Project Switching
- Switch to an existing project by name
- Optional project ID parameter for direct lookup
- Automatic project creation with `create_if_missing` flag
- Validation of project status (only `active` or `on_hold` projects can be selected)

### 2. Project Creation
- Unique project name enforcement
- Default configuration and stats initialization
- System owner assignment by default

### 3. TaskService Integration
- Automatic update of current project context in TaskService
- All new tasks created after switching inherit the current project context
- Project context persists across task operations

## API Reference

### ProjectService Methods

#### `switchProject(projectName: string, options?: SwitchOptions): Promise<Project>`

Switches the current project context.

**Parameters:**
- `projectName` (string): The name of the project to switch to
- `options` (optional):
  - `projectId` (string): Optional project ID for direct lookup
  - `createIfMissing` (boolean): Create project if it doesn't exist (default: false)

**Returns:** Project object with full details

**Throws:**
- `ValidationError` if project not found and createIfMissing is false
- `ValidationError` if project status is not 'active' or 'on_hold'
- `ValidationError` if projectId doesn't match projectName

#### `findProjectByName(projectName: string): Promise<Project | null>`

Finds a project by its name.

**Parameters:**
- `projectName` (string): The project name to search for

**Returns:** Project object or null if not found

#### `createProject(projectData: CreateProjectInput): Promise<Project>`

Creates a new project.

**Parameters:**
- `projectData`:
  - `name` (string, required): Project name (must be unique)
  - `description` (string, optional): Project description
  - `status` (ProjectStatus, optional): Initial status (default: 'active')
  - `owner` (string, optional): Project owner (default: 'system')
  - `team_members` (string[], optional): Team member list

**Returns:** Created project object

**Throws:**
- `ValidationError` if project name already exists

### Tool Interface

The `mosaic_project_switch` tool accepts the following parameters:

```typescript
{
  project_name: string;       // Required: Project name to switch to
  project_id?: string;        // Optional: Direct project ID lookup
  create_if_missing?: boolean; // Optional: Create if not found (default: false)
  sync_tasks?: boolean;       // Optional: Reserved for future use (default: true)
}
```

## Usage Examples

### 1. Switch to Existing Project
```javascript
const project = await projectService.switchProject('My Project');
```

### 2. Create and Switch to New Project
```javascript
const project = await projectService.switchProject('New Project', {
  createIfMissing: true
});
```

### 3. Switch Using Project ID
```javascript
const project = await projectService.switchProject('My Project', {
  projectId: 'uuid-here'
});
```

## Implementation Details

### Service Initialization
The ProjectService must be connected to TaskService after initialization:

```javascript
await projectService.initialize();
await taskService.initialize();
projectService.setTaskService(taskService);
```

### Project Context Flow
1. User calls `switchProject` with project name
2. Service looks up project by name (or ID if provided)
3. If not found and `createIfMissing` is true, creates new project
4. Validates project status is switchable
5. Updates TaskService with new project context
6. Returns project details with current task statistics

### Error Handling
- Clear error messages for missing projects
- Validation of project status before switching
- Proper error propagation with context

## Testing

The implementation includes:
- Integration tests for all major scenarios
- Manual test script for verification
- Type safety with TypeScript strict mode

## Future Enhancements

The `sync_tasks` parameter is reserved for future functionality that could:
- Migrate in-progress tasks to new project
- Update task filters automatically
- Sync project-specific settings