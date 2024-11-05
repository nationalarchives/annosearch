// FILE: utils.ts

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
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        handleError(error);
        throw error; // Re-throw the error after handling it
    }
}