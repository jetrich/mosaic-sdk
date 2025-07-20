/**
 * A simple calculator class for demonstrating CI/CD testing
 */
export class Calculator {
  /**
   * Adds two numbers
   * @param a - First number
   * @param b - Second number
   * @returns The sum of a and b
   */
  public add(a: number, b: number): number {
    return a + b;
  }

  /**
   * Subtracts b from a
   * @param a - First number
   * @param b - Second number
   * @returns The difference of a and b
   */
  public subtract(a: number, b: number): number {
    return a - b;
  }

  /**
   * Multiplies two numbers
   * @param a - First number
   * @param b - Second number
   * @returns The product of a and b
   */
  public multiply(a: number, b: number): number {
    return a * b;
  }

  /**
   * Divides a by b
   * @param a - Dividend
   * @param b - Divisor
   * @returns The quotient of a and b
   * @throws Error if b is zero
   */
  public divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }

  /**
   * Calculates the power of a number
   * @param base - The base number
   * @param exponent - The exponent
   * @returns The result of base raised to exponent
   */
  public power(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  /**
   * Calculates the square root of a number
   * @param n - The number
   * @returns The square root of n
   * @throws Error if n is negative
   */
  public squareRoot(n: number): number {
    if (n < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
    return Math.sqrt(n);
  }

  /**
   * Calculates the factorial of a number
   * @param n - The number (must be non-negative integer)
   * @returns The factorial of n
   * @throws Error if n is negative or not an integer
   */
  public factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('Factorial is only defined for non-negative integers');
    }
    
    if (n === 0 || n === 1) {
      return 1;
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}