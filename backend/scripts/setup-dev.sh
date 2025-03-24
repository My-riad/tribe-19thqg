#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get script directory and root directory
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

# Define services
SERVICES="shared api-gateway auth-service profile-service tribe-service matching-service event-service engagement-service planning-service payment-service notification-service ai-orchestration-service"

# Utility functions for output formatting
print_message() {
    echo -e "\033[1;34m[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1\033[0m"
}

# Check if all required tools are installed
check_prerequisites() {
    print_message "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18.0.0 or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
    
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version is $NODE_VERSION. Version 18.0.0 or higher is required"
        exit 1
    fi
    
    # Check npm version
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm v8.0.0 or higher"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    NPM_MAJOR_VERSION=$(echo $NPM_VERSION | cut -d '.' -f 1)
    
    if [ "$NPM_MAJOR_VERSION" -lt 8 ]; then
        print_error "npm version is $NPM_VERSION. Version 8.0.0 or higher is required"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose"
        exit 1
    fi
    
    print_success "All prerequisites are met"
    return 0
}

# Set up environment configuration files
setup_environment() {
    print_message "Setting up environment configuration..."
    
    if [ ! -f "$ROOT_DIR/.env" ]; then
        if [ -f "$ROOT_DIR/.env.example" ]; then
            cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env.development"
            print_message "Created .env.development from .env.example"
            print_message "Please edit .env.development with your API keys and configuration"
            
            # Prompt user to edit the file
            read -p "Press Enter to continue after editing .env.development (or Ctrl+C to abort)..."
            
            # Create symlink from .env.development to .env
            ln -sf "$ROOT_DIR/.env.development" "$ROOT_DIR/.env"
            print_success "Created symlink from .env.development to .env"
        else
            print_error ".env.example file not found. Please create a .env file manually"
            exit 1
        fi
    else
        print_message ".env file already exists, skipping environment setup"
    fi
    
    return 0
}

# Install npm dependencies for all services
install_dependencies() {
    print_message "Installing dependencies..."
    
    # Install root dependencies
    cd "$ROOT_DIR"
    npm install
    
    # Install dependencies for each service
    for SERVICE in $SERVICES; do
        if [ -d "$ROOT_DIR/src/$SERVICE" ]; then
            print_message "Installing dependencies for $SERVICE..."
            cd "$ROOT_DIR/src/$SERVICE"
            npm install
            cd "$ROOT_DIR"
        fi
    done
    
    print_success "All dependencies installed"
    return 0
}

# Set up the database schema and initial data
setup_database() {
    print_message "Setting up database..."
    
    # Start PostgreSQL container if not already running
    if ! docker ps | grep -q postgres; then
        print_message "Starting PostgreSQL container..."
        docker-compose up -d postgres
    fi
    
    # Wait for PostgreSQL to be ready
    print_message "Waiting for PostgreSQL to be ready..."
    RETRIES=30
    while ! docker exec -it $(docker ps -q -f name=postgres) pg_isready -U postgres > /dev/null 2>&1; do
        RETRIES=$((RETRIES-1))
        if [ $RETRIES -eq 0 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
    # Run migrations
    print_message "Running database migrations..."
    cd "$ROOT_DIR"
    npx prisma migrate dev --name init
    
    # Seed the database
    print_message "Seeding the database..."
    npx ts-node scripts/db-seed.ts
    
    print_success "Database setup complete"
    return 0
}

# Set up Docker containers for local development
setup_docker() {
    print_message "Setting up Docker containers..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again"
        exit 1
    fi
    
    # Pull required Docker images
    print_message "Pulling required Docker images..."
    docker-compose pull postgres redis
    
    # Build service images
    print_message "Building service images..."
    docker-compose build
    
    # Create Docker volumes if they don't exist
    for VOLUME in $(docker-compose config --volumes); do
        if ! docker volume ls | grep -q "$VOLUME"; then
            print_message "Creating Docker volume: $VOLUME"
            docker volume create "$VOLUME"
        fi
    done
    
    print_success "Docker setup complete"
    return 0
}

# Set up Git hooks for pre-commit and pre-push checks
setup_git_hooks() {
    print_message "Setting up Git hooks..."
    
    # Install Husky
    cd "$ROOT_DIR"
    npm run prepare
    
    # Configure lint-staged
    if [ ! -f "$ROOT_DIR/.lintstagedrc" ]; then
        cat > "$ROOT_DIR/.lintstagedrc" << EOL
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml}": [
    "prettier --write"
  ]
}
EOL
        print_message "Created .lintstagedrc configuration"
    fi
    
    print_success "Git hooks setup complete"
    return 0
}

# Main function
main() {
    print_message "Starting Tribe platform development environment setup..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_docker
    setup_database
    setup_git_hooks
    
    print_success "Setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Start the development environment: npm run dev"
    echo "2. Access the API documentation: http://localhost:3000/api-docs"
    echo "3. Explore the admin dashboard: http://localhost:3000/admin"
    echo ""
    echo "Happy coding! 🚀"
    
    return 0
}

# Execute main function
main