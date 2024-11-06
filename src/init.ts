import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { handleError } from './utils';
import { createClient } from './quickwit';
import { AnnoSearchError, AnnoSearchNetworkError, AnnoSearchValidationError } from './errors';

const contentType = 'application/yaml'; 
const quickwitClient = createClient(contentType);

// Function to read YAML configuration file
function readYamlConfig(filePath: string) {
    const yamlData = fs.readFileSync(filePath, 'utf8');
    return yaml.parse(yamlData);
}

// Function to modify the configuration with the provided index ID
function modifyConfig(config: any, indexId: string) {
    config.index_id = indexId;
    return yaml.stringify(config);
}


// Initialization function
export async function initIndex(indexId: string) {
    if (!indexId.trim()) {
        throw new AnnoSearchValidationError('Invalid indexId parameter');
    }
    const filePath = path.resolve(__dirname, 'index-config.yaml');
    try {
        const config = readYamlConfig(filePath);
        const modifiedYamlData = modifyConfig(config, indexId);
        const response = await quickwitClient.post('indexes', modifiedYamlData);
        if (!response.data) {
            throw new AnnoSearchValidationError('No response data received from Quickwit');
        }
        console.log('Response:', response.data);
    } catch (error: any) {
        handleError(error);
        if (error.response) {
            const statusCode = error.response.status;
            if (statusCode >= 500) {
                throw new AnnoSearchNetworkError(`Server error (${statusCode})`);
            } else if (statusCode >= 400) {
                throw new AnnoSearchNetworkError(`Client error (${statusCode})`);
            } else {
                throw new AnnoSearchError(`Unexpected error with status code ${statusCode}`);
            }
        } else {
            throw new AnnoSearchNetworkError('An error occurred during ingest processing');
        }
    }
}
