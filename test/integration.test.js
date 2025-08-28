#!/usr/bin/env node

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const npmStart = 'npm start --silent';

describe('envchecker integration tests', () => {
  test('should validate deployment against env file - specific variables', () => {
    const deploymentFile = path.join(__dirname, 'fixtures/deployments/simple-deployment.yml');
    const envFile = path.join(__dirname, 'fixtures/env-files/valid.env');
    
    const output = execSync(`${npmStart} "${deploymentFile}" "${envFile}"`, {
      cwd: rootDir,
      encoding: 'utf8'
    });
    
    assert(output.includes('--- Container: test-container ---'), 'Should show container name');

    assert(output.includes('$LOG_LEVEL -> ✅ Exists'), 'LOG_LEVEL should exist in valid.env');
    assert(output.includes('$GOMAXPROCS -> ✅ Exists'), 'GOMAXPROCS should exist in valid.env');
    
    assert(output.includes('$MISSING_TOKEN -> ❌ DOES NOT EXIST'), 'MISSING_TOKEN should not exist in valid.env');
  });

  test('should validate deployment against jenkinsfile - specific variables', () => {
    const deploymentFile = path.join(__dirname, 'fixtures/deployments/test-deployment.yml');
    const jenkinsFile = path.join(__dirname, 'fixtures/jenkinsfiles/Jenkinsfile.simple');
    
    const output = execSync(`${npmStart} "${deploymentFile}" "${jenkinsFile}"`, {
      cwd: rootDir,
      encoding: 'utf8'
    });
    
    assert(output.includes('--- Container: web-server ---'), 'Should show web-server container');
    assert(output.includes('$LOG_LEVEL -> ✅ Exists'), 'LOG_LEVEL should exist in Jenkinsfile');
    assert(output.includes('$DATABASE_URL -> ✅ Exists'), 'DATABASE_URL should exist in Jenkinsfile');
    assert(output.includes('$API_BASE_URL -> ✅ Exists'), 'API_BASE_URL should exist in Jenkinsfile');
    assert(output.includes('$MISSING_VARIABLE -> ❌ DOES NOT EXIST'), 'MISSING_VARIABLE should not exist in Jenkinsfile');
    
    assert(output.includes('--- Container: background-worker ---'), 'Should show background-worker container');
    assert(output.includes('$REDIS_URL -> ✅ Exists'), 'REDIS_URL should exist in Jenkinsfile');
    assert(output.includes('$DEBUG_MODE -> ✅ Exists'), 'DEBUG_MODE should exist in Jenkinsfile');
    assert(output.includes('$REPLICA_COUNT -> ✅ Exists'), 'REPLICA_COUNT should exist in Jenkinsfile');
  });

  test('should handle invalid deployment file', () => {
    const invalidFile = path.join(__dirname, 'fixtures/env-files/valid.env'); // Wrong file type
    const envFile = path.join(__dirname, 'fixtures/env-files/valid.env');
    
    assert.throws(() => {
      execSync(`${npmStart} "${invalidFile}" "${envFile}"`, {
        cwd: rootDir,
        encoding: 'utf8'
      });
    }, 'Should throw error for invalid deployment file');
  });

  test('should handle missing files', () => {
    const nonExistentFile = path.join(__dirname, 'fixtures/nonexistent.yml');
    const envFile = path.join(__dirname, 'fixtures/env-files/valid.env');
    
    assert.throws(() => {
      execSync(`${npmStart} "${nonExistentFile}" "${envFile}"`, {
        cwd: rootDir,
        encoding: 'utf8'
      });
    }, 'Should throw error for missing files');
  });

  test('should handle deployments with no environment variables', () => {
    const deploymentFile = path.join(__dirname, 'fixtures/deployments/empty-env-deployment.yml');
    const envFile = path.join(__dirname, 'fixtures/env-files/valid.env');
    
    const output = execSync(`${npmStart} "${deploymentFile}" "${envFile}"`, {
      cwd: rootDir,
      encoding: 'utf8'
    });
    
    assert(output.includes('--- Container: basic-container ---'), 'Should show container name');
    assert(output.includes('No environment variables found.'), 'Should show no environment variables message');
  });
});
