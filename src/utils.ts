import axios from 'axios';
import { AnnoSearchError, AnnoSearchNetworkError, AnnoSearchValidationError, AnnoSearchParseError } from './errors';

// Function to print the results
export function printJson(results: unknown): void {
    console.log(JSON.stringify(results, null, 2)); // Print the returned JSON
}

// Function to log errors
export function logError(error: unknown, context: string = 'General') {
    if (error instanceof AnnoSearchNetworkError) {
        console.error(`AnnoSearch Network Error [${context}]: ${error.message}`);
    } else if (error instanceof AnnoSearchParseError) {
        console.error(`AnnoSearch Parse Error [${context}]: ${error.message}`);
    } else if (error instanceof AnnoSearchValidationError) {
        console.error(`AnnoSearch Validation Error [${context}]: ${error.message}`);
    } else if (error instanceof AnnoSearchError) {
        console.error(`AnnoSearch Error [${context}]: ${error.message}`);
    } else if (error instanceof Error) {
        console.error(`General Error [${context}]: ${error.message}`);
    } else {
        console.error(`Unknown Error [${context}]:`, error);
    }
}

// Function to handle errors
export function handleError(error: any): never {
    logError(error);  // Logs error details
    const statusCode = error.response?.status;
    if (statusCode) {
        if (statusCode >= 500) {
            throw new AnnoSearchNetworkError(`Server error (${statusCode}): ${error.response.statusText}`);
        } else if (statusCode >= 400) {
            throw new AnnoSearchValidationError(`Client error (${statusCode}): ${error.response.statusText}`);
        } else {
            throw new AnnoSearchError(`Unexpected status code (${statusCode}): ${error.response.statusText}`);
        }
    } else {
        throw new AnnoSearchError('An error occurred during processing');
    }
}


// Function to fetch JSON data
export async function fetchJson(url: string) {
    try {
        const response = await axios.get(url);
        if (!response.data) {
            throw new AnnoSearchValidationError('No JSON data returned');
        }
        return response.data;
    } catch (error: any) {
        handleError(error);
    }
}

export function createJsonl(data: unknown): string {
    return JSON.stringify(data) + '\n';
}