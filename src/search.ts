import { handleError } from './utils';
import { createClient } from './quickwit';
import { AnnoSearchError, AnnoSearchValidationError, AnnoSearchNetworkError } from './errors';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);

export async function searchIndex(indexId: string, query: string, maxHits: number, startOffset: number) {
    try {
        console.log(`Sending request to Quickwit with indexId: ${indexId}, query: ${query}, and maxHits: ${maxHits} at offset: ${startOffset}`);
        if (!indexId.trim() || !query.trim()) {
            throw new AnnoSearchValidationError('Invalid indexId or query parameter');
        }
        const response = await quickwitClient.post(`${indexId}/search`, {
            query: query,
            max_hits: maxHits,
            start_offset: startOffset,
        });
        if (!response.data) {
            throw new AnnoSearchValidationError('No data received from the search response');
        }
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
