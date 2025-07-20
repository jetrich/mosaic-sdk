package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mosaic/go-cicd-test/internal/calculator"
	"github.com/mosaic/go-cicd-test/pkg/models"
)

// Handler contains the HTTP handlers
type Handler struct {
	calc *calculator.Calculator
}

// NewHandler creates a new Handler instance
func NewHandler() *Handler {
	return &Handler{
		calc: calculator.New(),
	}
}

// HealthCheck godoc
// @Summary Health check endpoint
// @Description Check if the service is healthy
// @Tags health
// @Produce json
// @Success 200 {object} models.HealthResponse
// @Router /health [get]
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, models.HealthResponse{
		Status:  "healthy",
		Service: "go-cicd-test",
		Version: "1.0.0",
	})
}

// Root godoc
// @Summary Root endpoint
// @Description Get basic information about the API
// @Tags info
// @Produce json
// @Success 200 {object} models.RootResponse
// @Router /api/v1/ [get]
func (h *Handler) Root(c *gin.Context) {
	c.JSON(http.StatusOK, models.RootResponse{
		Message: "Go CI/CD Test API",
		Version: "1.0.0",
		Status:  "running",
	})
}

// Calculate godoc
// @Summary Perform calculation
// @Description Perform mathematical calculation based on the operation
// @Tags calculator
// @Accept json
// @Produce json
// @Param request body models.CalculationRequest true "Calculation request"
// @Success 200 {object} models.CalculationResponse
// @Failure 400 {object} models.ErrorResponse
// @Router /api/v1/calculate [post]
func (h *Handler) Calculate(c *gin.Context) {
	var req models.CalculationRequest
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Bad Request",
			Message: err.Error(),
		})
		return
	}

	var result float64
	var err error

	switch req.Operation {
	case "add":
		result = h.calc.Add(req.A, req.B)
	case "subtract":
		result = h.calc.Subtract(req.A, req.B)
	case "multiply":
		result = h.calc.Multiply(req.A, req.B)
	case "divide":
		result, err = h.calc.Divide(req.A, req.B)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error:   "Bad Request",
				Message: err.Error(),
			})
			return
		}
	case "power":
		result = h.calc.Power(req.A, req.B)
	case "sqrt":
		result, err = h.calc.SquareRoot(req.A)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{
				Error:   "Bad Request",
				Message: err.Error(),
			})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Bad Request",
			Message: "Invalid operation",
		})
		return
	}

	response := models.CalculationResponse{
		Result:    result,
		Operation: req.Operation,
		A:         req.A,
	}
	
	if req.Operation != "sqrt" {
		response.B = req.B
	}

	c.JSON(http.StatusOK, response)
}

// ListOperations godoc
// @Summary List available operations
// @Description Get a list of all available mathematical operations
// @Tags calculator
// @Produce json
// @Success 200 {object} models.OperationsResponse
// @Router /api/v1/operations [get]
func (h *Handler) ListOperations(c *gin.Context) {
	c.JSON(http.StatusOK, models.OperationsResponse{
		Operations: []string{"add", "subtract", "multiply", "divide", "power", "sqrt"},
	})
}

// GetHistory godoc
// @Summary Get calculation history
// @Description Get a list of recent calculations (mock implementation)
// @Tags calculator
// @Produce json
// @Success 200 {array} models.CalculationResponse
// @Router /api/v1/history [get]
func (h *Handler) GetHistory(c *gin.Context) {
	// Mock implementation - in a real app, this would fetch from a database
	history := []models.CalculationResponse{
		{
			Result:    15,
			Operation: "add",
			A:         10,
			B:         5,
		},
		{
			Result:    50,
			Operation: "multiply",
			A:         10,
			B:         5,
		},
	}

	c.JSON(http.StatusOK, history)
}