package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/mosaic/go-cicd-test/internal/handlers"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/mosaic/go-cicd-test/docs"
)

// @title Go CI/CD Test API
// @version 1.0
// @description A test API for validating CI/CD pipelines

// @contact.name MosAIc Team
// @contact.email support@example.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()

	// Setup routes
	setupRoutes(router)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf("Starting server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(router *gin.Engine) {
	// Create handler instance
	h := handlers.NewHandler()

	// Health check
	router.GET("/health", h.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/", h.Root)
		v1.POST("/calculate", h.Calculate)
		v1.GET("/operations", h.ListOperations)
		v1.GET("/history", h.GetHistory)
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}