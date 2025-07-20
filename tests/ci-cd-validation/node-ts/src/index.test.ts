import { main } from './index';
import { Logger } from './logger';

// Mock the logger module
jest.mock('./logger');

describe('Main Application', () => {
  let mockLoggerInstance: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock logger instance
    mockLoggerInstance = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>;
    
    // Mock the Logger constructor to return our mock instance
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLoggerInstance);
  });

  it('should run the main function without errors', () => {
    expect(() => main()).not.toThrow();
  });

  it('should log startup message', () => {
    main();
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Starting Node.js TypeScript CI/CD test application');
  });

  it('should perform calculations and log results', () => {
    main();
    
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('10 + 5 = 15');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('10 - 5 = 5');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('10 * 5 = 50');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('10 / 5 = 2');
  });

  it('should handle division by zero error', () => {
    main();
    
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Division by zero error caught successfully',
      expect.any(Error)
    );
  });

  it('should log completion message', () => {
    main();
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Application completed successfully');
  });
});