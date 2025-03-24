FROM ../../Dockerfile

ARG SERVICE_DIR=api-gateway
ARG SERVICE_PORT=3000

LABEL maintainer="Tribe Team"
LABEL description="API Gateway for the Tribe platform"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVICE_PORT}/health || exit 1