#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define base directories
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# List of all microservices
SERVICES="shared api-gateway auth-service profile-service tribe-service matching-service event-service engagement-service planning-service payment-service notification-service ai-orchestration-service"

# Utility functions for formatted output
print_message() {
    echo -e "\033[1;36m[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1\033[0m"
}

# Run unit tests for a specific service
run_unit_tests() {
    local service_name=$1
    
    print_message "Running unit tests for $service_name service"
    
    # Navigate to service directory
    cd "$ROOT_DIR/$service_name"
    
    # Run Jest with the service's configuration
    npx jest --config jest.config.js
    
    # Return to the original directory
    cd "$ROOT_DIR"
    
    print_success "Unit tests completed for $service_name service"
    
    return 0
}

# Run integration tests (tests that span multiple services)
run_integration_tests() {
    print_message "Running integration tests"
    
    # Navigate to tests directory
    cd "$ROOT_DIR/tests"
    
    # Run Jest with the integration test configuration
    npx jest --config jest.integration.config.js
    
    # Return to the original directory
    cd "$ROOT_DIR"
    
    print_success "Integration tests completed"
    
    return 0
}

# Run end-to-end tests
run_e2e_tests() {
    print_message "Running end-to-end tests"
    
    # Navigate to tests directory
    cd "$ROOT_DIR/tests"
    
    # Run Jest with the e2e test configuration
    npx jest --config jest.e2e.config.js
    
    # Return to the original directory
    cd "$ROOT_DIR"
    
    print_success "End-to-end tests completed"
    
    return 0
}

# Generate a combined coverage report for all services
generate_coverage_report() {
    print_message "Generating coverage report"
    
    # Create temp directory for reports
    mkdir -p "$ROOT_DIR/coverage/temp"
    
    # Run Jest with coverage for all services
    for service in $SERVICES; do
        if [ -d "$ROOT_DIR/$service" ]; then
            print_message "Collecting coverage for $service"
            cd "$ROOT_DIR/$service"
            npx jest --coverage --coverageDirectory="$ROOT_DIR/coverage/temp/$service"
            cd "$ROOT_DIR"
        fi
    done
    
    # Merge coverage reports
    print_message "Merging coverage reports"
    cd "$ROOT_DIR"
    npx nyc merge coverage/temp coverage/.nyc_output/out.json
    
    # Generate HTML report
    npx nyc report --reporter=html --report-dir="$ROOT_DIR/coverage/html"
    
    print_success "Coverage report generated at: $ROOT_DIR/coverage/html/index.html"
    
    return 0
}

# Run all unit tests for all microservices
run_all_tests() {
    print_message "Running all unit tests"
    
    # Run shared library tests first as other services might depend on it
    if [ -d "$ROOT_DIR/shared" ]; then
        run_unit_tests "shared"
    fi
    
    # Run unit tests for each service
    for service in $SERVICES; do
        if [ -d "$ROOT_DIR/$service" ] && [ "$service" != "shared" ]; then
            run_unit_tests "$service"
        fi
    done
    
    print_success "All unit tests completed"
    
    return 0
}

# Main function to process arguments and run tests
main() {
    local args=("$@")
    
    # Display help if requested
    if [[ "${args[0]}" == "--help" || "${args[0]}" == "-h" ]]; then
        echo "Usage: $(basename "$0") [options] [service]"
        echo ""
        echo "Options:"
        echo "  --e2e         Run end-to-end tests"
        echo "  --integration Run integration tests"
        echo "  --coverage    Generate coverage report"
        echo "  --help, -h    Display this help message"
        echo ""
        echo "If a service name is provided, unit tests for that service will be run."
        echo "If no arguments are provided, unit tests for all services will be run."
        echo ""
        echo "Available services: $SERVICES"
        return 0
    fi
    
    # Parse command line arguments
    if [[ "${args[0]}" == "--e2e" ]]; then
        run_e2e_tests
    elif [[ "${args[0]}" == "--integration" ]]; then
        run_integration_tests
    elif [[ "${args[0]}" == "--coverage" ]]; then
        generate_coverage_report
    elif [[ "${#args[@]}" -eq 1 && "${args[0]}" != "" ]]; then
        # Check if service exists
        if [[ "$SERVICES" == *"${args[0]}"* ]]; then
            run_unit_tests "${args[0]}"
        else
            print_error "Service '${args[0]}' not found"
            echo "Available services: $SERVICES"
            exit 1
        fi
    else
        run_all_tests
    fi
    
    return 0
}

# Execute main function with all command line arguments
main "$@"