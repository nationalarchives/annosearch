import axios from 'axios';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: process.env.QUICKWIT_BASE_URL || 'http://localhost:7280/api/v1/',
    headers: {
        'Content-Type': 'application/yaml',
    },
    timeout: 5000, // Set timeout to 5 seconds
});

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

// Function to post the modified configuration to the server
async function postIndexConfig(data: string) {
    return await axiosInstance.post('indexes', data);
}

// Initialization function
export async function init(indexId: string) {
    const filePath = path.resolve(__dirname, 'index-config.yaml');

    try {
        // Read and modify configuration
        const config = readYamlConfig(filePath);
        const modifiedYamlData = modifyConfig(config, indexId);
        // Post configuration to the server
        const response = await postIndexConfig(modifiedYamlData);
        console.log('Response:', response.data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}
