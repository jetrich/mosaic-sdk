/**
 * UI Interfaces for OpenCode MosAIc Integration
 * Defines types and interfaces for the OpenCode user interface components
 */

export interface TaskStatus {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  priority: "high" | "medium" | "low";
  assignee?: string;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
}

export interface AgentStatus {
  id: string;
  type: string;
  name: string;
  status: "idle" | "active" | "busy" | "error" | "offline";
  currentTask?: string;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    averageTime: number; // in minutes
    successRate: number; // 0-1
    lastActive: Date;
  };
  resources: {
    cpu: number; // 0-100
    memory: number; // 0-100
    tokens: number; // remaining tokens
  };
}

export interface ProjectContext {
  id: string;
  name: string;
  path: string;
  status: "active" | "inactive" | "archived";
  agents: AgentStatus[];
  tasks: TaskStatus[];
  metadata: {
    language: string;
    framework?: string;
    lastActivity: Date;
    totalTasks: number;
    completedTasks: number;
  };
}

export interface CoordinationSession {
  id: string;
  strategy: "parallel" | "sequential" | "event-driven";
  agents: string[]; // agent IDs
  tasks: string[]; // task IDs
  status: "planning" | "executing" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  progress: {
    completed: number;
    total: number;
    currentPhase: string;
  };
}

export interface UITheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

export interface UIConfig {
  theme: UITheme;
  layout: {
    showSidebar: boolean;
    showTaskPanel: boolean;
    showAgentStatus: boolean;
    tabbed: boolean;
  };
  notifications: {
    enabled: boolean;
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    duration: number; // in milliseconds
  };
  realTime: {
    enabled: boolean;
    updateInterval: number; // in milliseconds
    maxRetries: number;
  };
}

export interface NotificationMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  actions?: NotificationAction[];
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: "primary" | "secondary" | "danger";
}

export interface CommandPalette {
  commands: Command[];
  shortcuts: Record<string, string>;
  recentCommands: string[];
}

export interface Command {
  id: string;
  label: string;
  description: string;
  category: "task" | "agent" | "project" | "system";
  shortcut?: string;
  icon?: string;
  action: () => Promise<void> | void;
  enabled: boolean;
}

export interface ProgressIndicator {
  type: "linear" | "circular" | "steps";
  value: number; // 0-100
  max?: number;
  steps?: ProgressStep[];
  animated: boolean;
  showPercentage: boolean;
}

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
}

export interface TaskCard {
  task: TaskStatus;
  expanded: boolean;
  actions: TaskAction[];
  showProgress: boolean;
  showAgent: boolean;
}

export interface TaskAction {
  id: string;
  label: string;
  icon?: string;
  action: (taskId: string) => Promise<void> | void;
  enabled: boolean;
  dangerous?: boolean;
}

export interface AgentCard {
  agent: AgentStatus;
  expanded: boolean;
  showMetrics: boolean;
  showTasks: boolean;
  actions: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  icon?: string;
  action: (agentId: string) => Promise<void> | void;
  enabled: boolean;
  requiresConfirmation?: boolean;
}

export interface StatusBar {
  items: StatusBarItem[];
  position: "top" | "bottom";
  visible: boolean;
}

export interface StatusBarItem {
  id: string;
  text: string;
  icon?: string;
  color?: string;
  tooltip?: string;
  action?: () => void;
  priority: number; // higher = more important
}

export interface Modal {
  id: string;
  title: string;
  content: any | string; // React.ReactNode equivalent
  size: "small" | "medium" | "large" | "fullscreen";
  closable: boolean;
  actions?: ModalAction[];
  onClose?: () => void;
}

export interface ModalAction {
  label: string;
  action: () => Promise<void> | void;
  style: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
}

export interface TabPanel {
  id: string;
  title: string;
  icon?: string;
  content: any; // React.ReactNode equivalent
  closable: boolean;
  modified?: boolean;
  active: boolean;
}

export interface Sidebar {
  visible: boolean;
  width: number;
  position: "left" | "right";
  sections: SidebarSection[];
  collapsible: boolean;
  collapsed: boolean;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: string;
  content: any; // React.ReactNode equivalent
  collapsible: boolean;
  collapsed: boolean;
  order: number;
}

// Event types for real-time updates
export interface UIEvent {
  type: string;
  timestamp: Date;
  data: any;
}

export interface TaskUpdateEvent extends UIEvent {
  type: "task_update";
  data: {
    taskId: string;
    changes: Partial<TaskStatus>;
  };
}

export interface AgentUpdateEvent extends UIEvent {
  type: "agent_update";
  data: {
    agentId: string;
    changes: Partial<AgentStatus>;
  };
}

export interface ProjectUpdateEvent extends UIEvent {
  type: "project_update";
  data: {
    projectId: string;
    changes: Partial<ProjectContext>;
  };
}

export interface NotificationEvent extends UIEvent {
  type: "notification";
  data: NotificationMessage;
}

// Hook interfaces for React components
export interface UseTasksHook {
  tasks: TaskStatus[];
  loading: boolean;
  error: string | null;
  createTask: (
    task: Omit<TaskStatus, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskStatus>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, agentId: string) => Promise<void>;
}

export interface UseAgentsHook {
  agents: AgentStatus[];
  loading: boolean;
  error: string | null;
  spawnAgent: (type: string, config?: any) => Promise<string>;
  terminateAgent: (id: string) => Promise<void>;
  coordinateAgents: (
    agentIds: string[],
    strategy: CoordinationSession["strategy"],
  ) => Promise<string>;
}

export interface UseProjectHook {
  project: ProjectContext | null;
  loading: boolean;
  error: string | null;
  switchProject: (projectId: string) => Promise<void>;
  refreshProject: () => Promise<void>;
}

export interface UseNotificationsHook {
  notifications: NotificationMessage[];
  addNotification: (
    notification: Omit<NotificationMessage, "id" | "timestamp">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface UseRealTimeHook {
  connected: boolean;
  lastUpdate: Date | null;
  subscribe: (
    eventType: string,
    handler: (event: UIEvent) => void,
  ) => () => void;
  unsubscribe: (eventType: string) => void;
}
