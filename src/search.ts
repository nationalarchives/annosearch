import { handleError } from './utils';
import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);

export async function searchIndex(indexId: string, query: string, maxHits: number, startOffset: number) {
    try {
        if (!indexId.trim() || !query.trim()) {
            throw new AnnoSearchValidationError('Invalid index or query parameter');
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
    }
}
