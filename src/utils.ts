import axios from 'axios';
import { AnnoSearchError, AnnoSearchNetworkError } from './errors';

// Function to print the results
export function printJson(results: unknown): void {
    console.log(JSON.stringify(results, null, 2)); // Print the returned JSON
}

// Function to handle errors
export function handleError(error: unknown, context: string = 'General') {
    if (error instanceof AnnoSearchError) {
        console.error(`AnnoSearch Error [${context}]: ${error.message}`);
    } else if (error instanceof Error) {
        console.error(`General Error [${context}]: ${error.message}`);
    } else {
        console.error(`Unknown Error [${context}]:`, error);
    }
}

// Function to fetch JSON data
export async function fetchJson(url: string) {
    try {
        const response = await axios.get(url);
        return response.data;
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

export function createJsonl(data: unknown): string {
    return JSON.stringify(data) + '\n';
}