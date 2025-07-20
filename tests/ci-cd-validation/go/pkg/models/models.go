package models

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status" example:"healthy"`
	Service string `json:"service" example:"go-cicd-test"`
	Version string `json:"version" example:"1.0.0"`
}

// RootResponse represents the root endpoint response
type RootResponse struct {
	Message string `json:"message" example:"Go CI/CD Test API"`
	Version string `json:"version" example:"1.0.0"`
	Status  string `json:"status" example:"running"`
}

// CalculationRequest represents a calculation request
type CalculationRequest struct {
	A         float64 `json:"a" binding:"required" example:"10"`
	B         float64 `json:"b,omitempty" example:"5"`
	Operation string  `json:"operation" binding:"required,oneof=add subtract multiply divide power sqrt" example:"add"`
}

// CalculationResponse represents a calculation response
type CalculationResponse struct {
	Result    float64 `json:"result" example:"15"`
	Operation string  `json:"operation" example:"add"`
	A         float64 `json:"a" example:"10"`
	B         float64 `json:"b,omitempty" example:"5"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error" example:"Bad Request"`
	Message string `json:"message" example:"Invalid operation"`
}

// OperationsResponse represents the list of available operations
type OperationsResponse struct {
	Operations []string `json:"operations" example:"add,subtract,multiply,divide,power,sqrt"`
}