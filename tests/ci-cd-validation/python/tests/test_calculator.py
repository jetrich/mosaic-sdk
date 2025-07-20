"""Unit tests for the calculator module."""

import pytest
import math
from app.calculator import Calculator


class TestCalculator:
    """Test cases for Calculator class."""

    @pytest.fixture
    def calculator(self):
        """Provide a Calculator instance for tests."""
        return Calculator()

    def test_add(self, calculator):
        """Test addition operation."""
        assert calculator.add(2, 3) == 5
        assert calculator.add(-2, -3) == -5
        assert calculator.add(0, 5) == 5
        assert calculator.add(0.1, 0.2) == pytest.approx(0.3)

    def test_subtract(self, calculator):
        """Test subtraction operation."""
        assert calculator.subtract(5, 3) == 2
        assert calculator.subtract(-5, -3) == -2
        assert calculator.subtract(3, 5) == -2
        assert calculator.subtract(0, 5) == -5

    def test_multiply(self, calculator):
        """Test multiplication operation."""
        assert calculator.multiply(3, 4) == 12
        assert calculator.multiply(-3, 4) == -12
        assert calculator.multiply(-3, -4) == 12
        assert calculator.multiply(5, 0) == 0
        assert calculator.multiply(0.5, 0.5) == 0.25

    def test_divide(self, calculator):
        """Test division operation."""
        assert calculator.divide(10, 2) == 5
        assert calculator.divide(-10, 2) == -5
        assert calculator.divide(-10, -2) == 5
        assert calculator.divide(1, 3) == pytest.approx(0.333333, rel=1e-5)

    def test_divide_by_zero(self, calculator):
        """Test division by zero raises error."""
        with pytest.raises(ValueError, match="Division by zero is not allowed"):
            calculator.divide(10, 0)

    def test_power(self, calculator):
        """Test power operation."""
        assert calculator.power(2, 3) == 8
        assert calculator.power(5, 0) == 1
        assert calculator.power(2, -2) == 0.25
        assert calculator.power(4, 0.5) == 2
        assert calculator.power(27, 1/3) == pytest.approx(3, rel=1e-5)

    def test_square_root(self, calculator):
        """Test square root operation."""
        assert calculator.square_root(4) == 2
        assert calculator.square_root(9) == 3
        assert calculator.square_root(16) == 4
        assert calculator.square_root(0) == 0
        assert calculator.square_root(2) == pytest.approx(1.4142, rel=1e-4)

    def test_square_root_negative(self, calculator):
        """Test square root of negative number raises error."""
        with pytest.raises(ValueError, match="Cannot calculate square root of negative number"):
            calculator.square_root(-4)

    def test_factorial(self, calculator):
        """Test factorial operation."""
        assert calculator.factorial(0) == 1
        assert calculator.factorial(1) == 1
        assert calculator.factorial(5) == 120
        assert calculator.factorial(6) == 720
        assert calculator.factorial(10) == 3628800

    def test_factorial_negative(self, calculator):
        """Test factorial of negative number raises error."""
        with pytest.raises(ValueError, match="Factorial is only defined for non-negative integers"):
            calculator.factorial(-5)

    def test_factorial_non_integer(self, calculator):
        """Test factorial of non-integer raises error."""
        with pytest.raises(TypeError, match="Factorial is only defined for integers"):
            calculator.factorial(3.5)

    def test_gcd(self, calculator):
        """Test greatest common divisor."""
        assert calculator.gcd(12, 8) == 4
        assert calculator.gcd(17, 19) == 1
        assert calculator.gcd(100, 50) == 50
        assert calculator.gcd(-12, 8) == 4
        assert calculator.gcd(0, 5) == 5

    def test_gcd_non_integer(self, calculator):
        """Test GCD of non-integers raises error."""
        with pytest.raises(TypeError, match="GCD is only defined for integers"):
            calculator.gcd(3.5, 2)

    def test_lcm(self, calculator):
        """Test least common multiple."""
        assert calculator.lcm(12, 8) == 24
        assert calculator.lcm(3, 5) == 15
        assert calculator.lcm(6, 9) == 18
        assert calculator.lcm(-12, 8) == 24
        assert calculator.lcm(0, 5) == 0

    def test_lcm_non_integer(self, calculator):
        """Test LCM of non-integers raises error."""
        with pytest.raises(TypeError, match="LCM is only defined for integers"):
            calculator.lcm(3.5, 2)

    @pytest.mark.parametrize("a,b,expected", [
        (10, 5, 15),
        (0, 0, 0),
        (-5, -3, -8),
        (100, -50, 50),
    ])
    def test_add_parametrized(self, calculator, a, b, expected):
        """Parametrized test for addition."""
        assert calculator.add(a, b) == expected

    @pytest.mark.skip(reason="Demonstrating skipped test in CI/CD")
    def test_intentional_skip(self, calculator):
        """This test is intentionally skipped."""
        assert False, "This should not run"

    @pytest.mark.xfail(reason="Demonstrating expected failure in CI/CD")
    def test_intentional_xfail(self, calculator):
        """This test is expected to fail."""
        assert calculator.add(1, 1) == 3, "This is expected to fail"