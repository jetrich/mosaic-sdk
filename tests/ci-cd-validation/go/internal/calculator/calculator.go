package calculator

import (
	"errors"
	"math"
)

// Calculator provides mathematical operations
type Calculator struct{}

// New creates a new Calculator instance
func New() *Calculator {
	return &Calculator{}
}

// Add returns the sum of two numbers
func (c *Calculator) Add(a, b float64) float64 {
	return a + b
}

// Subtract returns the difference of two numbers
func (c *Calculator) Subtract(a, b float64) float64 {
	return a - b
}

// Multiply returns the product of two numbers
func (c *Calculator) Multiply(a, b float64) float64 {
	return a * b
}

// Divide returns the quotient of two numbers
func (c *Calculator) Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("division by zero is not allowed")
	}
	return a / b, nil
}

// Power returns base raised to the power of exponent
func (c *Calculator) Power(base, exponent float64) float64 {
	return math.Pow(base, exponent)
}

// SquareRoot returns the square root of a number
func (c *Calculator) SquareRoot(n float64) (float64, error) {
	if n < 0 {
		return 0, errors.New("cannot calculate square root of negative number")
	}
	return math.Sqrt(n), nil
}

// Factorial returns the factorial of a non-negative integer
func (c *Calculator) Factorial(n int) (int64, error) {
	if n < 0 {
		return 0, errors.New("factorial is only defined for non-negative integers")
	}
	if n > 20 {
		return 0, errors.New("factorial too large to calculate")
	}
	
	result := int64(1)
	for i := 2; i <= n; i++ {
		result *= int64(i)
	}
	return result, nil
}

// GCD returns the greatest common divisor of two integers
func (c *Calculator) GCD(a, b int) int {
	if a < 0 {
		a = -a
	}
	if b < 0 {
		b = -b
	}
	
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

// LCM returns the least common multiple of two integers
func (c *Calculator) LCM(a, b int) int {
	if a == 0 || b == 0 {
		return 0
	}
	
	gcd := c.GCD(a, b)
	return abs(a*b) / gcd
}

// abs returns the absolute value of an integer
func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}