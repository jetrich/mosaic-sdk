/**
 * Logger utility for planning plugin components
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: any;
  component?: string;
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private component: string;

  constructor(component = 'PlanningPlugin') {
    this.component = component;
    
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR':
        this.level = LogLevel.ERROR;
        break;
      case 'WARN':
        this.level = LogLevel.WARN;
        break;
      case 'INFO':
        this.level = LogLevel.INFO;
        break;
      case 'DEBUG':
        this.level = LogLevel.DEBUG;
        break;
    }
  }

  error(message: string, error?: Error | any, metadata?: any): void {
    if (this.level >= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message, { 
        ...metadata, 
        error: error?.message || error 
      });
    }
  }

  warn(message: string, metadata?: any): void {
    if (this.level >= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, metadata);
    }
  }

  info(message: string, metadata?: any): void {
    if (this.level >= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, metadata);
    }
  }

  debug(message: string, metadata?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata,
      component: this.component
    };

    const levelName = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    
    let output = `[${timestamp}] ${levelName} [${this.component}] ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      output += ` ${JSON.stringify(metadata)}`;
    }

    // Output to appropriate stream
    if (level === LogLevel.ERROR) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}