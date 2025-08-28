# EnvChecker

A CLI tool written in Typescript to check environment variables consistency for your deployments.

## Features

- **Multi-format Support**: Parse environment variables from `.env` files and Jenkins pipeline files
- **Variable Validation**: Cross-reference deployment environment variables against allowed lists
- **Schema Validation**: Strict YAML validation using Zod for deployment files

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Build the CLI
```bash
npm run build
```

## Usage

### Basic Usage
```bash
# Using npm start (development)
npm start <deployment-file> <env-vars-file>

# Using built CLI
npx envchecker <deployment-file> <env-vars-file>
```

### Examples

#### Validate against .env file
```bash
npm start test/fixtures/deployments/simple-deployment.yml test/fixtures/env-files/valid.env
```

#### Validate against Jenkinsfile
```bash
npm start test/fixtures/deployments/test-deployment.yml test/fixtures/jenkinsfiles/Jenkinsfile.simple
```

### Sample Output
```
npm start test/fixtures/deployments/test-deployment.yml test/fixtures/jenkinsfiles/Jenkinsfile.simple

--- Container: web-server ---
$LOG_LEVEL -> ✅ Exists
$DATABASE_URL -> ✅ Exists
$API_BASE_URL -> ✅ Exists
$MISSING_VARIABLE -> ❌ DOES NOT EXIST

--- Container: background-worker ---
$REDIS_URL -> ✅ Exists
$DEBUG_MODE -> ✅ Exists
$REPLICA_COUNT -> ✅ Exists
```

## Supported File Types

### Environment Files (.env)
Parses standard `.env` format:
```env
# Comments are ignored
LOG_LEVEL=info
DATABASE_URL=postgres://localhost:5432/mydb
API_TOKEN=secret123
```

### Jenkins Pipeline Files
Extracts variables from `env.VAR_NAME` assignments:
```groovy
pipeline {
  stages {
    stage('Deploy') {
      steps {
        script {
          env.LOG_LEVEL = 'debug'
          env.DATABASE_URL = 'postgres://db.example.com'
          env.API_TOKEN = 'production-token'
        }
      }
    }
  }
}
```

### Kubernetes Deployment Files
Validates environment variables in container specs:
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: app
          env:
            - name: LOG_LEVEL
              value: $LOG_LEVEL          # ✅ Will be validated
            - name: API_TOKEN  
              value: "$API_TOKEN"        # ✅ Will be validated
            - name: STATIC_VALUE
              value: "not-a-variable"    # ⏭️ Ignored (not a variable)
```

## Development

### Available Scripts
```bash
# Clean build artifacts
npm run clean

# Build the project
npm run build

# Run in development mode
npm start <args>

# Run tests
npm test

# Watch mode for development
npm run test:watch
```

### Architecture

The tool uses the **Strategy Pattern** to handle different file types:

- **`EnvFileParsingStrategy`**: Parses `.env` files to extract variable names
- **`JenkinsfileParsingStrategy`**: Parses Jenkinsfiles to extract `env.VAR_NAME` patterns

Validation flow:
1. Parse deployment YAML and validate structure with Zod
2. Extract environment variables from container specifications  
3. Select appropriate parsing strategy for reference file
4. Cross-reference variables and report missing ones

## Testing

- **Integration Tests**: Test end-to-end CLI behavior with various file combinations
- **Test Fixtures**: Organized test data in `test/fixtures/` directory

Run tests to verify functionality:
```bash
npm test
```

## License

ISC License - see package.json for details.
