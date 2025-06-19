# Deployment Guide

This guide covers deploying the STL Analysis & Electroplating Calculator with the new rate limiting, logging, and CI/CD features.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- GitHub repository with CI/CD pipeline configured
- GitHub Container Registry access (automatic with GitHub Actions)

### 1. Automatic Deployment (Recommended)

The application automatically deploys to GitHub Container Registry when you push to the `main` branch. The CI/CD pipeline:

1. **Runs Tests**: Backend and frontend tests with coverage reporting
2. **Security Scan**: Vulnerability scanning with Trivy
3. **Build Images**: Creates Docker images for backend and frontend
4. **Push to Registry**: Uploads images to `ghcr.io/your-username/electroplating`
5. **Create Release**: Generates GitHub release with changelog

### 2. Manual Deployment

```bash
# Clone the repository
git clone https://github.com/your-username/electroplating.git
cd electroplating

# Set your GitHub repository name
export GITHUB_REPOSITORY="your-username/electroplating"

# Deploy to production
./deploy.sh deploy
```

## 📊 New Features

### Rate Limiting

The application now includes comprehensive rate limiting:

- **Redis-based**: Uses Redis for distributed rate limiting (with in-memory fallback)
- **Endpoint-specific limits**:
  - Upload: 10 requests/hour
  - Analysis: 50 requests/hour
  - Electroplating: 30 requests/hour
  - General API: 100 requests/hour
- **User-based**: Rate limits per IP address
- **Headers**: Rate limit information in response headers

### Colored Logging

Enhanced logging with colors and structured data:

- **Colored output**: Different colors for log levels and components
- **Class/function highlighting**: Colored class and function names
- **Performance tracking**: Automatic timing for operations
- **Structured logging**: JSON format for log aggregation
- **Context-aware**: Request ID tracking and user context

### Monitoring & Observability

- **Prometheus metrics**: Application and system metrics
- **Grafana dashboards**: Pre-configured monitoring dashboards
- **Health checks**: Service health monitoring
- **Performance tracking**: Request timing and resource usage

## 🔧 Configuration

### Environment Variables

Create a `.env` file or set environment variables:

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
GITHUB_TOKEN=your-github-token  # For private repositories
```

### Production Configuration

For production deployment:

1. **SSL Certificates**: Place certificates in `ssl/` directory
2. **Environment**: Use production environment variables
3. **Monitoring**: Enable Prometheus and Grafana
4. **Backup**: Configure database and file backups

## 🐳 Docker Images

### Available Images

- **Backend**: `ghcr.io/your-username/electroplating/backend:latest`
- **Frontend**: `ghcr.io/your-username/electroplating/frontend:latest`

### Pulling Images

```bash
# Pull latest images
docker pull ghcr.io/your-username/electroplating/backend:latest
docker pull ghcr.io/your-username/electroplating/frontend:latest

# Pull specific version
docker pull ghcr.io/your-username/electroplating/backend:v1.0.0
```

## 📈 Monitoring

### Accessing Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **API Health**: https://localhost/health
- **API Metrics**: https://localhost/api/metrics

### Key Metrics

- **Request Rate**: Requests per second
- **Response Time**: Average response time
- **Error Rate**: Error percentage
- **Resource Usage**: CPU, memory, disk usage
- **Rate Limiting**: Rate limit hits and blocks

## 🔒 Security Features

### Rate Limiting

- **Nginx-level**: Request rate limiting at the proxy level
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
   - Wait for the rate limit window to reset
   - Check your request frequency

2. **Redis Connection Failed**
   ```
   RateLimiter: Redis connection failed
   ```
   - Check Redis service is running
   - Verify Redis URL configuration
   - Application will fallback to in-memory rate limiting

3. **SSL Certificate Issues**
   ```
   SSL certificate not found
   ```
   - Generate SSL certificates: `./deploy.sh deploy`
   - Or place your certificates in `ssl/` directory

### Log Analysis

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# View rate limiting logs
docker-compose -f docker-compose.prod.yml logs -f backend | grep "RateLimiter"
```

### Performance Issues

1. **High Response Times**
   - Check Redis performance
   - Monitor system resources
   - Review rate limiting configuration

2. **Memory Usage**
   - Monitor session cleanup
   - Check file upload sizes
   - Review caching configuration

## 🔄 CI/CD Pipeline

### Pipeline Stages

1. **Test**: Run backend and frontend tests
2. **Security**: Vulnerability scanning
3. **Build**: Create Docker images
4. **Push**: Upload to GitHub Container Registry
5. **Deploy**: Deploy to production (optional)
6. **Release**: Create GitHub release

### Manual Triggers

```bash
# Trigger deployment manually
gh workflow run ci-cd.yml

# Check workflow status
gh run list --workflow=ci-cd.yml
```

### Customization

Edit `.github/workflows/ci-cd.yml` to:

- Add deployment environments
- Configure notification channels
- Add additional security scans
- Customize build parameters

## 📚 Additional Resources

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section
2. Review application logs
3. Check GitHub Issues
4. Create a new issue with detailed information 