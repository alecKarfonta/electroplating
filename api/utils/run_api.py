#!/usr/bin/env python3
"""
STL API Startup Script

This script provides an easy way to start the STL Analysis API with different configurations.
"""

import os
import sys
import argparse
import uvicorn
from pathlib import Path

# Add the parent directory to the path so we can import the STL module
sys.path.insert(0, str(Path(__file__).parent.parent))

def main():
    """Main function to start the API server."""
    parser = argparse.ArgumentParser(
        description="Start the STL Analysis API server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_api.py                    # Start with default settings
  python run_api.py --host 0.0.0.0     # Allow external connections
  python run_api.py --port 9000        # Use custom port
  python run_api.py --reload           # Enable auto-reload for development
  python run_api.py --debug            # Enable debug mode
        """
    )
    
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=8116,
        help="Port to bind to (default: 8116)"
    )
    
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with detailed logging"
    )
    
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of worker processes (default: 1)"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["critical", "error", "warning", "info", "debug", "trace"],
        default="info",
        help="Log level (default: info)"
    )
    
    args = parser.parse_args()
    
    # Set log level based on debug flag
    if args.debug:
        args.log_level = "debug"
    
    # Check if required dependencies are available
    try:
        import fastapi
        import uvicorn
        from api.main import app
    except ImportError as e:
        print(f"Error: Missing required dependency - {e}")
        print("Please install the API dependencies:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    
    # Check if STL dependencies are available
    try:
        import numpy
        from stl import mesh
    except ImportError as e:
        print(f"Warning: Missing STL dependency - {e}")
        print("Some features may not work. Install with:")
        print("  pip install -r ../requirements.txt")
    
    # Print startup information
    print("=" * 60)
    print("STL Analysis API")
    print("=" * 60)
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"Reload: {args.reload}")
    print(f"Debug: {args.debug}")
    print(f"Workers: {args.workers}")
    print(f"Log Level: {args.log_level}")
    print("=" * 60)
    
    if args.host == "0.0.0.0":
        print("⚠️  Warning: Server is accessible from external connections")
        print("   Make sure to configure security appropriately for production")
        print()
    
    print("Starting server...")
    print(f"API will be available at: http://{args.host}:{args.port}")
    print(f"Interactive docs: http://{args.host}:{args.port}/docs")
    print(f"ReDoc: http://{args.host}:{args.port}/redoc")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Start the server
        uvicorn.run(
            "api.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            workers=args.workers,
            log_level=args.log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 