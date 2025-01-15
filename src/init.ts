import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';

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
        throw new AnnoSearchValidationError('Invalid index parameter');
    }
    const filePath = path.resolve(__dirname, 'index-config.yaml');
    const config = readYamlConfig(filePath);
    const modifiedYamlData = modifyConfig(config, indexId);
    const response = await quickwitClient.post('indexes', modifiedYamlData);
    if (response.status === 200 && response.data) {
        console.log(`Index ${indexId} created successfully`);
    } else {
        throw new AnnoSearchValidationError('Failed to create index');
    }

}
