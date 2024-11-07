import axios from 'axios';
import { Response } from 'express';
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
    logError(error);  
    throw error;      
}


export function handleWebError(error: any, res: Response): void {
    let statusCode = 500;
    let errorMessage = 'An error occurred during processing';

    switch (true) {
        case error instanceof AnnoSearchValidationError:
            statusCode = 400;
            errorMessage = `Validation error: ${error.message}`;
            break;
        case error instanceof AnnoSearchNetworkError:
            statusCode = 502;
            errorMessage = `Network error: ${error.message}`;
            break;
        case error instanceof AnnoSearchParseError:
            statusCode = 500;
            errorMessage = `Parse error: ${error.message}`;
            break;    
        case error instanceof AnnoSearchError:
            statusCode = 500;
            errorMessage = `Application error: ${error.message}`;
            break;
        default:
            if (error.response) {
                statusCode = error.response.status || 500;
                errorMessage = error.response.statusText || error.message;
            } else {
                errorMessage = error.message || 'Internal Server Error';
            }
            break;
    }

    res.status(statusCode).json({ error: errorMessage });
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