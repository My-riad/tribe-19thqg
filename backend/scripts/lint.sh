#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the script directory and root directory
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# List of all services to lint
SERVICES="shared api-gateway auth-service profile-service tribe-service matching-service event-service engagement-service planning-service payment-service notification-service ai-orchestration-service"

# Print a formatted message
print_message() {
  echo -e "\033[1m$(date "+%H:%M:%S") >\033[0m \033[36m$1\033[0m"
}

# Print an error message
print_error() {
  echo -e "\033[1m$(date "+%H:%M:%S") >\033[0m \033[31mERROR: $1\033[0m"
}

# Print a success message
print_success() {
  echo -e "\033[1m$(date "+%H:%M:%S") >\033[0m \033[32m$1\033[0m"
}

# Lint a specific service
lint_service() {
  local service="$1"
  local fix_issues="$2"
  
  print_message "Linting $service..."
  
  # Check if the service directory exists
  if [ ! -d "$ROOT_DIR/$service" ]; then
    print_error "Service directory '$service' not found"
    return 1
  fi
  
  # Change to the service directory
  cd "$ROOT_DIR/$service"
  
  # Determine if we should fix issues
  local fix_flag=""
  if [ "$fix_issues" = true ]; then
    fix_flag="--fix"
  fi
  
  # Check if package.json exists and has a lint script
  if [ -f "package.json" ] && grep -q '"lint"[[:space:]]*:' package.json; then
    # Use the service's lint script
    if [ "$fix_issues" = true ]; then
      npm run lint -- --fix
    else
      npm run lint
    fi
  else
    # Run ESLint directly
    npx eslint "src/**/*.{ts,tsx}" $fix_flag
  fi
  
  # Return to the root directory
  cd "$ROOT_DIR"
  
  print_success "Linting $service complete"
  return 0
}

# Lint all services
lint_all_services() {
  local fix_issues="$1"
  
  print_message "Linting all services..."
  
  for service in $SERVICES; do
    lint_service "$service" "$fix_issues"
  done
  
  print_success "Linting all services complete"
  return 0
}

# Main function
main() {
  local fix_issues=false
  local specific_service=""
  
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --fix)
        fix_issues=true
        shift
        ;;
      *)
        if [ -z "$specific_service" ]; then
          specific_service="$1"
        fi
        shift
        ;;
    esac
  done
  
  # Lint specific service or all services
  if [ -n "$specific_service" ]; then
    # Check if the specified service exists in the SERVICES list
    if [[ "$SERVICES" =~ (^|[[:space:]])"$specific_service"($|[[:space:]]) ]]; then
      lint_service "$specific_service" "$fix_issues"
    else
      print_error "Service '$specific_service' not found"
      return 1
    fi
  else
    lint_all_services "$fix_issues"
  fi
  
  return 0
}

# Execute the main function with all script arguments
main "$@"