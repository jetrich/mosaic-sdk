// Core MCP types
export interface MCPServerConfig {
  server: {
    name: string;
    version: string;
    description: string;
  };
  transport: {
    type: 'stdio' | 'sse' | 'http' | 'websocket';
    port?: number | undefined;
    host?: string | undefined;
    timeout: number;
    cors?: {
      origin?: string | string[] | boolean;
      credentials?: boolean;
      methods?: string[];
      allowedHeaders?: string[];
      exposedHeaders?: string[];
    };
  };
  tools: {
    task_management: ToolConfig;
    project_coordination: ToolConfig;
    agent_orchestration: ToolConfig;
  };
  storage: {
    type: 'sqlite' | 'postgresql';
    connection_string: string;
    migrations_path: string;
    backup_enabled: boolean;
    backup_interval: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
    console: boolean;
    structured: boolean;
  };
  security: {
    max_concurrent_tools: number;
    tool_timeout: number;
    rate_limiting: {
      enabled: boolean;
      requests_per_minute: number;
    };
  };
}

export interface ToolConfig {
  enabled: boolean;
  namespace: string;
  rate_limit?: number | undefined;
  permissions?: string[] | undefined;
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  console: boolean;
  structured: boolean;
}

// Task management types
export type TaskType = 'epic' | 'feature' | 'story' | 'task' | 'subtask' | 'atomic';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  parent_id?: string | undefined;
  assignee?: string | undefined;
  estimated_hours?: number | undefined;
  actual_hours?: number;
  due_date?: Date | undefined;
  completed_date?: Date | undefined;
  labels: string[];
  dependencies: string[];
  created_at: Date;
  updated_at: Date;
  created_by: string;
  project_id: string;
}

// Project management types
export type ProjectStatus = 'active' | 'completed' | 'archived' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner: string;
  team_members: string[];
  created_at: Date;
  updated_at: Date;
  config: ProjectConfig;
  stats: ProjectStats;
}

export interface ProjectConfig {
  default_agent_model: string;
  max_concurrent_agents: number;
  task_auto_assignment: boolean;
  notification_preferences: NotificationConfig;
}

export interface ProjectStats {
  total_tasks: number;
  completed_tasks: number;
  active_agents: number;
  total_hours_spent: number;
  completion_rate: number;
}

export interface NotificationConfig {
  email_enabled: boolean;
  slack_enabled: boolean;
  task_updates: boolean;
  agent_alerts: boolean;
}

// Project status report types
export interface ProjectStatusReport {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
    owner: string;
    created_at: Date;
    updated_at: Date;
  };
  
  task_statistics: {
    total: number;
    by_status: Record<TaskStatus, number>;
    by_type: Record<TaskType, number>;
    by_priority: Record<Priority, number>;
    overdue: number;
    due_today: number;
    due_this_week: number;
  };
  
  agent_activity: {
    active_agents: string[];
    tasks_by_agent: Record<string, number>;
    recent_completions: Array<{
      task_id: string;
      task_title: string;
      completed_by: string;
      completed_at: Date;
    }>;
  };
  
  project_health: {
    completion_rate: number;  // percentage
    on_time_rate: number;     // percentage
    blocked_tasks: number;
    critical_path_length: number;
    estimated_completion: Date | null;
  };
  
  recent_activity: Array<{
    timestamp: Date;
    type: 'task_created' | 'task_completed' | 'task_updated' | 'agent_assigned';
    description: string;
    actor?: string;
  }>;
}

// Task dependency types
export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocks' | 'depends_on';
  created_at: Date;
  created_by?: string | undefined;
  notes?: string | undefined;
}

// Agent management types
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'completed' | 'failed';

export interface Agent {
  id: string;
  persona: string;
  status: AgentStatus;
  current_task?: string;
  model: string;
  tools: string[];
  created_at: Date;
  last_activity: Date;
  context: AgentContext;
  metrics: AgentMetrics;
}

export interface AgentContext {
  project_id: string;
  task_queue: string[];
  conversation_history: Message[];
  state_data: Record<string, any>;
}

export interface AgentMetrics {
  tasks_completed: number;
  average_completion_time: number;
  success_rate: number;
  last_error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Agent communication types
export type MessageType = 'direct' | 'broadcast' | 'handoff' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface AgentMessage {
  id: string;
  from_agent_id: string;
  to_agent_id?: string;
  message_type: MessageType;
  subject?: string;
  content: string;
  metadata: Record<string, any>;
  status: MessageStatus;
  created_at: Date;
  delivered_at?: Date;
  read_at?: Date;
}

export type HandoffType = 'complete' | 'partial' | 'emergency';
export type HandoffStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface AgentHandoff {
  id: string;
  task_id: string;
  from_agent_id: string;
  to_agent_id: string;
  handoff_type: HandoffType;
  context_data: Record<string, any>;
  status: HandoffStatus;
  initiated_at: Date;
  completed_at?: Date;
  notes?: string;
}

// Tool response types
export interface ToolResponse {
  title: string;
  metadata: {
    operation: string;
    status: 'success' | 'error' | 'warning';
    data?: any;
    timestamp: string;
    execution_time_ms: number;
  };
  output: string;
}

// MCP specific types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<ToolResponse>;
}

export interface MCPMetrics {
  tool_execution_time: Map<string, number[]>;
  tool_execution_count: Map<string, number>;
  tool_error_rate: Map<string, number>;
  memory_usage: number;
  cpu_usage: number;
  storage_usage: number;
  active_tasks: number;
  active_agents: number;
  completion_rate: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  tool?: string;
  execution_id?: string;
  duration_ms?: number;
  metadata: Record<string, any>;
}

// Error types
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class DatabaseError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ToolExecutionError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'TOOL_EXECUTION_ERROR', details);
    this.name = 'ToolExecutionError';
  }
}

// Workflow orchestration types
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';
export type WorkflowTrigger = 'manual' | 'scheduled' | 'event' | 'dependency';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  agent_id?: string;
  agent_persona?: string;
  task_ids: string[];
  dependencies: string[]; // step IDs this step depends on
  parallel_group?: string; // steps with same group can run in parallel
  timeout_minutes?: number;
  retry_count?: number;
  status: StepStatus;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  output?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  project_id: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: Record<string, any>; // workflow-level variables
  schedule?: string; // cron expression for scheduled workflows
  timeout_minutes?: number;
  max_retries?: number;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
  created_by: string;
  current_step?: string;
  progress: WorkflowProgress;
}

export interface WorkflowProgress {
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  current_parallel_group?: string;
  estimated_completion?: Date;
  completion_percentage: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  execution_number: number;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  triggered_by: string;
  started_at: Date;
  completed_at?: Date;
  context: Record<string, any>;
  step_executions: StepExecution[];
  error_message?: string;
  retry_count: number;
}

export interface StepExecution {
  id: string;
  workflow_execution_id: string;
  step_id: string;
  status: StepStatus;
  agent_id?: string;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  logs: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  template_data: Omit<Workflow, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'created_by'>;
  created_at: Date;
  created_by: string;
  version: string;
  is_public: boolean;
}