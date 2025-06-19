#!/bin/bash

# STL Analysis API Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "STL Analysis API Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  run       Run the API container"
    echo "  start     Start the API with docker-compose"
    echo "  stop      Stop the API"
    echo "  restart   Restart the API"
    echo "  logs      Show container logs"
    echo "  shell     Open shell in running container"
    echo "  clean     Clean up containers and images"
    echo "  prod      Start with production setup (nginx)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 prod"
}

# Function to build the image
build_image() {
    print_status "Building STL Analysis API Docker image..."
    docker build -t stl-analysis-api .
    print_success "Image built successfully!"
}

# Function to run the container
run_container() {
    print_status "Running STL Analysis API container..."
    docker run -d \
        --name stl-analysis-api \
        -p 8000:8000 \
        -v "$(pwd)/sessions:/app/sessions" \
        -v "$(pwd)/logs:/app/logs" \
        --restart unless-stopped \
        stl-analysis-api
    print_success "Container started! API available at http://localhost:8000"
}

# Function to start with docker-compose
start_compose() {
    print_status "Starting STL Analysis API with docker-compose..."
    docker-compose up -d
    print_success "API started! Available at http://localhost:8000"
    print_status "API Documentation: http://localhost:8000/docs"
}

# Function to start production setup
start_production() {
    print_status "Starting STL Analysis API with production setup..."
    docker-compose --profile production up -d
    print_success "Production setup started!"
    print_status "API available at http://localhost (via nginx)"
    print_status "Direct API access: http://localhost:8000"
}

# Function to stop the API
stop_api() {
    print_status "Stopping STL Analysis API..."
    docker-compose down
    print_success "API stopped!"
}

# Function to restart the API
restart_api() {
    print_status "Restarting STL Analysis API..."
    docker-compose restart
    print_success "API restarted!"
}

# Function to show logs
show_logs() {
    print_status "Showing container logs..."
    docker-compose logs -f
}

# Function to open shell in container
open_shell() {
    print_status "Opening shell in container..."
    docker-compose exec stl-api bash
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up containers and images..."
        docker-compose down -v
        docker rmi stl-analysis-api 2>/dev/null || true
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script logic
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        run_container
        ;;
    start)
        start_compose
        ;;
    stop)
        stop_api
        ;;
    restart)
        restart_api
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    clean)
        cleanup
        ;;
    prod)
        start_production
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac 