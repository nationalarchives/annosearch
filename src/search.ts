import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';
import { makeSearchResponse } from './iiif';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);


export async function searchIndex(indexId: string, query: string, maxHits: number, page: number, searchUrl: string) {
    const startOffset = page * maxHits;
    if (startOffset < 0) {
        throw new AnnoSearchValidationError('Invalid paging');
    }
    if (!query.trim()) {
        throw new AnnoSearchValidationError('Missing query parameter');
    }
    const response = await quickwitClient.post(`${indexId}/search`, {
        query: query,
        max_hits: maxHits,
        start_offset: startOffset,
    });

    if (response.status === 200 && response.data) {
        return makeSearchResponse(response.data, searchUrl, query, maxHits, page);
    } else {
        throw new AnnoSearchValidationError('Failed to delete index');
    }
}
