"""Calculator module for demonstrating Python CI/CD testing."""

import math
from typing import Union


class Calculator:
    """A simple calculator class for demonstrating CI/CD testing."""

    def add(self, a: float, b: float) -> float:
        """Add two numbers."""
        return a + b

    def subtract(self, a: float, b: float) -> float:
        """Subtract b from a."""
        return a - b

    def multiply(self, a: float, b: float) -> float:
        """Multiply two numbers."""
        return a * b

    def divide(self, a: float, b: float) -> float:
        """Divide a by b."""
        if b == 0:
            raise ValueError("Division by zero is not allowed")
        return a / b

    def power(self, base: float, exponent: float) -> float:
        """Calculate base raised to the power of exponent."""
        return math.pow(base, exponent)

    def square_root(self, n: float) -> float:
        """Calculate the square root of a number."""
        if n < 0:
            raise ValueError("Cannot calculate square root of negative number")
        return math.sqrt(n)

    def factorial(self, n: int) -> int:
        """Calculate the factorial of a non-negative integer."""
        if not isinstance(n, int):
            raise TypeError("Factorial is only defined for integers")
        if n < 0:
            raise ValueError("Factorial is only defined for non-negative integers")
        return math.factorial(n)

    def gcd(self, a: int, b: int) -> int:
        """Calculate the greatest common divisor of two integers."""
        if not isinstance(a, int) or not isinstance(b, int):
            raise TypeError("GCD is only defined for integers")
        return math.gcd(a, b)

    def lcm(self, a: int, b: int) -> int:
        """Calculate the least common multiple of two integers."""
        if not isinstance(a, int) or not isinstance(b, int):
            raise TypeError("LCM is only defined for integers")
        if a == 0 or b == 0:
            return 0
        return abs(a * b) // math.gcd(a, b)