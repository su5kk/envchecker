# Test Organization

This directory contains all test files and fixtures for the envchecker project.

## Directory Structure

```
test/
├── fixtures/                    # Test data files
│   ├── deployments/            # Kubernetes deployment YAML files
│   ├── env-files/              # Environment variable files (.env format)
│   └── jenkinsfiles/           # Jenkins pipeline files
├── integration.test.js         # End-to-end CLI testing
└── README.md                  # This file
```

## Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

## Test Scenarios

### Integration Tests (`integration.test.js`)
- CLI execution with various file combinations
- Specific variable validation (✅/❌ indicators)
- Error handling for invalid inputs and missing files
- Multi-container deployment validation
- Edge cases (deployments with no environment variables)

## Test Fixtures

### Deployments
- `simple-deployment.yml` - Minimal deployment for basic testing
- `test-deployment.yml` - Multi-container deployment for comprehensive testing
- `empty-env-deployment.yml` - Deployment with no environment variables (edge case testing)

### Environment Files
- `valid.env` - Contains common environment variables for testing

### Jenkinsfiles
- `Jenkinsfile.simple` - Simplified Jenkins pipeline with clean environment variable definitions

## Adding New Tests

1. **Integration Tests**: Add to `integration.test.js` for testing CLI behavior
2. **New Fixtures**: Add to appropriate `fixtures/` subdirectory and reference in tests