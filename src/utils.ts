// FILE: utils.ts

// Function to print the results
export function printResults(results: unknown): void {
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