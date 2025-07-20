package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/mosaic/go-cicd-test/pkg/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	h := NewHandler()
	
	router.GET("/health", h.HealthCheck)
	v1 := router.Group("/api/v1")
	{
		v1.GET("/", h.Root)
		v1.POST("/calculate", h.Calculate)
		v1.GET("/operations", h.ListOperations)
		v1.GET("/history", h.GetHistory)
	}
	
	return router
}

func TestHealthCheck(t *testing.T) {
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.HealthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "healthy", response.Status)
	assert.Equal(t, "go-cicd-test", response.Service)
	assert.Equal(t, "1.0.0", response.Version)
}

func TestRoot(t *testing.T) {
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.RootResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "Go CI/CD Test API", response.Message)
	assert.Equal(t, "1.0.0", response.Version)
	assert.Equal(t, "running", response.Status)
}

func TestCalculate(t *testing.T) {
	router := setupRouter()
	
	tests := []struct {
		name         string
		request      models.CalculationRequest
		expectedCode int
		expectedResult float64
		expectError  bool
	}{
		{
			name: "addition",
			request: models.CalculationRequest{
				A: 10, B: 5, Operation: "add",
			},
			expectedCode: http.StatusOK,
			expectedResult: 15,
		},
		{
			name: "subtraction",
			request: models.CalculationRequest{
				A: 10, B: 3, Operation: "subtract",
			},
			expectedCode: http.StatusOK,
			expectedResult: 7,
		},
		{
			name: "multiplication",
			request: models.CalculationRequest{
				A: 4, B: 5, Operation: "multiply",
			},
			expectedCode: http.StatusOK,
			expectedResult: 20,
		},
		{
			name: "division",
			request: models.CalculationRequest{
				A: 20, B: 4, Operation: "divide",
			},
			expectedCode: http.StatusOK,
			expectedResult: 5,
		},
		{
			name: "division by zero",
			request: models.CalculationRequest{
				A: 10, B: 0, Operation: "divide",
			},
			expectedCode: http.StatusBadRequest,
			expectError: true,
		},
		{
			name: "power",
			request: models.CalculationRequest{
				A: 2, B: 3, Operation: "power",
			},
			expectedCode: http.StatusOK,
			expectedResult: 8,
		},
		{
			name: "square root",
			request: models.CalculationRequest{
				A: 16, Operation: "sqrt",
			},
			expectedCode: http.StatusOK,
			expectedResult: 4,
		},
		{
			name: "invalid operation",
			request: models.CalculationRequest{
				A: 10, B: 5, Operation: "invalid",
			},
			expectedCode: http.StatusBadRequest,
			expectError: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.request)
			
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/calculate", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)
			
			assert.Equal(t, tt.expectedCode, w.Code)
			
			if tt.expectError {
				var errResponse models.ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errResponse)
				require.NoError(t, err)
				assert.NotEmpty(t, errResponse.Message)
			} else {
				var response models.CalculationResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, response.Result)
				assert.Equal(t, tt.request.Operation, response.Operation)
			}
		})
	}
}

func TestCalculateInvalidJSON(t *testing.T) {
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/calculate", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestListOperations(t *testing.T) {
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/operations", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response models.OperationsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	expectedOps := []string{"add", "subtract", "multiply", "divide", "power", "sqrt"}
	assert.ElementsMatch(t, expectedOps, response.Operations)
}

func TestGetHistory(t *testing.T) {
	router := setupRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/history", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response []models.CalculationResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Len(t, response, 2)
	assert.Equal(t, "add", response[0].Operation)
	assert.Equal(t, "multiply", response[1].Operation)
}

// Benchmark test
func BenchmarkCalculate(b *testing.B) {
	router := setupRouter()
	
	request := models.CalculationRequest{
		A: 10, B: 5, Operation: "add",
	}
	body, _ := json.Marshal(request)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/calculate", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
	}
}