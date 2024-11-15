import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';
import { makeSearchResponse } from './iiif';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);


export async function searchIndex(indexId: string, q: string, motivation: string, maxHits: number, page: number, searchUrl: string) {
    const startOffset = page * maxHits;
    if (startOffset < 0) {
        throw new AnnoSearchValidationError('Invalid paging');
    }
    if (!q.trim()) {
        throw new AnnoSearchValidationError('Missing query parameter');
    }
    const motivationQuery = motivation ? ` AND motivation:${motivation}` : '';
    const response = await quickwitClient.post(`${indexId}/search`, {
        query: `body.value:${q}${motivationQuery}`,
        max_hits: maxHits,
        start_offset: startOffset,
    });

    if (response.status === 200 && response.data) {
        return makeSearchResponse(indexId, response.data, searchUrl, q, motivation, maxHits, page);
    } else {
        throw new AnnoSearchValidationError('Failed to delete index');
    }
}
