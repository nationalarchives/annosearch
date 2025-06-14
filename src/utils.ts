import axios from 'axios';
import { Response } from 'express';
import { AnnoSearchError, AnnoSearchNetworkError, AnnoSearchValidationError, AnnoSearchParseError, AnnoSearchNotFoundError } from './errors';
import { AxiosError } from 'axios';
import logger from './logger'; // Import Pino logger instance


// Function to print the results
export function printJson(results: unknown): void {
    console.log(JSON.stringify(results, null, 2)); // Print the returned JSON
}

// Function to log errors in a single-line JSON format
export function logError(error: unknown, context: string = 'General'): void {
    const errorObject = { context, error: {} };

    if (error instanceof AnnoSearchNetworkError || error instanceof AxiosError) {
        errorObject.error = { type: 'Network Error', message: error.message };
    } else if (error instanceof AnnoSearchNotFoundError) {
        errorObject.error = { type: 'Not Found Error', message: error.message };
    } else if (error instanceof AnnoSearchParseError) {
        errorObject.error = { type: 'Parse Error', message: error.message };
    } else if (error instanceof AnnoSearchValidationError) {
        errorObject.error = { type: 'Validation Error', message: error.message };
    } else if (error instanceof AnnoSearchError) {
        errorObject.error = { type: 'General AnnoSearch Error', message: error.message };
    } else if (error instanceof Error) {
        errorObject.error = { type: 'General Error', message: error.message };
    } else {
        errorObject.error = { type: 'Unknown Error', details: JSON.stringify(error) };
    }

    logger.error(JSON.stringify(errorObject)); // Log as a single-line JSON object
}



// Function to handle errors
export function handleError(error: any): never {
    logError(error);
    throw error;
}

export function handleWebError(error: any, res: Response): void {
    logError(error, 'Web Request');
    let statusCode = 500;
    let errorMessage = 'An error occurred during processing';

    switch (true) {
        case error instanceof AnnoSearchValidationError:
            statusCode = 400;
            errorMessage = `Validation error: ${error.message}`;
            break;
        case error instanceof AxiosError:
            statusCode = error.response?.status || 503;
            errorMessage = `Network error: ${error.message}`;
            break;
        case error instanceof AnnoSearchNetworkError:
            statusCode = 503;
            errorMessage = `Network error: ${error.message}`;
            break;
        case error instanceof AnnoSearchNotFoundError:
            statusCode = 404;
            errorMessage = `Not found: ${error.message}`;
            break;
        case error instanceof AnnoSearchParseError:
            statusCode = 400;
            errorMessage = `Parse error: ${error.message}`;
            break;
        case error instanceof AnnoSearchError:
            statusCode = 400;
            errorMessage = `Application error: ${error.message}`;
            break;
        case error instanceof Error:
            statusCode = 500;
            errorMessage = `General error: ${error.message}`;
            break;
        default:
            errorMessage = error.message || 'Internal Server Error';
            break;
    }

    res.status(statusCode).json({ error: errorMessage });
}


// Function to fetch JSON data
export async function fetchJson(url: string) {
    const response = await axios.get(url);
    if (!response.data) {
        throw new AnnoSearchValidationError('No JSON data returned');
    }
    return response.data;

}

export function createJsonl(data: unknown | unknown[]): string {
    if (Array.isArray(data)) {
        return data.map(item => JSON.stringify(item)).join('\n') + '\n';
    } else {
        return JSON.stringify(data) + '\n';
    }
}

/**
 * Normalize a term by trimming whitespace, converting to lowercase,
 * and removing non-alphanumeric characters from the start and end.
 */
export function normalizeTerm(term: string): string {
    return term
        .trim()
        .toLowerCase()
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""); 
}

export function escapeRegex(term: string): string {
    // Escape special characters in the term to make it regex-safe
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}