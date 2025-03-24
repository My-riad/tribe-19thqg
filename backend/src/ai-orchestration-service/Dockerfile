# Stage 1: Build shared libraries
FROM node:18-alpine AS shared
WORKDIR /app
COPY ../shared/package*.json ./
COPY ../shared/tsconfig.json ./
RUN npm ci
COPY ../shared/src ./src
RUN npm run build

# Stage 2: Build the AI Orchestration Service
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
# Copy the built shared libraries
COPY --from=shared /app/dist ../shared/dist
COPY --from=shared /app/node_modules ../shared/node_modules
# Copy service source code
COPY . .
RUN npm run build
# Remove dev dependencies for production
RUN npm prune --production

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app
# Copy only necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/../shared ../shared

# Use non-root user for security
USER node

# Expose the service port
EXPOSE 3004

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3004

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]