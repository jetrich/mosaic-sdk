# Multi-stage Dockerfile for Go application
# Stage 1: Build
FROM golang:1.21-alpine AS builder

# Install dependencies
RUN apk add --no-cache git make gcc musl-dev

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Run tests
RUN go test -v ./...

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X main.Version=$(git describe --tags --always --dirty)" \
    -a -installsuffix cgo -o app ./cmd/api

# Stage 2: Security scan
FROM golang:1.21-alpine AS security

# Install security tools
RUN go install github.com/securego/gosec/v2/cmd/gosec@latest

WORKDIR /scan
COPY --from=builder /build .

# Run security scan
RUN gosec -fmt json -out security-report.json ./... || true

# Stage 3: Final image
FROM alpine:latest AS production

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/app .
COPY --from=security /scan/security-report.json .

# Change ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Set environment
ENV GIN_MODE=release
ENV PORT=8080

# Run the binary
CMD ["./app"]