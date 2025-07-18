/**
 * @fileoverview Centralized logging utility for MCP tools
 * @module @mosaic/mcp-common/utils
 */

import winston from 'winston';

/**
 * Centralized logger configuration for MCP tools
 */
export class Logger {
  private static loggers: Map<string, winston.Logger> = new Map();
  private static defaultLevel = process.env.LOG_LEVEL || 'info';
  private static defaultFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  /**
   * Get or create a logger instance for a specific service
   */
  static getLogger(service: string): winston.Logger {
    if (this.loggers.has(service)) {
      return this.loggers.get(service)!;
    }

    const logger = winston.createLogger({
      level: this.defaultLevel,
      format: this.defaultFormat,
      defaultMeta: { service },
      transports: this.createTransports(),
    });

    this.loggers.set(service, logger);
    return logger;
  }

  /**
   * Create default transports
   */
  private static createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    } else {
      // JSON console for production
      transports.push(
        new winston.transports.Console({
          format: this.defaultFormat,
        })
      );
    }

    // File transport for persistent logging
    if (process.env.LOG_FILE) {
      transports.push(
        new winston.transports.File({
          filename: process.env.LOG_FILE,
          format: this.defaultFormat,
        })
      );
    }

    return transports;
  }

  /**
   * Configure global logging settings
   */
  static configure(options: {
    level?: string;
    format?: winston.Logform.Format;
    transports?: winston.transport[];
  }): void {
    if (options.level) {
      this.defaultLevel = options.level;
    }

    if (options.format) {
      this.defaultFormat = options.format;
    }

    // Update existing loggers
    this.loggers.forEach((logger) => {
      logger.level = this.defaultLevel;
      logger.format = this.defaultFormat;

      if (options.transports) {
        logger.clear();
        options.transports.forEach((transport) => {
          logger.add(transport);
        });
      }
    });
  }

  /**
   * Create a child logger with additional context
   */
  static createChildLogger(
    parent: winston.Logger,
    context: Record<string, any>
  ): winston.Logger {
    return parent.child(context);
  }

  /**
   * Add structured metadata to log entries
   */
  static addMetadata(
    logger: winston.Logger,
    metadata: Record<string, any>
  ): winston.Logger {
    return logger.child(metadata);
  }

  /**
   * Create a request correlation logger
   */
  static createCorrelationLogger(
    service: string,
    correlationId: string
  ): winston.Logger {
    const baseLogger = this.getLogger(service);
    return baseLogger.child({ correlationId });
  }

  /**
   * Log performance metrics
   */
  static logPerformance(
    logger: winston.Logger,
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    logger.info('Performance metric', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Log API calls
   */
  static logAPICall(
    logger: winston.Logger,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    
    logger.log(level, 'API call', {
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Log security events
   */
  static logSecurityEvent(
    logger: winston.Logger,
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    logger.log(level, 'Security event', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Create a logger for MCP tool operations
   */
  static createMCPLogger(toolName: string, operation: string): winston.Logger {
    const baseLogger = this.getLogger(`mcp-${toolName}`);
    return baseLogger.child({ operation });
  }

  /**
   * Sanitize sensitive data from logs
   */
  static sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'private',
      'credential',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  /**
   * Get all active loggers
   */
  static getActiveLoggers(): string[] {
    return Array.from(this.loggers.keys());
  }

  /**
   * Set log level for a specific logger
   */
  static setLogLevel(service: string, level: string): void {
    const logger = this.loggers.get(service);
    if (logger) {
      logger.level = level;
    }
  }

  /**
   * Flush all loggers
   */
  static async flush(): Promise<void> {
    const flushPromises = Array.from(this.loggers.values()).map(
      (logger) =>
        new Promise<void>((resolve) => {
          // Winston doesn't have a built-in flush method
          // This is a workaround to ensure all logs are written
          setTimeout(resolve, 100);
        })
    );

    await Promise.all(flushPromises);
  }

  /**
   * Close all loggers
   */
  static close(): void {
    this.loggers.forEach((logger) => {
      logger.close();
    });
    this.loggers.clear();
  }
}