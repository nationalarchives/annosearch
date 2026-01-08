import axios from 'axios';
import { Response, Request, NextFunction } from 'express';
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
 * Strip HTML tags from text content, replacing with spaces to maintain word separation
 * Used for processing text where HTML tags separate words (e.g., autocomplete term extraction)
 */
export function stripHtmlTagsWithSpaces(text: string): string {
    return text.replace(/<[^>]*>/g, ' ');
}

/**
 * Strip HTML tags from text content completely for clean display text
 * Used for creating clean snippets and display text (e.g., highlighting prefixes/suffixes)
 * Removes only genuinely malformed HTML syntax that could cause display issues
 */
export function stripHtmlTagsClean(text: string): string {
    return text
        // Remove orphaned closing brackets at start (e.g., "p>text", "div>content")
        .replace(/^[^<]*>/, '')
        // Remove incomplete opening tags at end (missing closing bracket, e.g., "text<p", "word<div class=")
        .replace(/<[^>]*$/, '')
        // Remove incomplete closing tags at end (e.g., "text</div", "content</sp")
        .replace(/<\/[^>]*$/, '')
        .trim();
}

/**
 * Normalize a term by trimming whitespace, converting to lowercase,
 * and removing non-alphanumeric characters from the start and end.
 */
export function normalizeTerm(term: string): string {
    return term
        .trim()
        .toLowerCase()
        // More restrictive: only allow letters, numbers, and safe punctuation
        .replace(/^[^\p{L}\p{N}\-_.]+|[^\p{L}\p{N}\-_.]+$/gu, "")
        // Remove any remaining potentially dangerous characters
        .replace(/[{}[\]()~*?\\+"`]/g, "");
}

export function escapeRegex(term: string): string {
    // Escape special characters in the term to make it regex-safe
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape special Quickwit query characters to prevent DSL injection
 */
export function escapeQuickwitQuery(input: string): string {
    // Escape special Quickwit query characters
    return input.replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/'/g, "\\'")
                .replace(/[+~*?{}[\]()]/g, '\\$&');
}

/**
 * More aggressive sanitization for field values
 */
export function sanitizeFieldValue(value: string): string {
    return value.replace(/[^a-zA-Z0-9\s\-_.@]/g, '');
}

/**
 * Validate that input doesn't contain potentially dangerous characters
 */
export function validateNoSpecialChars(input: string): void {
    const dangerousChars = /[{}[\]()~*?\\+"`]/;
    if (dangerousChars.test(input)) {
        throw new AnnoSearchValidationError('Input contains invalid characters');
    }
}

/**
 * Validate query complexity to prevent complex injection attacks
 */
export function validateQueryComplexity(query: string): void {
    const termCount = query.split(/\s+/).length;
    const operatorCount = (query.match(/\b(AND|OR|NOT)\b/gi) || []).length;
    const parenthesesCount = (query.match(/[()]/g) || []).length;
    
    if (operatorCount > 10) {
        throw new AnnoSearchValidationError('Query too complex: too many operators');
    }
    if (parenthesesCount > 20) {
        throw new AnnoSearchValidationError('Query too complex: too many parentheses');
    }
    if (termCount > 20) {
        throw new AnnoSearchValidationError('Query too complex: too many terms');
    }
}

/**
 * Middleware to sanitize input parameters and remove potentially dangerous characters
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
    try {
        // Sanitize query parameters
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                // Remove null bytes and control characters
                const sanitized = value.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
                req.query[key] = sanitized;
            }
        }
        next();
    } catch (error) {
        throw new AnnoSearchValidationError('Invalid input detected');
    }
}

/**
 * Middleware to add security headers optimized for nginx deployment
 */
export function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Basic security headers (nginx should handle most CSP/HSTS)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API-specific headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
}