import winston from 'winston';
import { LogEntry } from '../types';

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  console: boolean;
  structured: boolean;
}

export class Logger {
  private logger: winston.Logger;
  private static instance: Logger;

  constructor(config: LoggerConfig) {
    const transports: winston.transport[] = [];

    // Console transport
    if (config.console) {
      transports.push(
        new winston.transports.Console({
          format: config.structured
            ? winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              )
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} [${level}] ${message}${metaStr}`;
                })
              )
        })
      );
    }

    // File transport
    if (config.file) {
      transports.push(
        new winston.transports.File({
          filename: config.file,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.level,
      transports,
      exitOnError: false
    });
  }

  static create(config: LoggerConfig): Logger {
    return new Logger(config);
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger({
        level: 'info',
        console: true,
        structured: false
      });
    }
    return Logger.instance;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const errorInfo = error ? {
      error_message: error.message || error,
      error_stack: error.stack,
      error_name: error.name,
      ...metadata
    } : metadata;

    this.logger.error(message, errorInfo);
  }

  logToolExecution(
    toolName: string,
    executionId: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'error',
      message: `Tool execution ${success ? 'completed' : 'failed'}: ${toolName}`,
      tool: toolName,
      execution_id: executionId,
      duration_ms: duration,
      metadata: {
        success,
        ...metadata
      }
    };

    if (success) {
      this.info(logEntry.message, {
        tool: logEntry.tool,
        execution_id: logEntry.execution_id,
        duration_ms: logEntry.duration_ms,
        ...logEntry.metadata
      });
    } else {
      this.error(logEntry.message, undefined, {
        tool: logEntry.tool,
        execution_id: logEntry.execution_id,
        duration_ms: logEntry.duration_ms,
        ...logEntry.metadata
      });
    }
  }

  createToolLogger(toolName: string, executionId: string) {
    return {
      debug: (message: string, metadata?: Record<string, any>) => {
        this.debug(`[${toolName}:${executionId}] ${message}`, metadata);
      },
      info: (message: string, metadata?: Record<string, any>) => {
        this.info(`[${toolName}:${executionId}] ${message}`, metadata);
      },
      warn: (message: string, metadata?: Record<string, any>) => {
        this.warn(`[${toolName}:${executionId}] ${message}`, metadata);
      },
      error: (message: string, error?: Error | any, metadata?: Record<string, any>) => {
        this.error(`[${toolName}:${executionId}] ${message}`, error, metadata);
      }
    };
  }

  // Performance tracking
  private timers = new Map<string, number>();

  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      this.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - start;
    this.timers.delete(label);
    return duration;
  }

  time<T>(label: string, fn: () => T): T;
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
  time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.startTimer(label);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = this.endTimer(label);
          this.debug(`Timer '${label}' completed`, { duration_ms: duration });
        });
      } else {
        const duration = this.endTimer(label);
        this.debug(`Timer '${label}' completed`, { duration_ms: duration });
        return result;
      }
    } catch (error) {
      const duration = this.endTimer(label);
      this.error(`Timer '${label}' failed`, error, { duration_ms: duration });
      throw error;
    }
  }

  // Structured logging for different event types
  logServerEvent(event: string, data?: Record<string, any>): void {
    this.info(`Server event: ${event}`, { event_type: 'server', ...data });
  }

  logToolEvent(toolName: string, event: string, data?: Record<string, any>): void {
    this.info(`Tool event: ${event}`, { event_type: 'tool', tool: toolName, ...data });
  }

  logDatabaseEvent(operation: string, table?: string, data?: Record<string, any>): void {
    this.info(`Database operation: ${operation}`, { 
      event_type: 'database', 
      operation, 
      table,
      ...data 
    });
  }

  logSecurityEvent(event: string, data?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, { event_type: 'security', ...data });
  }

  // Health check logging
  logHealthCheck(component: string, status: 'healthy' | 'unhealthy', details?: Record<string, any>): void {
    const level = status === 'healthy' ? 'info' : 'error';
    this.logger.log(level, `Health check: ${component} is ${status}`, {
      event_type: 'health_check',
      component,
      status,
      ...details
    });
  }

  // Metrics logging
  logMetrics(metrics: Record<string, number>): void {
    this.info('Performance metrics', { event_type: 'metrics', ...metrics });
  }

  // Request/response logging for debugging
  logRequest(method: string, data?: any): void {
    this.debug(`MCP Request: ${method}`, { 
      event_type: 'mcp_request',
      method,
      data: this.sanitizeLogData(data)
    });
  }

  logResponse(method: string, success: boolean, data?: any): void {
    this.debug(`MCP Response: ${method}`, { 
      event_type: 'mcp_response',
      method,
      success,
      data: this.sanitizeLogData(data)
    });
  }

  // Sanitize sensitive data from logs
  private sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // Close logger and flush any pending writes
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}