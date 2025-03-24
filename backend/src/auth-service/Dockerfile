# First stage: Building shared libraries
FROM node:18-alpine AS shared
WORKDIR /app
COPY ../shared/package*.json ./
COPY ../shared/tsconfig.json ./
RUN npm ci
COPY ../shared/src ./src
RUN npm run build

# Second stage: Building the application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
# Copy built shared library
COPY --from=shared /app/dist ../shared/dist
COPY --from=shared /app/node_modules ../shared/node_modules
# Copy source code
COPY . .
# Build TypeScript code
RUN npm run build
# Prune development dependencies
RUN npm prune --production

# Final stage: Production
FROM node:18-alpine AS production
WORKDIR /app
# Copy application
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Copy shared library
COPY --from=build /app/../shared ../shared
# Use non-root user
USER node
# Expose service port
EXPOSE 3001
# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
# Start the application
CMD ["node", "dist/index.js"]