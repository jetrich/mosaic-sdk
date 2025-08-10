import { HTTPBackend } from '../bridge/HTTPBridge.js';

export interface PlaneConfig {
  apiUrl: string;
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
}

export interface PlaneIssue {
  id: string;
  name: string;
  description?: string;
  state: string;
  priority: number;
  assignees: string[];
  labels: string[];
  created_at: string;
  updated_at: string;
}

export class PlaneIntegration {
  private headers: Record<string, string>;
  
  constructor(private config: PlaneConfig) {
    this.headers = {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Create a new issue in Plane
   */
  async createIssue(params: {
    name: string;
    description?: string;
    priority?: number;
    state?: string;
    assignees?: string[];
    labels?: string[];
  }): Promise<PlaneIssue> {
    const url = `${this.config.apiUrl}/api/v1/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/`;
    
    const body = {
      name: params.name,
      description: params.description || '',
      priority: params.priority || 3, // Medium priority
      state: params.state || 'backlog',
      assignees: params.assignees || [],
      labels: params.labels || []
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as PlaneIssue;
  }
  
  /**
   * List issues from Plane
   */
  async listIssues(params?: {
    state?: string;
    assignee?: string;
    labels?: string[];
    limit?: number;
  }): Promise<PlaneIssue[]> {
    let url = `${this.config.apiUrl}/api/v1/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/`;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.state) queryParams.append('state', params.state);
    if (params?.assignee) queryParams.append('assignees', params.assignee);
    if (params?.labels?.length) queryParams.append('labels', params.labels.join(','));
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    if (queryParams.toString()) {
      url += '?' + queryParams.toString();
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    return data.results || data;
  }
  
  /**
   * Update an existing issue
   */
  async updateIssue(issueId: string, updates: Partial<PlaneIssue>): Promise<PlaneIssue> {
    const url = `${this.config.apiUrl}/api/v1/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/issues/${issueId}/`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as PlaneIssue;
  }
  
  /**
   * Create issue from MosAIc task
   */
  async createIssueFromTask(task: {
    title: string;
    description?: string;
    type: string;
    assignedTo?: string;
  }): Promise<PlaneIssue> {
    // Map task type to Plane priority
    const priorityMap: Record<string, number> = {
      epic: 1,      // Urgent
      feature: 2,   // High
      story: 3,     // Medium
      task: 3,      // Medium
      subtask: 4,   // Low
      atomic: 4     // Low
    };
    
    // Map task type to labels
    const labels = [`mosaic-${task.type}`];
    if (task.type === 'epic' || task.type === 'feature') {
      labels.push('high-level');
    }
    
    return await this.createIssue({
      name: task.title,
      description: task.description || `Created from MosAIc ${task.type}`,
      priority: priorityMap[task.type] || 3,
      labels,
      assignees: task.assignedTo ? [task.assignedTo] : []
    });
  }
  
  /**
   * Sync MosAIc project with Plane workspace
   */
  async syncProject(project: {
    name: string;
    description: string;
    tasks: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
    }>;
  }): Promise<void> {
    console.log(`Syncing project ${project.name} to Plane...`);
    
    // Get existing issues
    const existingIssues = await this.listIssues({
      labels: ['mosaic-sync']
    });
    
    const existingTitles = new Set(existingIssues.map(i => i.name));
    
    // Create missing tasks as issues
    for (const task of project.tasks) {
      if (!existingTitles.has(task.title)) {
        try {
          await this.createIssueFromTask({
            title: task.title,
            type: task.type,
            description: `MosAIc Task ID: ${task.id}\nStatus: ${task.status}`
          });
          console.log(`Created Plane issue for task: ${task.title}`);
        } catch (error) {
          console.error(`Failed to create issue for ${task.title}:`, error);
        }
      }
    }
    
    console.log('Project sync completed');
  }
  
  /**
   * Get Plane workspace info
   */
  async getWorkspaceInfo(): Promise<any> {
    const url = `${this.config.apiUrl}/api/v1/workspaces/${this.config.workspaceSlug}/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Convert to MCP backend configuration
   */
  toBackendConfig(): HTTPBackend {
    return {
      name: 'plane',
      url: `${this.config.apiUrl}/api/v1`,
      headers: this.headers,
      timeout: 30000
    };
  }
}