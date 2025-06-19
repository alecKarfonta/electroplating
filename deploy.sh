#!/bin/bash

# Production Deployment Script for STL Analysis & Electroplating Calculator
# This script deploys the application using Docker Compose with GitHub Container Registry images

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-"your-username/electroplating"}
REGISTRY="ghcr.io"
BACKEND_IMAGE="${REGISTRY}/${GITHUB_REPOSITORY}/backend"
FRONTEND_IMAGE="${REGISTRY}/${GITHUB_REPOSITORY}/frontend"

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p sessions
    mkdir -p ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_success "Directories created"
}

# Function to generate self-signed SSL certificate (for development)
generate_ssl_cert() {
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_status "Generating self-signed SSL certificate..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_success "SSL certificate generated"
    else
        print_status "SSL certificate already exists"
    fi
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images..."
    
    # Set GitHub Container Registry credentials if available
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
    fi
    
    docker pull "${BACKEND_IMAGE}:latest" || print_warning "Could not pull backend image"
    docker pull "${FRONTEND_IMAGE}:latest" || print_warning "Could not pull frontend image"
    
    print_success "Images pulled successfully"
}

# Function to stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    print_success "Containers stopped"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Set environment variable for Docker Compose
    export GITHUB_REPOSITORY=$GITHUB_REPOSITORY
    
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services started"
}

# Function to wait for services to be healthy
wait_for_health() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for Redis
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is healthy"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Redis failed to become healthy"
        exit 1
    fi
    
    # Wait for Backend
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend is healthy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Backend failed to become healthy"
        exit 1
    fi
    
    # Wait for Frontend
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3017 > /dev/null 2>&1; then
            print_success "Frontend is healthy"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Frontend failed to become healthy"
        exit 1
    fi
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    print_status "Service URLs:"
    echo "  Frontend: https://localhost"
    echo "  Backend API: https://localhost/api"
    echo "  API Documentation: https://localhost/api/docs"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3000 (admin/admin)"
    
    echo ""
    print_status "Logs:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Backend logs: docker-compose -f docker-compose.prod.yml logs -f backend"
    echo "  Frontend logs: docker-compose -f docker-compose.prod.yml logs -f frontend"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application (default)"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show logs"
    echo "  status     - Show status"
    echo "  clean      - Remove all containers and volumes"
    echo "  help       - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_REPOSITORY - GitHub repository (default: your-username/electroplating)"
    echo "  GITHUB_TOKEN      - GitHub token for private repositories"
    echo "  GITHUB_USERNAME   - GitHub username for private repositories"
}

# Main deployment function
deploy() {
    print_status "Starting deployment..."
    
    check_docker
    check_docker_compose
    create_directories
    generate_ssl_cert
    pull_images
    stop_containers
    start_services
    wait_for_health
    show_status
    
    print_success "Deployment completed successfully!"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    stop)
        print_status "Stopping services..."
        docker-compose -f docker-compose.prod.yml down
        print_success "Services stopped"
        ;;
    restart)
        print_status "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        print_success "Services restarted"
        ;;
    logs)
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    status)
        show_status
        ;;
    clean)
        print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            print_status "Cleaning up..."
            docker-compose -f docker-compose.prod.yml down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac 