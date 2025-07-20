# Multi-stage Dockerfile for Node.js TypeScript application
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json .eslintrc.js ./
COPY src ./src
RUN npm run lint
RUN npm run type-check
RUN npm run test
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Set environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Expose port (if needed for future enhancements)
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"]