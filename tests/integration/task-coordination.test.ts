import { MockMCPServer } from '../utilities/MockMCPServer';
import { TestAgent, CoordinatorTestAgent, WorkerTestAgent, Task } from '../utilities/TestAgent';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';

describe('Task Coordination Workflow Tests', () => {
  let mockServer: MockMCPServer;
  let coordinator: CoordinatorTestAgent;
  let workers: WorkerTestAgent[];

  beforeAll(async () => {
    mockServer = new MockMCPServer(3457);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(async () => {
    mockServer.clearHistory();
    
    // Set up coordinator and workers
    coordinator = new CoordinatorTestAgent('task-coordinator');
    workers = [
      new WorkerTestAgent('worker-1', 'data-processing'),
      new WorkerTestAgent('worker-2', 'validation'),
      new WorkerTestAgent('worker-3', 'transformation')
    ];

    // Start all agents
    await coordinator.start();
    await Promise.all(workers.map(w => w.start()));
  });

  afterEach(async () => {
    await coordinator.stop();
    await Promise.all(workers.map(w => w.stop()));
  });

  describe('Basic Task Assignment', () => {
    it('should coordinate simple task assignment', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Register coordinator
      const coordinatorId = await registerAgent(client, coordinator);
      
      // Register workers
      const workerIds = await Promise.all(
        workers.map(w => registerAgent(client, w))
      );

      // Assign subordinates to coordinator
      for (const workerId of workerIds) {
        await coordinator.assignSubordinate(workerId);
      }

      // Create a task
      const task: Task = {
        id: uuidv4(),
        type: 'data-processing',
        description: 'Process test data',
        priority: 'high',
        status: 'pending'
      };

      // Track task delegation
      const taskDelegated = new Promise((resolve) => {
        workers[0].once('message-received', (message) => {
          if (message.content.type === 'task-assignment') {
            resolve(message.content.task);
          }
        });
      });

      // Delegate task
      await coordinator.delegateTask(task, workerIds[0]);

      const delegatedTask = await taskDelegated;
      expect(delegatedTask).toMatchObject({
        id: task.id,
        type: task.type,
        description: task.description
      });

      client.end();
    });

    it('should handle task completion workflow', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Set up agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerId = await registerAgent(client, workers[0]);
      await coordinator.assignSubordinate(workerId);

      // Create and process task
      const task: Task = {
        id: uuidv4(),
        type: 'calculate',
        description: 'Calculate metrics',
        priority: 'medium',
        status: 'pending'
      };

      // Process task
      const completedTask = await workers[0].processTask(task);

      expect(completedTask.status).toBe('completed');
      expect(completedTask.result).toBeDefined();
      expect(completedTask.startTime).toBeDefined();
      expect(completedTask.endTime).toBeDefined();

      // Verify worker metrics
      const metrics = workers[0].getMetrics();
      expect(metrics.completedTasks).toBe(1);
      expect(metrics.successRate).toBe(1);

      client.end();
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should coordinate parallel task execution', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Register all agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerIds = await Promise.all(
        workers.map(w => registerAgent(client, w))
      );

      // Assign all workers to coordinator
      for (const workerId of workerIds) {
        await coordinator.assignSubordinate(workerId);
      }

      // Create multiple tasks
      const tasks: Task[] = [
        {
          id: uuidv4(),
          type: 'data-processing',
          description: 'Process dataset A',
          priority: 'high',
          status: 'pending'
        },
        {
          id: uuidv4(),
          type: 'validation',
          description: 'Validate results',
          priority: 'medium',
          status: 'pending'
        },
        {
          id: uuidv4(),
          type: 'transformation',
          description: 'Transform output',
          priority: 'low',
          status: 'pending'
        }
      ];

      // Delegate tasks to appropriate workers
      const delegationPromises = tasks.map((task, index) => 
        coordinator.delegateTask(task, workerIds[index])
      );
      await Promise.all(delegationPromises);

      // Process all tasks in parallel
      const processingPromises = tasks.map((task, index) =>
        workers[index].processTask(task)
      );
      const completedTasks = await Promise.all(processingPromises);

      // Verify all tasks completed
      expect(completedTasks).toHaveLength(3);
      completedTasks.forEach(task => {
        expect(task.status).toBe('completed');
        expect(task.result).toBeDefined();
      });

      // Verify each worker processed exactly one task
      workers.forEach(worker => {
        const metrics = worker.getMetrics();
        expect(metrics.totalTasks).toBe(1);
        expect(metrics.completedTasks).toBe(1);
      });

      client.end();
    });

    it('should handle task dependencies', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Register agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerIds = await Promise.all(
        workers.map(w => registerAgent(client, w))
      );

      // Assign workers
      for (const workerId of workerIds) {
        await coordinator.assignSubordinate(workerId);
      }

      // Create dependent tasks
      const task1: Task = {
        id: uuidv4(),
        type: 'data-processing',
        description: 'Initial processing',
        priority: 'high',
        status: 'pending'
      };

      const task2: Task = {
        id: uuidv4(),
        type: 'validation',
        description: 'Validate processed data',
        priority: 'high',
        status: 'pending'
      };

      const task3: Task = {
        id: uuidv4(),
        type: 'transformation',
        description: 'Transform validated data',
        priority: 'medium',
        status: 'pending'
      };

      // Execute tasks in sequence (simulating dependencies)
      await coordinator.delegateTask(task1, workerIds[0]);
      const result1 = await workers[0].processTask(task1);
      expect(result1.status).toBe('completed');

      // Task 2 depends on task 1
      await coordinator.delegateTask(task2, workerIds[1]);
      const result2 = await workers[1].processTask(task2);
      expect(result2.status).toBe('completed');

      // Task 3 depends on task 2
      await coordinator.delegateTask(task3, workerIds[2]);
      const result3 = await workers[2].processTask(task3);
      expect(result3.status).toBe('completed');

      // Verify execution order through timestamps
      expect(result1.endTime!.getTime()).toBeLessThanOrEqual(result2.startTime!.getTime());
      expect(result2.endTime!.getTime()).toBeLessThanOrEqual(result3.startTime!.getTime());

      client.end();
    });
  });

  describe('Error Handling in Coordination', () => {
    it('should handle worker failures gracefully', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Create a worker with high failure rate
      const unreliableWorker = new WorkerTestAgent('unreliable-worker', 'processing');
      unreliableWorker['failureRate'] = 0.8; // 80% failure rate
      await unreliableWorker.start();

      // Register agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerId = await registerAgent(client, unreliableWorker);
      await coordinator.assignSubordinate(workerId);

      // Try to process multiple tasks
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: uuidv4(),
        type: 'processing' as const,
        description: `Task ${i}`,
        priority: 'medium' as const,
        status: 'pending' as const
      }));

      const results = await Promise.allSettled(
        tasks.map(task => 
          coordinator.delegateTask(task, workerId)
            .then(() => unreliableWorker.processTask(task))
        )
      );

      // Count successes and failures
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(failed).toBeGreaterThan(0); // Should have some failures
      expect(succeeded + failed).toBe(10); // All tasks should be accounted for

      // Verify worker tracked failures
      const metrics = unreliableWorker.getMetrics();
      expect(metrics.failedTasks).toBeGreaterThan(0);

      await unreliableWorker.stop();
      client.end();
    });

    it('should reassign failed tasks to other workers', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Set up one failing worker and one reliable worker
      const failingWorker = new WorkerTestAgent('failing-worker', 'processing');
      failingWorker['failureRate'] = 1.0; // Always fails
      const reliableWorker = new WorkerTestAgent('reliable-worker', 'processing');
      
      await failingWorker.start();
      await reliableWorker.start();

      // Register all agents
      const coordinatorId = await registerAgent(client, coordinator);
      const failingWorkerId = await registerAgent(client, failingWorker);
      const reliableWorkerId = await registerAgent(client, reliableWorker);
      
      await coordinator.assignSubordinate(failingWorkerId);
      await coordinator.assignSubordinate(reliableWorkerId);

      // Create task
      const task: Task = {
        id: uuidv4(),
        type: 'processing',
        description: 'Important task',
        priority: 'high',
        status: 'pending'
      };

      // Try with failing worker first
      await coordinator.delegateTask(task, failingWorkerId);
      
      let failedTask;
      try {
        await failingWorker.processTask(task);
      } catch (error) {
        failedTask = task;
      }

      expect(failedTask).toBeDefined();

      // Reassign to reliable worker
      await coordinator.delegateTask(failedTask!, reliableWorkerId);
      const completedTask = await reliableWorker.processTask(failedTask!);

      expect(completedTask.status).toBe('completed');
      expect(completedTask.assignedTo).toBe(reliableWorker.id);

      await failingWorker.stop();
      await reliableWorker.stop();
      client.end();
    });
  });

  describe('Load Balancing', () => {
    it('should distribute tasks based on worker load', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Create more workers for load balancing test
      const additionalWorkers = [
        new WorkerTestAgent('worker-4', 'data-processing'),
        new WorkerTestAgent('worker-5', 'data-processing')
      ];
      
      const allWorkers = [...workers, ...additionalWorkers];
      await Promise.all(additionalWorkers.map(w => w.start()));

      // Register all agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerIds = await Promise.all(
        allWorkers.map(w => registerAgent(client, w))
      );

      // Assign all workers
      for (const workerId of workerIds) {
        await coordinator.assignSubordinate(workerId);
      }

      // Create many tasks of the same type
      const taskCount = 20;
      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        id: uuidv4(),
        type: 'data-processing' as const,
        description: `Data batch ${i}`,
        priority: 'medium' as const,
        status: 'pending' as const
      }));

      // Distribute tasks round-robin
      const dataProcessingWorkers = allWorkers.filter(w => 
        w.capabilities.includes('data-processing')
      );
      
      for (let i = 0; i < tasks.length; i++) {
        const workerIndex = i % dataProcessingWorkers.length;
        const worker = dataProcessingWorkers[workerIndex];
        const workerId = workerIds[allWorkers.indexOf(worker)];
        
        await coordinator.delegateTask(tasks[i], workerId);
        await worker.processTask(tasks[i]);
      }

      // Verify load distribution
      dataProcessingWorkers.forEach(worker => {
        const metrics = worker.getMetrics();
        // Each worker should have processed roughly equal number of tasks
        expect(metrics.totalTasks).toBeGreaterThan(0);
        expect(Math.abs(metrics.totalTasks - (taskCount / dataProcessingWorkers.length))).toBeLessThanOrEqual(1);
      });

      await Promise.all(additionalWorkers.map(w => w.stop()));
      client.end();
    });
  });

  describe('Coordination Events', () => {
    it('should emit proper coordination events', async () => {
      const client = net.createConnection({ port: 3457 });
      const events: any[] = [];

      // Track all coordination events
      coordinator.on('subordinate-assigned', (event) => {
        events.push({ type: 'subordinate-assigned', ...event });
      });

      workers.forEach(worker => {
        worker.on('task-started', (event) => {
          events.push({ type: 'task-started', ...event });
        });
        worker.on('task-completed', (event) => {
          events.push({ type: 'task-completed', ...event });
        });
      });

      // Set up agents
      const coordinatorId = await registerAgent(client, coordinator);
      const workerId = await registerAgent(client, workers[0]);
      await coordinator.assignSubordinate(workerId);

      // Process a task
      const task: Task = {
        id: uuidv4(),
        type: 'calculate',
        description: 'Test calculation',
        priority: 'low',
        status: 'pending'
      };

      await coordinator.delegateTask(task, workerId);
      await workers[0].processTask(task);

      // Verify event sequence
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events[0].type).toBe('subordinate-assigned');
      expect(events.find(e => e.type === 'task-started')).toBeDefined();
      expect(events.find(e => e.type === 'task-completed')).toBeDefined();

      client.end();
    });
  });

  // Helper function
  async function registerAgent(client: net.Socket, agent: TestAgent): Promise<string> {
    return new Promise((resolve) => {
      const messageId = uuidv4();
      
      const handler = (data: Buffer) => {
        const response = JSON.parse(data.toString());
        if (response.id === messageId && response.result?.agentId) {
          client.removeListener('data', handler);
          resolve(response.result.agentId);
        }
      };

      client.on('data', handler);

      const registerMessage = {
        jsonrpc: '2.0',
        id: messageId,
        method: 'agent/register',
        params: {
          name: agent.name,
          role: agent.role,
          capabilities: agent.capabilities
        }
      };
      
      // Ensure connection before writing
      if (client.readyState === 'open') {
        client.write(JSON.stringify(registerMessage) + '\n');
      } else {
        client.once('connect', () => {
          client.write(JSON.stringify(registerMessage) + '\n');
        });
      }
    });
  }
});