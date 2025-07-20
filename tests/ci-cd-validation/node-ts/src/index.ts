import { Calculator } from './calculator';
import { Logger } from './logger';

const logger = new Logger('Main');

export function main(): void {
  logger.info('Starting Node.js TypeScript CI/CD test application');
  
  const calc = new Calculator();
  
  // Demonstrate successful operations
  const sum = calc.add(10, 5);
  logger.info(`10 + 5 = ${sum}`);
  
  const diff = calc.subtract(10, 5);
  logger.info(`10 - 5 = ${diff}`);
  
  const product = calc.multiply(10, 5);
  logger.info(`10 * 5 = ${product}`);
  
  const quotient = calc.divide(10, 5);
  logger.info(`10 / 5 = ${quotient}`);
  
  // Demonstrate error handling
  try {
    calc.divide(10, 0);
  } catch (error) {
    logger.error('Division by zero error caught successfully', error);
  }
  
  logger.info('Application completed successfully');
}

// Run if this is the main module
if (require.main === module) {
  main();
}