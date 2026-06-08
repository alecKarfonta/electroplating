# STL Analysis & Electroplating Calculator

A comprehensive full-stack application for analyzing STL files and calculating electroplating parameters for 3D printed objects. Features advanced rate limiting, colored logging, and automated CI/CD deployment.

## 🚀 Features

### Core Functionality
- **STL File Analysis**: Upload and analyze 3D mesh files
- **Mesh Statistics**: Comprehensive mesh analysis and statistics
- **Mesh Validation**: Identify and report mesh issues
- **Mesh Manipulation**: Scale, translate, and transform meshes
- **Cost Estimation**: Calculate 3D printing resin costs
- **Electroplating Calculations**: Advanced electroplating parameter calculations
- **3D Visualization**: Interactive 3D mesh viewer
- **Export Functionality**: Export analysis results in multiple formats

### New Features (v2.0)
- **🛡️ Rate Limiting**: Redis-backed rate limiting with endpoint-specific limits
- **🎨 Colored Logging**: Comprehensive logging with colored class/function names
- **📊 Monitoring**: Prometheus metrics and Grafana dashboards
- **🔄 CI/CD Pipeline**: Automated deployment to GitHub Container Registry
- **🔒 Security**: Enhanced security headers and SSL/TLS support
- **⚡ Performance**: Caching, connection pooling, and optimization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Redis Cache   │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Rate Limiting)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Prometheus    │    │   Grafana       │
│   (SSL/TLS)     │    │   (Monitoring)  │    │   (Dashboards)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- GitHub account (for CI/CD)

### 1. Clone and Deploy
```bash
# Clone the repository
git clone https://github.com/your-username/electroplating.git
cd electroplating

# Deploy with new features
./deploy.sh deploy
```

### 2. Access the Application

#### Live Demo
- **Production Service**: https://mlapi.us/plateforge/

#### Local Development
- **Frontend**: https://localhost
- **API Documentation**: https://localhost/api/docs
- **Monitoring**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3000 (Grafana)

## 📊 Rate Limiting

The application implements comprehensive rate limiting:

| Endpoint | Rate Limit | Window |
|----------|------------|---------|
| Upload | 10 requests | 1 hour |
| Analysis | 50 requests | 1 hour |
| Electroplating | 30 requests | 1 hour |
| General API | 100 requests | 1 hour |

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1640995200
```

## 🎨 Logging Features

### Colored Output
- **🔍 DEBUG**: Blue - Detailed debugging information
- **ℹ️ INFO**: Green - General information
- **⚠️ WARNING**: Yellow - Warning messages
- **❌ ERROR**: Red - Error messages
- **🚨 CRITICAL**: Magenta - Critical errors

### Class/Function Highlighting
- **RateLimiter**: Cyan
- **SessionManager**: Magenta
- **STLTools**: Green
- **FastAPI**: Blue

### Performance Tracking
```python
with PerformanceLogger(logger, "mesh analysis"):
    result = stl_tools.analyze_mesh()
# Output: ℹ️ Completed mesh analysis | duration_ms=1250
```

## 🔄 CI/CD Pipeline

### Automated Workflow
1. **Push to main** → Triggers CI/CD pipeline
2. **Run Tests** → Backend and frontend tests with coverage
3. **Security Scan** → Vulnerability scanning with Trivy
4. **Build Images** → Create Docker images
5. **Push to Registry** → Upload to `ghcr.io/your-username/electroplating`
6. **Create Release** → Generate GitHub release

### Manual Deployment
```bash
# Deploy to production
./deploy.sh deploy

# Check status
./deploy.sh status

# View logs
./deploy.sh logs
```

## 📈 Monitoring & Observability

### Metrics Available
- **Request Rate**: Requests per second
- **Response Time**: Average response time
- **Error Rate**: Error percentage
- **Rate Limiting**: Rate limit hits and blocks
- **Resource Usage**: CPU, memory, disk usage

### Dashboards
- **Application Overview**: Key metrics and health status
- **Rate Limiting**: Rate limit usage and blocks
- **Performance**: Response times and throughput
- **System**: Resource usage and system health

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8116
LOG_LEVEL=INFO
LOG_FILE=./logs/api.log

# Rate Limiting
REDIS_URL=redis://redis:6379
MAX_FILE_SIZE=104857600
SESSION_TIMEOUT=3600
MAX_SESSIONS=1000

# GitHub Container Registry
GITHUB_REPOSITORY=your-username/electroplating
```

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🛠️ Development

### Local Development
```bash
# Backend
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```

### Testing
```bash
# Backend tests
cd api
pytest -v --cov=api

# Frontend tests
cd frontend
npm test
```

## 📚 API Documentation

### Key Endpoints

#### File Management
- `POST /upload` - Upload STL file
- `GET /sessions` - List active sessions
- `DELETE /sessions/{session_id}` - Delete session

#### Analysis
- `GET /sessions/{session_id}/analysis` - Get mesh statistics
- `GET /sessions/{session_id}/validation` - Validate mesh
- `GET /sessions/{session_id}/info` - Get basic mesh info

#### Manipulation
- `POST /sessions/{session_id}/scale` - Scale mesh
- `POST /sessions/{session_id}/translate` - Translate mesh
- `POST /sessions/{session_id}/reset` - Reset to original

#### Calculations
- `POST /sessions/{session_id}/cost` - Estimate resin cost
- `POST /sessions/{session_id}/electroplating` - Calculate electroplating parameters
- `POST /sessions/{session_id}/electroplating/recommendations` - Get metal-specific recommendations

#### Export
- `POST /sessions/{session_id}/export` - Export statistics

### Rate Limiting Headers
All API responses include rate limiting information:
```
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <reset_timestamp>
```

## 🔒 Security Features

### Rate Limiting
- **Nginx-level**: Request rate limiting at proxy level
- **Application-level**: Fine-grained rate limiting per endpoint
- **Redis-backed**: Distributed rate limiting for scalability

### Security Headers
- **HSTS**: HTTP Strict Transport Security
- **CSP**: Content Security Policy
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME type sniffing protection

### SSL/TLS
- **TLS 1.2/1.3**: Modern TLS protocols
- **Strong Ciphers**: Secure cipher suites
- **Certificate Management**: Automatic certificate generation

## 🚨 Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   ```
   HTTP 429 Too Many Requests
   Retry-After: 3600
   ```
   - Wait for rate limit window to reset
   - Check request frequency

2. **Redis Connection Failed**
   ```
   RateLimiter: Redis connection failed
   ```
   - Application falls back to in-memory rate limiting
   - Check Redis service status

3. **SSL Certificate Issues**
   ```
   SSL certificate not found
   ```
   - Run `./deploy.sh deploy` to generate certificates
   - Or place certificates in `ssl/` directory

### Log Analysis
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View rate limiting logs
docker-compose -f docker-compose.prod.yml logs -f backend | grep "RateLimiter"

# View performance logs
docker-compose -f docker-compose.prod.yml logs -f backend | grep "duration_ms"
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Three.js](https://threejs.org/) for 3D visualization
- [Redis](https://redis.io/) for rate limiting
- [Prometheus](https://prometheus.io/) for monitoring
- [Grafana](https://grafana.com/) for dashboards

## 📞 Support

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/electroplating/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/electroplating/discussions)
