import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface AgentConfig {
  name: string;
  role: string;
  capabilities: string[];
  responseTime?: number;
  failureRate?: number;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedTo?: string;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export class TestAgent extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly role: string;
  public readonly capabilities: string[];
  
  private tasks: Map<string, Task> = new Map();
  private responseTime: number;
  private failureRate: number;
  private isActive: boolean = false;
  private messageLog: any[] = [];

  constructor(config: AgentConfig) {
    super();
    this.id = uuidv4();
    this.name = config.name;
    this.role = config.role;
    this.capabilities = config.capabilities;
    this.responseTime = config.responseTime || 100;
    this.failureRate = config.failureRate || 0;
  }

  async start(): Promise<void> {
    this.isActive = true;
    this.emit('agent-started', {
      id: this.id,
      name: this.name,
      role: this.role
    });
  }

  async stop(): Promise<void> {
    this.isActive = false;
    
    // Complete any pending tasks
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'in-progress') {
        task.status = 'failed';
        task.error = 'Agent stopped';
        task.endTime = new Date();
      }
    }
    
    this.emit('agent-stopped', {
      id: this.id,
      completedTasks: this.getCompletedTasks().length,
      failedTasks: this.getFailedTasks().length
    });
  }

  async processTask(task: Task): Promise<Task> {
    if (!this.isActive) {
      throw new Error('Agent is not active');
    }

    task.assignedTo = this.id;
    task.status = 'in-progress';
    task.startTime = new Date();
    this.tasks.set(task.id, task);

    this.emit('task-started', { agentId: this.id, task });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, this.responseTime));

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      task.status = 'failed';
      task.error = 'Simulated task failure';
      task.endTime = new Date();
      this.emit('task-failed', { agentId: this.id, task });
      throw new Error(task.error);
    }

    // Process based on task type
    const result = await this.executeTask(task);
    
    task.status = 'completed';
    task.result = result;
    task.endTime = new Date();
    
    this.emit('task-completed', { agentId: this.id, task });
    return task;
  }

  private async executeTask(task: Task): Promise<any> {
    switch (task.type) {
      case 'calculate':
        return { result: Math.random() * 1000 };
      
      case 'validate':
        return { valid: Math.random() > 0.5 };
      
      case 'transform':
        return { transformed: `${task.description}_transformed` };
      
      case 'coordinate':
        return { 
          coordinatedAgents: Math.floor(Math.random() * 5) + 1,
          status: 'coordinated'
        };
      
      default:
        return { completed: true };
    }
  }

  async sendMessage(to: string, content: any): Promise<void> {
    const message = {
      id: uuidv4(),
      from: this.id,
      to,
      content,
      timestamp: new Date()
    };

    this.messageLog.push(message);
    this.emit('message-sent', message);
  }

  async receiveMessage(from: string, content: any): Promise<void> {
    const message = {
      id: uuidv4(),
      from,
      to: this.id,
      content,
      timestamp: new Date()
    };

    this.messageLog.push(message);
    this.emit('message-received', message);

    // Process message based on content
    if (content.type === 'task-assignment') {
      await this.processTask(content.task);
    }
  }

  // Utility methods for testing
  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getCompletedTasks(): Task[] {
    return this.getTasks().filter(t => t.status === 'completed');
  }

  getFailedTasks(): Task[] {
    return this.getTasks().filter(t => t.status === 'failed');
  }

  getMessageLog(): any[] {
    return [...this.messageLog];
  }

  clearHistory(): void {
    this.tasks.clear();
    this.messageLog = [];
  }

  // Performance metrics
  getMetrics() {
    const tasks = this.getTasks();
    const completed = this.getCompletedTasks();
    const failed = this.getFailedTasks();
    
    const avgResponseTime = completed.length > 0
      ? completed.reduce((sum, task) => {
          const duration = task.endTime!.getTime() - task.startTime!.getTime();
          return sum + duration;
        }, 0) / completed.length
      : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      successRate: tasks.length > 0 ? completed.length / tasks.length : 0,
      averageResponseTime: avgResponseTime,
      uptime: this.isActive ? Date.now() : 0
    };
  }
}

// Specialized test agents
export class CoordinatorTestAgent extends TestAgent {
  private subordinates: Set<string> = new Set();

  constructor(name: string) {
    super({
      name,
      role: 'coordinator',
      capabilities: ['coordinate', 'delegate', 'monitor', 'report']
    });
  }

  async assignSubordinate(agentId: string): Promise<void> {
    this.subordinates.add(agentId);
    this.emit('subordinate-assigned', { coordinatorId: this.id, subordinateId: agentId });
  }

  async delegateTask(task: Task, agentId: string): Promise<void> {
    if (!this.subordinates.has(agentId)) {
      throw new Error('Agent is not a subordinate');
    }

    await this.sendMessage(agentId, {
      type: 'task-assignment',
      task
    });
  }

  getSubordinates(): string[] {
    return Array.from(this.subordinates);
  }
}

export class WorkerTestAgent extends TestAgent {
  constructor(name: string, specialization: string) {
    super({
      name,
      role: 'worker',
      capabilities: [specialization, 'execute', 'report']
    });
  }
}