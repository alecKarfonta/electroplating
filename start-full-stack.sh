#!/bin/bash

# STL Analysis Full Stack Startup Script

echo "🚀 Starting STL Analysis Full Stack Application..."

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

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

print_success "Python version: $(python3 --version)"
print_success "Node.js version: $(node --version)"

# Function to start backend
start_backend() {
    print_status "Starting backend API..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Start the API server
    print_status "Starting API server on http://localhost:8000"
    python -m api.main &
    BACKEND_PID=$!
    
    # Wait a moment for the server to start
    sleep 3
    
    # Check if backend is running
    if curl -s http://localhost:8000/ > /dev/null; then
        print_success "Backend API is running on http://localhost:8000"
    else
        print_error "Failed to start backend API"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend application..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Set environment variable
    export REACT_APP_API_URL=http://localhost:8000
    
    print_status "Starting frontend on http://localhost:3000"
    npm start &
    FRONTEND_PID=$!
    
    cd ..
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check command line arguments
if [ "$1" = "docker" ]; then
    print_status "Starting with Docker Compose..."
    docker compose up
elif [ "$1" = "backend-only" ]; then
    print_status "Starting backend only..."
    start_backend
    wait $BACKEND_PID
elif [ "$1" = "frontend-only" ]; then
    print_status "Starting frontend only..."
    start_frontend
    wait $FRONTEND_PID
else
    print_status "Starting full stack application..."
    
    # Start backend
    start_backend
    
    # Start frontend
    start_frontend
    
    print_success "Full stack application started!"
    print_status "Backend API: http://localhost:8000"
    print_status "Frontend: http://localhost:3000"
    print_status "API Documentation: http://localhost:8000/docs"
    print_warning "Press Ctrl+C to stop all services"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi 