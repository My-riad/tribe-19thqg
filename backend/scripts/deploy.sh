#!/bin/bash
# deploy.sh - Deployment script for Tribe backend microservices
# This script handles building and pushing Docker containers, updating Kubernetes
# manifests, and managing the deployment process across various environments.

# Exit immediately if a command exits with a non-zero status
set -e

# Script directory
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# List of all microservices to build and deploy
SERVICES="api-gateway auth-service profile-service tribe-service matching-service event-service engagement-service planning-service payment-service notification-service ai-orchestration-service ai-engine"

# Docker registry URL (can be overridden by environment variable)
REGISTRY_URL=${REGISTRY_URL:-"localhost:5000"}

# Default version if not specified
DEFAULT_VERSION="latest"

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print a formatted message to the console
print_message() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${BLUE}[${timestamp}]${NC} $1"
}

# Print an error message
print_error() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${RED}[${timestamp}] ERROR:${NC} $1" >&2
}

# Print a success message
print_success() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} $1"
}

# Display usage information
usage() {
    echo "Tribe Platform Deployment Script"
    echo "Deploys the Tribe platform's backend microservices to specified environment"
    echo ""
    echo "Usage: $(basename "$0") ENVIRONMENT [OPTIONS]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development      Deploy to development environment"
    echo "  staging          Deploy to staging environment"
    echo "  production       Deploy to production environment"
    echo ""
    echo "OPTIONS:"
    echo "  -v, --version VERSION    Specify version tag (default: latest)"
    echo "  -r, --registry URL       Specify container registry URL"
    echo "  -s, --service SERVICE    Deploy only specific service"
    echo "  -b, --build-only         Build and push containers only (skip deployment)"
    echo "  -d, --deploy-only        Update manifests and deploy only (skip build)"
    echo "  -h, --help               Display this help message"
    echo ""
    echo "Examples:"
    echo "  $(basename "$0") development"
    echo "  $(basename "$0") staging --version v1.2.3"
    echo "  $(basename "$0") production --service api-gateway"
    echo "  $(basename "$0") development --build-only"
    echo "  $(basename "$0") production --deploy-only --version v1.2.3"
}

# Parse command-line arguments
parse_args() {
    # Default values
    ENV=""
    VERSION="$DEFAULT_VERSION"
    SPECIFIC_SERVICE=""
    BUILD_ONLY=false
    DEPLOY_ONLY=false
    SHOW_HELP=false

    # No arguments provided
    if [ $# -eq 0 ]; then
        usage
        exit 1
    fi

    # First argument should be environment
    ENV="$1"
    shift

    # Environment validation
    if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
        print_error "Invalid environment: $ENV. Must be one of: development, staging, production"
        usage
        exit 1
    fi

    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            --version=*)
                VERSION="${1#*=}"
                shift
                ;;
            -r|--registry)
                REGISTRY_URL="$2"
                shift 2
                ;;
            --registry=*)
                REGISTRY_URL="${1#*=}"
                shift
                ;;
            -s|--service)
                SPECIFIC_SERVICE="$2"
                shift 2
                ;;
            --service=*)
                SPECIFIC_SERVICE="${1#*=}"
                shift
                ;;
            -b|--build-only)
                BUILD_ONLY=true
                shift
                ;;
            -d|--deploy-only)
                DEPLOY_ONLY=true
                shift
                ;;
            -h|--help)
                SHOW_HELP=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # If both build-only and deploy-only are set, it's invalid
    if [ "$BUILD_ONLY" = true ] && [ "$DEPLOY_ONLY" = true ]; then
        print_error "Cannot use both --build-only and --deploy-only options together"
        usage
        exit 1
    fi

    # Set environment-specific variables
    case "$ENV" in
        development)
            NAMESPACE="tribe-development"
            CONFIG_SUFFIX="dev"
            ;;
        staging)
            NAMESPACE="tribe-staging"
            CONFIG_SUFFIX="staging"
            ;;
        production)
            NAMESPACE="tribe-production"
            CONFIG_SUFFIX="prod"
            ;;
    esac

    # Export variables for use in other functions
    export ENV VERSION SPECIFIC_SERVICE BUILD_ONLY DEPLOY_ONLY SHOW_HELP
    export NAMESPACE CONFIG_SUFFIX
    
    return 0
}

# Build and push a single service
build_and_push_service() {
    local service="$1"
    local env="$2"
    local version="$3"
    
    print_message "Building service: $service for environment: $env with version: $version"
    
    # Construct Docker image tag
    local image_tag="${REGISTRY_URL}/${service}:${version}-${env}"
    
    # Determine the directory for the service
    local service_dir="${ROOT_DIR}/services/${service}"
    
    # Check if the service directory exists
    if [ ! -d "$service_dir" ]; then
        print_error "Service directory not found: $service_dir"
        return 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        return 1
    fi
    
    # Build Docker image
    print_message "Building image: $image_tag"
    docker build \
        --build-arg ENV="$env" \
        --build-arg VERSION="$version" \
        --build-arg CONFIG_SUFFIX="$CONFIG_SUFFIX" \
        -t "$image_tag" \
        "$service_dir"
    
    # Push Docker image
    print_message "Pushing image: $image_tag"
    docker push "$image_tag"
    
    print_success "Successfully built and pushed $service ($image_tag)"
    return 0
}

# Build and push all services
build_all_services() {
    local env="$1"
    local version="$2"
    
    print_message "Building all services for environment: $env with version: $version"
    
    if [ -n "$SPECIFIC_SERVICE" ]; then
        # Check if the specific service is in the list of available services
        if echo "$SERVICES" | grep -w "$SPECIFIC_SERVICE" > /dev/null; then
            build_and_push_service "$SPECIFIC_SERVICE" "$env" "$version"
        else
            print_error "Unknown service: $SPECIFIC_SERVICE"
            print_message "Available services: $SERVICES"
            return 1
        fi
    else
        # Build and push all services
        for service in $SERVICES; do
            build_and_push_service "$service" "$env" "$version"
        done
    fi
    
    print_success "All services built and pushed successfully"
    return 0
}

# Update Kubernetes manifest files with correct image tags
update_kubernetes_manifests() {
    local env="$1"
    local version="$2"
    
    print_message "Updating Kubernetes manifests for environment: $env with version: $version"
    
    # Define the directory containing Kubernetes manifests
    local k8s_dir="${ROOT_DIR}/infrastructure/kubernetes"
    local env_dir="${k8s_dir}/${env}"
    
    # Check if the kubernetes directory exists
    if [ ! -d "$k8s_dir" ]; then
        print_error "Kubernetes directory not found: $k8s_dir"
        return 1
    fi
    
    # Check if the environment directory exists
    if [ ! -d "$env_dir" ]; then
        print_error "Environment directory not found: $env_dir"
        return 1
    fi
    
    # Create temporary directory for modified manifests
    local temp_dir="${k8s_dir}/temp-${env}"
    mkdir -p "$temp_dir"
    
    # Find all deployment files
    local deployment_files=$(find "$env_dir" -name "*.yaml" -o -name "*.yml" | grep -E 'deployment|statefulset|daemonset')
    
    for file in $deployment_files; do
        local base_name=$(basename "$file")
        local temp_file="${temp_dir}/${base_name}"
        
        print_message "Updating manifest: $base_name"
        
        # Extract service name from filename (assuming naming convention service-deployment.yaml)
        local service_name=$(echo "$base_name" | sed -E 's/([a-zA-Z0-9-]+)-deployment.ya?ml/\1/')
        
        # Skip if a specific service was requested and this is not it
        if [ -n "$SPECIFIC_SERVICE" ] && [ "$service_name" != "$SPECIFIC_SERVICE" ]; then
            continue
        fi
        
        # Update image tags in the manifest file
        sed -E "s|image:.*/${service_name}:.*|image: ${REGISTRY_URL}/${service_name}:${version}-${env}|g" "$file" > "$temp_file"
        
        # Replace original file with modified file
        mv "$temp_file" "$file"
    done
    
    # Clean up temporary directory
    rmdir "$temp_dir"
    
    print_success "Kubernetes manifests updated successfully"
    return 0
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    local env="$1"
    
    print_message "Deploying to Kubernetes for environment: $env"
    
    # Define the directory containing Kubernetes manifests
    local k8s_dir="${ROOT_DIR}/infrastructure/kubernetes"
    local env_dir="${k8s_dir}/${env}"
    local namespace_file="${k8s_dir}/namespace-${env}.yaml"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        return 1
    fi
    
    # Check if we can connect to the Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        return 1
    fi
    
    # Check if namespace file exists, if not create it
    if [ ! -f "$namespace_file" ]; then
        print_message "Creating namespace file: $namespace_file"
        cat > "$namespace_file" <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $NAMESPACE
EOF
    fi
    
    # Apply the namespace
    print_message "Creating/updating namespace: $NAMESPACE"
    kubectl apply -f "$namespace_file"
    
    # Apply all manifests in the environment directory
    print_message "Applying Kubernetes manifests from $env_dir"
    
    if [ -n "$SPECIFIC_SERVICE" ]; then
        # Apply only manifests for the specific service
        local service_files=$(find "$env_dir" -name "${SPECIFIC_SERVICE}*.yaml" -o -name "${SPECIFIC_SERVICE}*.yml")
        for file in $service_files; do
            print_message "Applying manifest: $(basename "$file")"
            kubectl apply -f "$file" -n "$NAMESPACE"
        done
    else
        # Apply all manifests
        kubectl apply -f "$env_dir" -n "$NAMESPACE"
    fi
    
    # Verify the deployment by checking the rollout status of critical deployments
    print_message "Verifying deployment..."
    
    local critical_services="api-gateway auth-service profile-service tribe-service"
    for service in $critical_services; do
        # Skip if a specific service was requested and this is not it
        if [ -n "$SPECIFIC_SERVICE" ] && [ "$service" != "$SPECIFIC_SERVICE" ]; then
            continue
        fi
        
        print_message "Checking rollout status for $service"
        if ! kubectl rollout status deployment/$service -n "$NAMESPACE" --timeout=300s; then
            print_error "Deployment of $service failed or timed out"
            print_error "Check the logs with: kubectl logs deployment/$service -n $NAMESPACE"
            return 1
        fi
    done
    
    print_success "Deployment to $env environment completed successfully"
    return 0
}

# Main function
main() {
    # Parse command-line arguments
    parse_args "$@"
    
    # Show help if requested
    if [ "$SHOW_HELP" = true ]; then
        usage
        return 0
    fi
    
    print_message "Starting deployment process for environment: $ENV"
    
    # Build and push containers if not skipped
    if [ "$DEPLOY_ONLY" = false ]; then
        build_all_services "$ENV" "$VERSION"
    fi
    
    # Update manifests and deploy if not skipped
    if [ "$BUILD_ONLY" = false ]; then
        update_kubernetes_manifests "$ENV" "$VERSION"
        deploy_to_kubernetes "$ENV"
    fi
    
    print_success "Deployment script completed successfully"
    return 0
}

# Execute main function with all arguments
main "$@"