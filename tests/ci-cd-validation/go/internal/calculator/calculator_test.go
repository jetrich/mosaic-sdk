package calculator

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCalculator_Add(t *testing.T) {
	calc := New()

	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive numbers", 2, 3, 5},
		{"negative numbers", -2, -3, -5},
		{"mixed numbers", -5, 10, 5},
		{"with zero", 0, 5, 5},
		{"decimals", 0.1, 0.2, 0.3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.Add(tt.a, tt.b)
			assert.InDelta(t, tt.expected, result, 0.0001)
		})
	}
}

func TestCalculator_Subtract(t *testing.T) {
	calc := New()

	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive numbers", 5, 3, 2},
		{"negative numbers", -5, -3, -2},
		{"result negative", 3, 5, -2},
		{"with zero", 5, 0, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.Subtract(tt.a, tt.b)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCalculator_Multiply(t *testing.T) {
	calc := New()

	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive numbers", 3, 4, 12},
		{"negative numbers", -3, -4, 12},
		{"mixed numbers", -3, 4, -12},
		{"with zero", 5, 0, 0},
		{"decimals", 0.5, 0.5, 0.25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.Multiply(tt.a, tt.b)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCalculator_Divide(t *testing.T) {
	calc := New()

	tests := []struct {
		name      string
		a, b      float64
		expected  float64
		wantError bool
	}{
		{"positive numbers", 10, 2, 5, false},
		{"negative numbers", -10, -2, 5, false},
		{"mixed numbers", -10, 2, -5, false},
		{"decimal result", 1, 3, 0.333333, false},
		{"divide by zero", 10, 0, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := calc.Divide(tt.a, tt.b)
			if tt.wantError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "division by zero")
			} else {
				assert.NoError(t, err)
				assert.InDelta(t, tt.expected, result, 0.0001)
			}
		})
	}
}

func TestCalculator_Power(t *testing.T) {
	calc := New()

	tests := []struct {
		name             string
		base, exponent   float64
		expected         float64
	}{
		{"positive power", 2, 3, 8},
		{"zero exponent", 5, 0, 1},
		{"negative exponent", 2, -2, 0.25},
		{"fractional exponent", 4, 0.5, 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.Power(tt.base, tt.exponent)
			assert.InDelta(t, tt.expected, result, 0.0001)
		})
	}
}

func TestCalculator_SquareRoot(t *testing.T) {
	calc := New()

	tests := []struct {
		name      string
		n         float64
		expected  float64
		wantError bool
	}{
		{"perfect square", 4, 2, false},
		{"non-perfect square", 2, math.Sqrt(2), false},
		{"zero", 0, 0, false},
		{"negative number", -4, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := calc.SquareRoot(tt.n)
			if tt.wantError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "negative number")
			} else {
				assert.NoError(t, err)
				assert.InDelta(t, tt.expected, result, 0.0001)
			}
		})
	}
}

func TestCalculator_Factorial(t *testing.T) {
	calc := New()

	tests := []struct {
		name      string
		n         int
		expected  int64
		wantError bool
	}{
		{"zero", 0, 1, false},
		{"one", 1, 1, false},
		{"five", 5, 120, false},
		{"ten", 10, 3628800, false},
		{"negative", -5, 0, true},
		{"too large", 21, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := calc.Factorial(tt.n)
			if tt.wantError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}

func TestCalculator_GCD(t *testing.T) {
	calc := New()

	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"positive numbers", 12, 8, 4},
		{"coprime", 17, 19, 1},
		{"one is multiple", 100, 50, 50},
		{"negative numbers", -12, 8, 4},
		{"with zero", 0, 5, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.GCD(tt.a, tt.b)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCalculator_LCM(t *testing.T) {
	calc := New()

	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"positive numbers", 12, 8, 24},
		{"coprime", 3, 5, 15},
		{"same numbers", 6, 6, 6},
		{"negative numbers", -12, 8, 24},
		{"with zero", 0, 5, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calc.LCM(tt.a, tt.b)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Benchmark tests
func BenchmarkCalculator_Add(b *testing.B) {
	calc := New()
	for i := 0; i < b.N; i++ {
		calc.Add(123.456, 789.012)
	}
}

func BenchmarkCalculator_Factorial(b *testing.B) {
	calc := New()
	for i := 0; i < b.N; i++ {
		_, _ = calc.Factorial(10)
	}
}

// Example test
func TestCalculator_Integration(t *testing.T) {
	calc := New()

	// Complex calculation: (10 + 5) * 2 / 3
	sum := calc.Add(10, 5)
	product := calc.Multiply(sum, 2)
	result, err := calc.Divide(product, 3)
	
	require.NoError(t, err)
	assert.InDelta(t, 10.0, result, 0.0001)
}