import axios from 'axios';
import https from 'https';

// Function to print the results
export function printJson(results: unknown): void {
    console.log(JSON.stringify(results, null, 2)); // Print the returned JSON
}

// Function to handle errors
export function handleError(error: unknown): void {
    if (error instanceof Error) {
        console.error('Error performing search:', error.message);
    } else {
        console.error('Error performing search:', error);
    }
}

// Function to fetch JSON data
export async function fetchJson(url: string) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error; // Re-throw the error after handling it
    }
}

export function createJsonl(data: unknown): string {
    return JSON.stringify(data) + '\n';
}