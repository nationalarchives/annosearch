import { handleError } from './utils';
import { createClient } from './quickwit';
import { AnnoSearchError, AnnoSearchNetworkError, AnnoSearchValidationError } from './errors';

const contentType = 'application/json'; 
const quickwitClient = createClient(contentType);

export async function deleteIndex(indexId: string) {
    try {
        if (!indexId.trim()) {
            throw new AnnoSearchValidationError('Invalid indexId: indexId cannot be empty or whitespace.');
        }
        const response = await quickwitClient.delete(`indexes/${indexId}`);
        if (!response.data) {
            throw new AnnoSearchValidationError('No response data received from Quickwit');
        }
        console.log('Response:', response.data);
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