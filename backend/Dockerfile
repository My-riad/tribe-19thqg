# Stage 1: Build shared library
FROM node:18-alpine AS shared-builder
WORKDIR /app
# Copy and install shared dependencies first
COPY ./src/shared/package*.json ./
COPY ./src/shared/tsconfig.json ./
RUN npm ci
# Copy and build shared source code
COPY ./src/shared/src ./src
RUN npm run build

# Stage 2: Build service
FROM node:18-alpine AS service-builder
ARG SERVICE_DIR
WORKDIR /app
# Copy and install service dependencies
COPY ./src/${SERVICE_DIR}/package*.json ./
COPY ./src/${SERVICE_DIR}/tsconfig.json ./
RUN npm ci
# Copy shared library build artifacts
COPY --from=shared-builder /app/dist /app/shared/dist
COPY --from=shared-builder /app/node_modules /app/shared/node_modules
# Copy service source code and build
COPY ./src/${SERVICE_DIR}/src ./src
RUN npm run build
# Remove development dependencies for production
RUN npm prune --production

# Stage 3: Production runtime
FROM node:18-alpine AS production
ARG SERVICE_DIR
ARG SERVICE_PORT
WORKDIR /app
# Copy built artifacts and production dependencies
COPY --from=service-builder /app/package*.json ./
COPY --from=service-builder /app/node_modules ./node_modules
COPY --from=service-builder /app/dist ./dist
COPY --from=service-builder /app/shared /app/shared
# Use non-root user for security
USER node
# Configure container
EXPOSE ${SERVICE_PORT}
ENV NODE_ENV=production
ENV PORT=${SERVICE_PORT}
# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVICE_PORT}/health || exit 1
# Start application
CMD ["node", "dist/index.js"]