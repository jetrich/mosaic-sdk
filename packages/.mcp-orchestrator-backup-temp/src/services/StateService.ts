import * as sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import * as path from 'path';
import { MCPServerConfig, DatabaseError } from '../types';
import { Logger } from '../utils/Logger';

export class StateService {
  private db: sqlite3.Database | null = null;
  private config: MCPServerConfig;
  private logger: Logger;
  private initialized = false;

  constructor(config: MCPServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing StateService...', {
        storage_type: this.config.storage.type,
        connection_string: this.config.storage.connection_string
      });

      if (this.config.storage.type === 'sqlite') {
        await this.initializeSQLite();
      } else {
        throw new DatabaseError(`Unsupported storage type: ${this.config.storage.type}`);
      }

      await this.runMigrations();
      this.initialized = true;

      this.logger.logDatabaseEvent('initialized', undefined, {
        storage_type: this.config.storage.type
      });

    } catch (error) {
      this.logger.error('Failed to initialize StateService', error);
      throw error;
    }
  }

  private async initializeSQLite(): Promise<void> {
    const dbPath = this.config.storage.connection_string;
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    await fs.mkdir(dbDir, { recursive: true });

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(new DatabaseError(`Failed to open SQLite database: ${err.message}`, err));
        } else {
          this.logger.debug('SQLite database opened', { path: dbPath });
          resolve();
        }
      });
    });
  }

  private async runMigrations(): Promise<void> {
    this.logger.info('Running database migrations...');

    const migrations = [
      this.createTasksTable,
      this.createProjectsTable,
      this.createAgentsTable,
      this.createTaskDependenciesTable,
      this.createMetricsTable,
      this.createAgentMessagesTable,
      this.createAgentHandoffsTable,
      this.createWorkflowsTable,
      this.createWorkflowExecutionsTable,
      this.createStepExecutionsTable
    ];

    for (const migration of migrations) {
      await migration.call(this);
    }

    this.logger.info('Database migrations completed');
  }

  private async createTasksTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('epic', 'feature', 'story', 'task', 'subtask', 'atomic')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        parent_id TEXT,
        assignee TEXT,
        estimated_hours REAL,
        actual_hours REAL,
        due_date TEXT,
        completed_date TEXT,
        labels TEXT, -- JSON array
        dependencies TEXT, -- JSON array
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        project_id TEXT NOT NULL,
        domain_category INTEGER CHECK (domain_category IN (0,1,2,3,4,5,6,7,8,9)), -- CLAUDE.md domain categorization
        hierarchical_id TEXT, -- Human-readable hierarchical ID for display/search
        FOREIGN KEY (parent_id) REFERENCES tasks(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'tasks', { action: 'create_table' });
  }

  private async createProjectsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
        owner TEXT NOT NULL,
        team_members TEXT, -- JSON array
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        config TEXT, -- JSON object
        stats TEXT, -- JSON object
        domain_category INTEGER CHECK (domain_category IN (0,1,2,3,4,5,6,7,8,9)), -- CLAUDE.md domain categorization
        epic_id TEXT -- Primary epic ID for this project (E.0001, E.1001, etc.)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'projects', { action: 'create_table' });
  }

  private async createAgentsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        persona TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('idle', 'working', 'waiting', 'completed', 'failed')),
        current_task TEXT,
        model TEXT NOT NULL,
        tools TEXT, -- JSON array
        created_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        context TEXT, -- JSON object
        metrics TEXT, -- JSON object
        FOREIGN KEY (current_task) REFERENCES tasks(id)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'agents', { action: 'create_table' });
  }

  private async createTaskDependenciesTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        depends_on TEXT NOT NULL,
        dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks', 'depends_on', 'requires', 'relates_to')),
        created_at TEXT NOT NULL,
        created_by TEXT,
        notes TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (depends_on) REFERENCES tasks(id),
        UNIQUE(task_id, depends_on)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'task_dependencies', { action: 'create_table' });
  }

  private async createMetricsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS metrics (
        id TEXT PRIMARY KEY,
        metric_type TEXT NOT NULL,
        entity_id TEXT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metadata TEXT, -- JSON object
        timestamp TEXT NOT NULL
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'metrics', { action: 'create_table' });
  }

  private async createAgentMessagesTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS agent_messages (
        id TEXT PRIMARY KEY,
        from_agent_id TEXT NOT NULL,
        to_agent_id TEXT,
        message_type TEXT NOT NULL CHECK (message_type IN ('direct', 'broadcast', 'handoff', 'system')),
        subject TEXT,
        content TEXT NOT NULL,
        metadata TEXT, -- JSON object
        status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
        created_at TEXT NOT NULL,
        delivered_at TEXT,
        read_at TEXT,
        FOREIGN KEY (from_agent_id) REFERENCES agents(id),
        FOREIGN KEY (to_agent_id) REFERENCES agents(id)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'agent_messages', { action: 'create_table' });
  }

  private async createAgentHandoffsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS agent_handoffs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        from_agent_id TEXT NOT NULL,
        to_agent_id TEXT NOT NULL,
        handoff_type TEXT NOT NULL CHECK (handoff_type IN ('complete', 'partial', 'emergency')),
        context_data TEXT, -- JSON object
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
        initiated_at TEXT NOT NULL,
        completed_at TEXT,
        notes TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (from_agent_id) REFERENCES agents(id),
        FOREIGN KEY (to_agent_id) REFERENCES agents(id)
      )
    `;

    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'agent_handoffs', { action: 'create_table' });
  }

  async run(sql: string, params?: any[]): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params || [], function(err) {
        if (err) {
          reject(new DatabaseError(`SQL execution failed: ${err.message}`, err));
        } else {
          resolve();
        }
      });
    });
  }

  async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params || [], (err, row) => {
        if (err) {
          reject(new DatabaseError(`SQL query failed: ${err.message}`, err));
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params || [], (err, rows) => {
        if (err) {
          reject(new DatabaseError(`SQL query failed: ${err.message}`, err));
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async insert(table: string, data: Record<string, any>): Promise<string> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    await this.run(sql, values);
    
    // Return the last inserted row ID
    const result = await this.get<{ id: string }>('SELECT last_insert_rowid() as id');
    return result?.['id'] || data['id'];
  }

  async update(table: string, id: string, data: Record<string, any>): Promise<void> {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...columns.map(col => data[col]), id];

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    await this.run(sql, values);
  }

  async delete(table: string, id: string): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await this.run(sql, [id]);
  }

  async exists(table: string, id: string): Promise<boolean> {
    const sql = `SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`;
    const result = await this.get(sql, [id]);
    return !!result;
  }

  async count(table: string, where?: string, params?: any[]): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${table}${where ? ` WHERE ${where}` : ''}`;
    const result = await this.get<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  // Transaction support
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    await this.run('BEGIN TRANSACTION');
    
    try {
      const result = await fn();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // Backup functionality
  async backup(): Promise<string> {
    if (!this.config.storage.backup_enabled) {
      throw new DatabaseError('Backup is not enabled in configuration');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.config.storage.connection_string}.backup.${timestamp}`;
    
    try {
      await fs.copyFile(this.config.storage.connection_string, backupPath);
      this.logger.logDatabaseEvent('backup', undefined, { backup_path: backupPath });
      return backupPath;
    } catch (error) {
      throw new DatabaseError(`Backup failed: ${(error as Error).message}`, error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      if (!this.db || !this.initialized) {
        return { status: 'unhealthy', details: { error: 'Database not initialized' } };
      }

      // Test database connectivity
      await this.get('SELECT 1');

      // Check table existence
      const tables = await this.all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );

      const expectedTables = ['tasks', 'projects', 'agents', 'task_dependencies', 'metrics', 'agent_messages', 'agent_handoffs'];
      const existingTables = tables.map(t => t.name);
      const missingTables = expectedTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        return { 
          status: 'unhealthy', 
          details: { error: 'Missing tables', missing_tables: missingTables } 
        };
      }

      return { 
        status: 'healthy', 
        details: { 
          tables: existingTables.length,
          initialized: this.initialized
        } 
      };

    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { error: (error as Error).message } 
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            this.logger.error('Error closing database', err);
          } else {
            this.logger.debug('Database closed');
          }
          this.db = null;
          this.initialized = false;
          resolve();
        });
      });
    }
  }

  isInitialized(): boolean {
    return this.initialized && !!this.db;
  }

  // Utility methods for JSON columns
  parseJsonColumn<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  stringifyJsonColumn(value: any): string {
    return JSON.stringify(value || null);
  }

  // Workflow migration methods
  private async createWorkflowsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        project_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
        trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'event', 'dependency')) DEFAULT 'manual',
        steps TEXT NOT NULL, -- JSON array of WorkflowStep objects
        variables TEXT, -- JSON object for workflow variables
        schedule TEXT, -- cron expression for scheduled workflows
        timeout_minutes INTEGER,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        created_by TEXT NOT NULL,
        current_step TEXT, -- current step ID being executed
        progress TEXT, -- JSON object for WorkflowProgress
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `;
    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'workflows', { action: 'create_table' });
  }

  private async createWorkflowExecutionsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        execution_number INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
        trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'event', 'dependency')),
        triggered_by TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        context TEXT, -- JSON object for execution context
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id),
        UNIQUE(workflow_id, execution_number)
      )
    `;
    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'workflow_executions', { action: 'create_table' });
  }

  private async createStepExecutionsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS step_executions (
        id TEXT PRIMARY KEY,
        workflow_execution_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
        agent_id TEXT,
        started_at TEXT,
        completed_at TEXT,
        duration_ms INTEGER,
        input TEXT, -- JSON object for step input
        output TEXT, -- JSON object for step output
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        logs TEXT, -- JSON array of log messages
        FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id),
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `;
    await this.run(sql);
    this.logger.logDatabaseEvent('migration', 'step_executions', { action: 'create_table' });
  }
}