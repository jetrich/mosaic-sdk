import React from 'react';
import { Navigation, DocumentationLayout, ApiReference } from '../components';
import './ApiReferencePage.css';

const navItems = [
  { label: 'Documentation', href: '/docs' },
  { label: 'API Reference', href: '/docs/api', active: true },
  { label: 'Examples', href: '/examples' },
  { label: 'GitHub', href: 'https://github.com/mosaic' }
];

const sidebarItems = [
  {
    id: 'client',
    title: 'MosAIc Client',
    children: [
      { id: 'client-overview', title: 'Overview', href: '/docs/api/client' },
      { id: 'client-config', title: 'Configuration', href: '/docs/api/client/config' },
      { id: 'client-auth', title: 'Authentication', href: '/docs/api/client/auth' }
    ]
  },
  {
    id: 'agents',
    title: 'Agent Management',
    children: [
      { id: 'agents-create', title: 'Create Agent', href: '/docs/api/agents/create' },
      { id: 'agents-list', title: 'List Agents', href: '/docs/api/agents/list' },
      { id: 'agents-manage', title: 'Manage Agents', href: '/docs/api/agents/manage' }
    ]
  },
  {
    id: 'tasks',
    title: 'Task Execution',
    children: [
      { id: 'tasks-execute', title: 'Execute Task', href: '/docs/api/tasks/execute' },
      { id: 'tasks-monitor', title: 'Monitor Tasks', href: '/docs/api/tasks/monitor' },
      { id: 'tasks-results', title: 'Task Results', href: '/docs/api/tasks/results' }
    ]
  }
];

const breadcrumbs = [
  { label: 'Documentation', href: '/docs' },
  { label: 'API Reference' }
];

// API Methods Data
const apiMethods = [
  {
    id: 'mosaic-constructor',
    name: 'new MosAIc()',
    description: 'Creates a new MosAIc client instance with the provided configuration.',
    signature: 'new MosAIc(config?: MosAIcConfig)',
    category: 'client',
    parameters: [
      {
        name: 'config',
        type: 'MosAIcConfig',
        required: false,
        description: 'Configuration object for the MosAIc client. If not provided, will use environment variables or defaults.',
        defaultValue: '{}'
      }
    ],
    returnType: 'MosAIc',
    returnDescription: 'A new MosAIc client instance ready for use.',
    example: `import { MosAIc } from '@mosaic/sdk';

// Using environment variables
const mosaic = new MosAIc();

// With custom configuration
const mosaicWithConfig = new MosAIc({
  apiKey: 'your-api-key',
  environment: 'production',
  defaultModel: 'claude-3-opus'
});

console.log('MosAIc client initialized');`,
    version: '0.1.0'
  },
  {
    id: 'create-agent',
    name: 'createAgent()',
    description: 'Creates a new AI agent with specified capabilities and configuration.',
    signature: 'async createAgent(options: AgentCreateOptions): Promise<Agent>',
    category: 'agents',
    parameters: [
      {
        name: 'options',
        type: 'AgentCreateOptions',
        required: true,
        description: 'Configuration options for the new agent including name, capabilities, and model preferences.'
      },
      {
        name: 'options.name',
        type: 'string',
        required: true,
        description: 'Unique name for the agent.'
      },
      {
        name: 'options.capabilities',
        type: 'string[]',
        required: true,
        description: 'Array of capabilities the agent should have (e.g., "code-generation", "testing").'
      },
      {
        name: 'options.model',
        type: 'string',
        required: false,
        description: 'AI model to use for this agent.',
        defaultValue: 'claude-3-sonnet'
      }
    ],
    returnType: 'Promise<Agent>',
    returnDescription: 'Promise that resolves to the created Agent instance.',
    example: `const agent = await mosaic.createAgent({
  name: 'CodeReviewer',
  capabilities: ['code-review', 'security-audit', 'documentation'],
  model: 'claude-3-opus',
  description: 'An agent specialized in code review and security auditing'
});

console.log('Agent created:', agent.id);`,
    version: '0.1.0'
  },
  {
    id: 'execute-task',
    name: 'execute()',
    description: 'Executes a task using the specified agent with the given parameters.',
    signature: 'async execute(taskOptions: TaskExecutionOptions): Promise<TaskResult>',
    category: 'tasks',
    parameters: [
      {
        name: 'taskOptions',
        type: 'TaskExecutionOptions',
        required: true,
        description: 'Options defining the task to execute.'
      },
      {
        name: 'taskOptions.agentId',
        type: 'string',
        required: true,
        description: 'ID of the agent to execute the task.'
      },
      {
        name: 'taskOptions.task',
        type: 'string',
        required: true,
        description: 'Description of the task to perform.'
      },
      {
        name: 'taskOptions.context',
        type: 'Record<string, any>',
        required: false,
        description: 'Additional context data for the task.',
        defaultValue: '{}'
      }
    ],
    returnType: 'Promise<TaskResult>',
    returnDescription: 'Promise that resolves to the task execution result.',
    example: `const result = await mosaic.execute({
  agentId: agent.id,
  task: 'Review this TypeScript code for potential security vulnerabilities',
  context: {
    language: 'typescript',
    framework: 'express',
    codeContent: sourceCode
  }
});

console.log('Task completed:', result.status);
console.log('Result:', result.output);`,
    version: '0.1.0'
  },
  {
    id: 'list-agents',
    name: 'listAgents()',
    description: 'Retrieves a list of all agents associated with the current project.',
    signature: 'async listAgents(options?: ListAgentsOptions): Promise<Agent[]>',
    category: 'agents',
    parameters: [
      {
        name: 'options',
        type: 'ListAgentsOptions',
        required: false,
        description: 'Optional filtering and sorting options.'
      },
      {
        name: 'options.status',
        type: 'AgentStatus',
        required: false,
        description: 'Filter agents by status (active, inactive, archived).'
      },
      {
        name: 'options.capability',
        type: 'string',
        required: false,
        description: 'Filter agents by specific capability.'
      }
    ],
    returnType: 'Promise<Agent[]>',
    returnDescription: 'Promise that resolves to an array of Agent objects.',
    example: `// List all agents
const allAgents = await mosaic.listAgents();

// List only active agents with code-review capability
const reviewAgents = await mosaic.listAgents({
  status: 'active',
  capability: 'code-review'
});

console.log('Found agents:', allAgents.length);`,
    version: '0.1.0'
  },
  {
    id: 'get-status',
    name: 'getStatus()',
    description: 'Retrieves the current status and health information of the MosAIc service.',
    signature: 'async getStatus(): Promise<ServiceStatus>',
    category: 'client',
    parameters: [],
    returnType: 'Promise<ServiceStatus>',
    returnDescription: 'Promise that resolves to the current service status information.',
    example: `try {
  const status = await mosaic.getStatus();
  
  console.log('Service status:', status.status);
  console.log('Version:', status.version);
  console.log('Uptime:', status.uptime);
  
  if (status.status === 'operational') {
    console.log('✅ MosAIc is ready');
  }
} catch (error) {
  console.error('❌ Service unavailable');
}`,
    version: '0.1.0'
  },
  {
    id: 'monitor-task',
    name: 'monitorTask()',
    description: 'Monitors the progress of a running task and provides real-time updates.',
    signature: 'async monitorTask(taskId: string): Promise<TaskMonitor>',
    category: 'tasks',
    parameters: [
      {
        name: 'taskId',
        type: 'string',
        required: true,
        description: 'Unique identifier of the task to monitor.'
      }
    ],
    returnType: 'Promise<TaskMonitor>',
    returnDescription: 'Promise that resolves to a TaskMonitor instance for tracking progress.',
    example: `const monitor = await mosaic.monitorTask(taskResult.taskId);

monitor.onProgress((progress) => {
  console.log('Progress:', progress.percentage + '%');
  console.log('Current step:', progress.currentStep);
});

monitor.onComplete((result) => {
  console.log('Task completed:', result.status);
});

monitor.onError((error) => {
  console.error('Task failed:', error.message);
});`,
    version: '0.1.0'
  }
];

export const ApiReferencePage: React.FC = () => {
  return (
    <div className="api-reference-page">
      <Navigation 
        items={navItems}
        version="v0.1.0"
        onCommandPalette={() => console.log('Command palette opened')}
      />

      <DocumentationLayout
        sidebar={sidebarItems}
        breadcrumbs={breadcrumbs}
        currentVersion="v0.1.0"
        versions={['v0.1.0', 'v0.0.9', 'v0.0.8']}
      >
        <div className="api-reference-content">
          <ApiReference methods={apiMethods} />
        </div>
      </DocumentationLayout>
    </div>
  );
};