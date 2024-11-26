import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';
import { makeSearchResponse } from './iiif';
import { validateQueryParameter, validateOffset, validateDateRanges, validateMaxHits, validatePageNumber, validateMotivation } from './validate';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);


function buildDateQueryFromString(dateRangesString: string): string {
    // Split the string into an array using space as the delimiter
    const dateRanges = dateRangesString.split(" ");
    
    // Map each range into a Quickwit-compatible query fragment
    return dateRanges
        .map(range => {
            const [start, end] = range.split("/");
            if (!start || !end) {
                throw new AnnoSearchValidationError(`Invalid date range format: ${range}`);
            }
            return `created:[${start} TO ${end}]`;
        })
        .join(" OR ");
}

export async function searchIndex(indexId: string, q: string, motivation: string, maxHits: number, page: number, searchUrl: string, date: string) {
    const startOffset = page * maxHits;
    validateQueryParameter(q);
    validatePageNumber(page);
    validateMaxHits(maxHits);
    validateDateRanges(date);
    validateOffset(startOffset);
    validateMotivation(motivation);
    const qQuery = `body.value:${q}`;
    const motivationQuery = motivation ? ` AND motivation:${motivation}` : '';
    const dateQuery = date ? ` AND (${buildDateQueryFromString(date)})` : '';
    const response = await quickwitClient.post(`${indexId}/search`, {
        query: `${qQuery}${motivationQuery}${dateQuery}`,
        max_hits: maxHits,
        start_offset: startOffset,
    });

    if (response.status === 200 && response.data) {
        return makeSearchResponse(indexId, response.data, searchUrl, q, motivation, maxHits, page);
    } else {
        throw new AnnoSearchValidationError('Failed to delete index');
    }
}
