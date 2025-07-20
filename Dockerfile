# MosAIc SDK Development Environment
# All-in-one development container for MosAIc SDK

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    py3-pip \
    make \
    g++ \
    postgresql-client \
    redis \
    tini

# Install Python dependencies for Tony planning engine
RUN pip3 install --no-cache-dir pydantic networkx numpy

WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Copy submodule package files
COPY tony/package*.json ./tony/
COPY mosaic-mcp/package*.json ./mosaic-mcp/
COPY mosaic-dev/package*.json ./mosaic-dev/
COPY mosaic/mosaic-app/package*.json ./mosaic/mosaic-app/

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Initialize submodules (if not already)
RUN git submodule update --init --recursive || true

# Install all component dependencies
RUN npm run install:all

# Build all components
RUN npm run build:all

# Create non-root user
RUN addgroup -g 1001 -S mosaic && \
    adduser -S mosaic -u 1001

# Create necessary directories
RUN mkdir -p /workspace/.mosaic/data \
             /workspace/.mosaic/logs \
             /workspace/.mosaic/cache \
             /workspace/worktrees && \
    chown -R mosaic:mosaic /workspace

# Switch to non-root user
USER mosaic

# Environment variables
ENV NODE_ENV=development
ENV MOSAIC_SDK_VERSION=0.1.0
ENV MCP_PORT=3456

# Expose ports
EXPOSE 3456 3000 3001 5432 6379

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command starts the isolated MCP server
CMD ["npm", "run", "dev:start"]