# Stage 1: Build shared libraries
FROM node:18-alpine AS shared
WORKDIR /app
# Note: The following COPY commands assume the Docker build context includes ../shared
# This may require setting the build context to a parent directory or using a custom Docker build command
COPY ../shared/package*.json ./
COPY ../shared/tsconfig.json ./
RUN npm ci
COPY ../shared/src ./src
RUN npm run build

# Stage 2: Build the service
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY --from=shared /app/dist ../shared/dist
COPY --from=shared /app/node_modules ../shared/node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/../shared ../shared
USER node
EXPOSE 3005
ENV NODE_ENV=production
ENV PORT=3005
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1
CMD ["node", "dist/index.js"]