#!/usr/bin/env node

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { z } from 'zod';

const envVarSchema = z.object({
    name: z.string(),
    value: z.string(),
});

const containerSchema = z.object({
    name: z.string(),
    env: z.array(envVarSchema).optional(),
});

const deploymentSchema = z.object({
    spec: z.object({
        template: z.object({
            spec: z.object({
                containers: z.array(containerSchema).min(1),
            }),
        }),
    }),
});

type Deployment = z.infer<typeof deploymentSchema>;

/**
 * The interface for a file parsing strategy.
 */
interface FileParsingStrategy {
    parse(fileContents: string): string[];
}

/**
 * Strategy for parsing .env files.
 * Extracts variable names from lines like 'VAR_NAME=value'.
 */
class EnvFileParsingStrategy implements FileParsingStrategy {
    parse(fileContents: string): string[] {
        return fileContents
            .split('\n')
            .flatMap(line => {
                const trimmedLine = line.trim();

                // Skip comments and empty lines
                if (trimmedLine.startsWith('#') || trimmedLine.length === 0) {
                    return [];
                }

                const separatorIndex = trimmedLine.indexOf('=');

                if (separatorIndex < 1) {
                    return [];
                }

                const key = trimmedLine.substring(0, separatorIndex).trim();

                return key ? [key] : [];
            });
    }
}

/**
 * Strategy for parsing Jenkinsfile files.
 */
class JenkinsfileParsingStrategy implements FileParsingStrategy {
    parse(fileContents: string): string[] {
        const lines = fileContents.split('\n');
        const regex = /^\s*env\.([a-zA-Z0-9_]+)\s*=/; // Matches 'env.VAR_NAME ='
        return lines
            .map(line => {
                const match = line.trim().match(regex);
                return match ? match[1] : null;
            })
            .filter((name): name is string => name !== null);
    }
}

/**
 * Selects the appropriate parsing strategy based on the file path.
 */
function getParsingStrategy(filePath: string): FileParsingStrategy {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.startsWith('jenkins')) {
        console.log("Using Jenkinsfile parsing strategy.\n");
        return new JenkinsfileParsingStrategy();
    }

    if (fileName.endsWith('.env')) {
        console.log("Using .env file parsing strategy.\n");
        return new EnvFileParsingStrategy();
    }

    throw new Error(`failed to determine strategy for file: ${fileName}`)
}

/**
 * Reads a file, selects the correct strategy to parse it,
 * and returns a Set of the environment variable names found.
 */
function getExistingEnvs(filePath: string): Set<string> {
    const strategy = getParsingStrategy(filePath);
    const fileContents = fs.readFileSync(path.resolve(filePath), 'utf8');
    const variables = strategy.parse(fileContents);
    return new Set(variables);
}

function extractVariable(value: string): string | null {
    if (!value.startsWith('$') && !value.startsWith('"$')) {
        return null
    }

    const match = value.match(/\$([a-zA-Z0-9_]+)/);
    
    // check if match method succeeded
    if (!match) {
        return null;
    }
    // check if the matched string adheres to $VAR or "$VAR"
    if (!match[1]) {
        return null;
    }

    return match[1];
}

try {
    const deploymentFilePath = process.argv[2];
    const existingEnvsFilePath = process.argv[3];

    if (!deploymentFilePath || !existingEnvsFilePath) {
        console.error("Error: Please provide paths for the deployment file and the allowed variables file.");
        console.log("Usage: npm start <path-to-deployment.yml> <path-to-allowed-vars-file>");
        process.exit(1);
    }


    const content = fs.readFileSync(path.resolve(deploymentFilePath), 'utf8');
    const result = deploymentSchema.safeParse(yaml.load(content));

    if (!result.success) {
        console.error("YAML validation failed", result.error);
        process.exit(1);
    }

    const deployment: Deployment = result.data;

    const existingEnvs = getExistingEnvs(existingEnvsFilePath);
    for (const container of deployment.spec.template.spec.containers) {
        console.log(`--- Container: ${container.name} ---`);
        if (!container.env || container.env.length === 0) {
            console.log("No environment variables found.");
            continue;
        }

        for (const env of container.env) {
            const val = extractVariable(env.value);
            if (!val) {
                continue;
            }
            console.log(
                `${env.value} -> ${existingEnvs.has(val) ? '✅ Exists' : '❌ DOES NOT EXIST'}`
            );
        }
        console.log('');
    }
} catch (error) {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
}
