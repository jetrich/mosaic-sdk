import winston from 'winston';

/**
 * A simple logger wrapper for demonstrating logging in CI/CD
 */
export class Logger {
  private logger: winston.Logger;

  constructor(context: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  public info(message: string, meta?: unknown): void {
    this.logger.info(message, meta);
  }

  public warn(message: string, meta?: unknown): void {
    this.logger.warn(message, meta);
  }

  public error(message: string, error?: unknown): void {
    this.logger.error(message, { error });
  }

  public debug(message: string, meta?: unknown): void {
    this.logger.debug(message, meta);
  }
}