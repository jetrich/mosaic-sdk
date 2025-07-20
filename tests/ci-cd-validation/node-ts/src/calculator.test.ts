import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers correctly', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should add zero correctly', () => {
      expect(calculator.add(0, 5)).toBe(5);
      expect(calculator.add(5, 0)).toBe(5);
    });

    it('should add decimal numbers correctly', () => {
      expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers correctly', () => {
      expect(calculator.subtract(5, 3)).toBe(2);
    });

    it('should subtract negative numbers correctly', () => {
      expect(calculator.subtract(-5, -3)).toBe(-2);
    });

    it('should handle subtracting larger from smaller', () => {
      expect(calculator.subtract(3, 5)).toBe(-2);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers correctly', () => {
      expect(calculator.multiply(3, 4)).toBe(12);
    });

    it('should multiply by zero correctly', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
      expect(calculator.multiply(0, 5)).toBe(0);
    });

    it('should multiply negative numbers correctly', () => {
      expect(calculator.multiply(-3, 4)).toBe(-12);
      expect(calculator.multiply(-3, -4)).toBe(12);
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers correctly', () => {
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it('should divide negative numbers correctly', () => {
      expect(calculator.divide(-10, 2)).toBe(-5);
      expect(calculator.divide(-10, -2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero is not allowed');
    });

    it('should handle decimal division', () => {
      expect(calculator.divide(1, 3)).toBeCloseTo(0.333333, 5);
    });
  });

  describe('power', () => {
    it('should calculate positive powers correctly', () => {
      expect(calculator.power(2, 3)).toBe(8);
    });

    it('should handle zero exponent', () => {
      expect(calculator.power(5, 0)).toBe(1);
    });

    it('should handle negative exponent', () => {
      expect(calculator.power(2, -2)).toBe(0.25);
    });

    it('should handle fractional exponent', () => {
      expect(calculator.power(4, 0.5)).toBe(2);
    });
  });

  describe('squareRoot', () => {
    it('should calculate square root of positive numbers', () => {
      expect(calculator.squareRoot(4)).toBe(2);
      expect(calculator.squareRoot(9)).toBe(3);
      expect(calculator.squareRoot(16)).toBe(4);
    });

    it('should handle zero', () => {
      expect(calculator.squareRoot(0)).toBe(0);
    });

    it('should throw error for negative numbers', () => {
      expect(() => calculator.squareRoot(-4)).toThrow('Cannot calculate square root of negative number');
    });

    it('should handle decimal results', () => {
      expect(calculator.squareRoot(2)).toBeCloseTo(1.4142, 4);
    });
  });

  describe('factorial', () => {
    it('should calculate factorial of positive integers', () => {
      expect(calculator.factorial(0)).toBe(1);
      expect(calculator.factorial(1)).toBe(1);
      expect(calculator.factorial(5)).toBe(120);
      expect(calculator.factorial(6)).toBe(720);
    });

    it('should throw error for negative numbers', () => {
      expect(() => calculator.factorial(-5)).toThrow('Factorial is only defined for non-negative integers');
    });

    it('should throw error for non-integers', () => {
      expect(() => calculator.factorial(3.5)).toThrow('Factorial is only defined for non-negative integers');
    });

    // Test for intentional failure to demonstrate CI/CD catching errors
    it.skip('should fail intentionally (disabled test)', () => {
      // This test would fail if enabled
      expect(calculator.factorial(5)).toBe(100);
    });
  });
});