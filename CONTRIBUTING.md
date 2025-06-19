# Contributing to STL Analysis & Electroplating Calculator

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Docker (optional)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electroplating
   ```

2. **Backend Setup**
   ```bash
   cd api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

## 🧪 Testing

### Backend Tests

```bash
cd api
pytest -v --cov=api --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Run the full test suite
./run-tests.sh
```

## 📝 Code Style

### Python (Backend)

We use:
- **Black** for code formatting
- **Flake8** for linting
- **MyPy** for type checking

```bash
# Format code
black api/

# Lint code
flake8 api/

# Type checking
mypy api/
```

### TypeScript/React (Frontend)

We use:
- **ESLint** for linting
- **Prettier** for formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation

3. **Run tests**
   ```bash
   # Backend
   cd api && pytest
   
   # Frontend
   cd frontend && npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new electroplating calculation feature"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Pull Request Guidelines

### Before submitting a PR:

- [ ] Code follows the style guidelines
- [ ] All tests pass
- [ ] New functionality has tests
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Python version
   - Node.js version
   - Browser (if applicable)

2. **Steps to reproduce**
   - Clear, step-by-step instructions
   - Sample STL file (if relevant)

3. **Expected vs actual behavior**
   - What you expected to happen
   - What actually happened

4. **Additional context**
   - Screenshots
   - Error messages
   - Console logs

## 💡 Feature Requests

When requesting features:

1. **Describe the problem**
   - What problem does this solve?
   - Who would benefit from this?

2. **Propose a solution**
   - How should this work?
   - Any technical considerations?

3. **Provide context**
   - Use cases
   - Examples
   - Mockups (if applicable)

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. **DO** email the maintainers directly
3. **DO** provide detailed information about the vulnerability

## 📚 Documentation

When updating documentation:

- Keep it clear and concise
- Include examples where helpful
- Update both README and API docs
- Test all code examples

## 🤝 Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the project's coding standards

## 📞 Getting Help

- Check existing issues and discussions
- Join our community chat (if available)
- Create a new issue for questions
- Tag issues appropriately

Thank you for contributing! 🎉 