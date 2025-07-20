# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY sdk ./sdk
COPY bootstrap ./bootstrap
COPY examples ./examples
COPY docs ./docs
COPY releases ./releases

# Build all SDK components
RUN npm run build

# Runtime stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache tini bash git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built SDK components
COPY --from=builder /app/sdk ./sdk

# Copy necessary scripts and resources
COPY bootstrap ./bootstrap
COPY examples ./examples
COPY docs ./docs
COPY releases ./releases

# Create non-root user
RUN addgroup -g 1001 -S mosaic && \
    adduser -S mosaic -u 1001

# Set ownership
RUN chown -R mosaic:mosaic /app

# Create necessary directories
RUN mkdir -p /app/logs /app/temp && \
    chown -R mosaic:mosaic /app/logs /app/temp

USER mosaic

# Environment variables
ENV NODE_ENV=production
ENV MOSAIC_DEV_VERSION=1.0.0

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command runs the development tools
CMD ["node", "sdk/development-tools/dist/index.js"]