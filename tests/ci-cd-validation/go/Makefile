# Makefile for Go CI/CD Test Project

# Variables
BINARY_NAME=go-cicd-test
BINARY_DIR=bin
COVERAGE_DIR=coverage
DOCKER_IMAGE=go-cicd-test
VERSION=$(shell git describe --tags --always --dirty)
LDFLAGS=-ldflags "-X main.Version=${VERSION}"

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOFMT=gofmt
GOLINT=golangci-lint
GOVET=$(GOCMD) vet

# Targets
.PHONY: all build test clean run deps lint fmt vet coverage docker help

## help: Show this help message
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

## all: Run all targets
all: clean deps lint test build

## build: Build the binary
build:
	@echo "Building..."
	@mkdir -p $(BINARY_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BINARY_DIR)/$(BINARY_NAME) -v ./cmd/api

## test: Run tests
test:
	@echo "Running tests..."
	$(GOTEST) -v -race ./...

## test-coverage: Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@mkdir -p $(COVERAGE_DIR)
	$(GOTEST) -v -race -coverprofile=$(COVERAGE_DIR)/coverage.out -covermode=atomic ./...
	$(GOCMD) tool cover -html=$(COVERAGE_DIR)/coverage.out -o $(COVERAGE_DIR)/coverage.html
	@echo "Coverage report generated at $(COVERAGE_DIR)/coverage.html"

## benchmark: Run benchmarks
benchmark:
	@echo "Running benchmarks..."
	$(GOTEST) -bench=. -benchmem ./...

## clean: Clean build artifacts
clean:
	@echo "Cleaning..."
	$(GOCLEAN)
	@rm -rf $(BINARY_DIR) $(COVERAGE_DIR)

## run: Run the application
run: build
	@echo "Running application..."
	./$(BINARY_DIR)/$(BINARY_NAME)

## deps: Download dependencies
deps:
	@echo "Downloading dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy

## lint: Run linter
lint:
	@echo "Running linter..."
	@if ! which $(GOLINT) > /dev/null; then \
		echo "Installing golangci-lint..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
	fi
	$(GOLINT) run ./...

## fmt: Format code
fmt:
	@echo "Formatting code..."
	$(GOFMT) -s -w .

## vet: Run go vet
vet:
	@echo "Running go vet..."
	$(GOVET) ./...

## security: Run security scan
security:
	@echo "Running security scan..."
	@if ! which gosec > /dev/null; then \
		echo "Installing gosec..."; \
		go install github.com/securego/gosec/v2/cmd/gosec@latest; \
	fi
	gosec -fmt json -out security-report.json ./... || true

## swagger: Generate swagger documentation
swagger:
	@echo "Generating swagger documentation..."
	@if ! which swag > /dev/null; then \
		echo "Installing swag..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
	fi
	swag init -g cmd/api/main.go -o docs

## docker-build: Build Docker image
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(VERSION) -t $(DOCKER_IMAGE):latest .

## docker-run: Run Docker container
docker-run:
	@echo "Running Docker container..."
	docker run -p 8080:8080 $(DOCKER_IMAGE):latest

## ci: Run CI pipeline locally
ci: deps lint vet test-coverage build
	@echo "CI pipeline completed successfully!"