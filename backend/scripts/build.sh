#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define directories
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# Define available services
SERVICES="shared api-gateway auth-service profile-service tribe-service matching-service event-service engagement-service planning-service payment-service notification-service ai-orchestration-service"

# Utility functions for printing formatted messages
print_message() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "\033[1;34m[${timestamp}] [INFO] $1\033[0m"
}

print_error() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "\033[1;31m[${timestamp}] [ERROR] $1\033[0m" >&2
}

print_success() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "\033[1;32m[${timestamp}] [SUCCESS] $1\033[0m"
}

# Clean build artifacts for a specific service or all services
clean_build() {
    local service_name=$1
    
    if [ -n "$service_name" ]; then
        print_message "Cleaning build artifacts for service: $service_name"
        
        if [ -d "$ROOT_DIR/services/$service_name" ]; then
            rm -rf "$ROOT_DIR/services/$service_name/dist"
            rm -rf "$ROOT_DIR/services/$service_name/node_modules/.cache" 2>/dev/null || true
            print_message "Cleaned $service_name build artifacts"
        else
            print_error "Service directory not found: $service_name"
            return 1
        fi
    else
        print_message "Cleaning build artifacts for all services"
        for service in $SERVICES; do
            if [ -d "$ROOT_DIR/services/$service" ]; then
                rm -rf "$ROOT_DIR/services/$service/dist"
                rm -rf "$ROOT_DIR/services/$service/node_modules/.cache" 2>/dev/null || true
                print_message "Cleaned $service build artifacts"
            fi
        done
    fi
    
    print_success "Build artifacts cleaned successfully"
    return 0
}

# Build a specific microservice
build_service() {
    local service_name=$1
    
    print_message "Building service: $service_name"
    
    if [ ! -d "$ROOT_DIR/services/$service_name" ]; then
        print_error "Service directory not found: $service_name"
        return 1
    fi
    
    cd "$ROOT_DIR/services/$service_name"
    
    # Check if node_modules exists, if not run npm install
    if [ ! -d "node_modules" ]; then
        print_message "Installing dependencies for $service_name"
        npm install
    fi
    
    # Check if the service has a build script in package.json
    if grep -q "\"build\":" package.json; then
        print_message "Running npm build script for $service_name"
        npm run build
    else
        print_message "Running TypeScript compiler for $service_name"
        npx tsc --project tsconfig.json
    fi
    
    cd "$ROOT_DIR"
    
    print_success "Service built successfully: $service_name"
    return 0
}

# Build all microservices
build_all_services() {
    print_message "Building all microservices..."
    
    # Build shared library first (as other services may depend on it)
    if [ -d "$ROOT_DIR/services/shared" ]; then
        build_service "shared" || return 1
    fi
    
    # Build the API gateway next as it may be required by other services
    if [ -d "$ROOT_DIR/services/api-gateway" ]; then
        build_service "api-gateway" || return 1
    fi
    
    # Build the rest of the services
    for service in $SERVICES; do
        if [ "$service" != "shared" ] && [ "$service" != "api-gateway" ] && [ -d "$ROOT_DIR/services/$service" ]; then
            build_service "$service" || return 1
        fi
    done
    
    print_success "All services built successfully"
    return 0
}

# Show help message
show_help() {
    echo "Usage: $0 [options] [service_name]"
    echo
    echo "Options:"
    echo "  --clean        Clean build artifacts before building"
    echo "  --help         Show this help message"
    echo
    echo "Arguments:"
    echo "  service_name   Name of the service to build (optional)"
    echo "                 If not provided, all services will be built"
    echo
    echo "Available services:"
    for service in $SERVICES; do
        echo "  - $service"
    done
}

# Main function
main() {
    local clean=false
    local specific_service=""
    
    # Process command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean=true
                shift
                ;;
            --help)
                show_help
                return 0
                ;;
            -*)
                print_error "Unknown option: $1"
                show_help
                return 1
                ;;
            *)
                if [ -z "$specific_service" ]; then
                    specific_service="$1"
                else
                    print_error "Too many arguments provided"
                    show_help
                    return 1
                fi
                shift
                ;;
        esac
    done
    
    # Clean build artifacts if requested
    if [ "$clean" = true ]; then
        clean_build "$specific_service" || return 1
    fi
    
    # Build services
    if [ -n "$specific_service" ]; then
        build_service "$specific_service" || return 1
    else
        build_all_services || return 1
    fi
    
    return 0
}

# Execute the main function with command line arguments
main "$@"