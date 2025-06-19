# Project Structure

This document provides an overview of the project's file and directory structure.

## Root Directory

```
electroplating/
├── api/                    # Backend API (FastAPI)
├── frontend/              # React frontend application
├── venv/                  # Python virtual environment (gitignored)
├── .git/                  # Git repository
├── .gitignore            # Git ignore rules
├── .gitattributes        # Git attributes
├── .dockerignore         # Docker ignore rules
├── README.md             # Project documentation
├── PROJECT_STRUCTURE.md  # This file
├── requirements.txt      # Python dependencies
├── setup.py             # Python package setup
├── setup-env.sh         # Environment setup script
├── start-full-stack.sh  # Full stack startup script
├── docker-run.sh        # Docker run script
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker image definition
├── nginx.conf           # Nginx configuration
├── test_stl_tools.py    # Test suite
└── example_usage.py     # Usage examples
```

## Backend (`api/`)

```
api/
├── __init__.py
├── main.py              # FastAPI application entry point
├── core/
│   ├── __init__.py
│   ├── models.py        # Data models
│   ├── session_manager.py # Session management
│   └── stl_tools.py     # STL analysis tools
├── tests/
│   ├── __init__.py
│   └── test_api.py      # API tests
├── utils/
│   ├── __init__.py
│   ├── client_example.py # API client example
│   └── run_api.py       # API runner utility
└── README.md            # API documentation
```

## Frontend (`frontend/`)

```
frontend/
├── public/
│   └── index.html       # HTML template
├── src/
│   ├── index.tsx        # React entry point
│   ├── App.tsx          # Main application component
│   ├── components/      # React components
│   │   ├── CostCalculator.tsx
│   │   ├── FileUpload.tsx
│   │   ├── MeshStats.tsx
│   │   └── STLViewer.tsx
│   ├── services/        # API service layer
│   │   └── api.ts
│   └── types/           # TypeScript type definitions
│       └── api.ts
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
├── Dockerfile           # Frontend Docker image
├── nginx.conf           # Frontend nginx config
├── start-dev.sh         # Development startup script
└── README.md            # Frontend documentation
```

## Key Files

### Configuration Files
- **`docker-compose.yml`**: Orchestrates the full application stack
- **`nginx.conf`**: Reverse proxy configuration for production
- **`requirements.txt`**: Python package dependencies
- **`package.json`**: Node.js dependencies (in frontend/)
- **`tsconfig.json`**: TypeScript configuration (in frontend/)

### Scripts
- **`setup-env.sh`**: Automated environment setup
- **`start-full-stack.sh`**: Starts the complete application
- **`docker-run.sh`**: Docker deployment script

### Documentation
- **`README.md`**: Main project documentation
- **`PROJECT_STRUCTURE.md`**: This file
- **`example_usage.py`**: Python usage examples
- **`test_stl_tools.py`**: Test suite

## Development Workflow

1. **Setup**: Run `./setup-env.sh` to set up the development environment
2. **Development**: Use `./start-full-stack.sh` to start both frontend and backend
3. **Testing**: Run tests with `python test_stl_tools.py` and `cd frontend && npm test`
4. **Deployment**: Use Docker with `docker-compose up --build`

## Ignored Files

The following files and directories are ignored by Git:
- `venv/`: Python virtual environment
- `logs/`: Application logs
- `sessions/`: Temporary session data
- `*.json`: Generated analysis files (except package.json, tsconfig.json)
- `__pycache__/`: Python bytecode cache
- `.env`: Environment variables 