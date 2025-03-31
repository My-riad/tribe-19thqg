# Build stage
FROM python:3.13-slim AS build

WORKDIR /app

# Set environment variables to optimize Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for building
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user and set ownership
RUN groupadd -r aiengine && useradd -r -g aiengine aiengine
RUN chown -R aiengine:aiengine /app

# Production stage
FROM python:3.13-slim AS production

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from build stage
COPY --from=build /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application from build stage
COPY --from=build /app .

# Create non-root user
RUN groupadd -r aiengine && useradd -r -g aiengine aiengine
RUN chown -R aiengine:aiengine /app

# Switch to non-root user
USER aiengine

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

# Run with Gunicorn and Uvicorn workers for production
CMD ["gunicorn", "src.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]