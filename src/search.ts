import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';
import { makeSearchResponse, makeAutocompleteResponse } from './iiif';
import { validateSearchQueryParameter, validateAutocompleteQueryParameter, validateOffset, validateDateRanges, validateMaxHits, validatePageNumber, validateMotivation, validateUser } from './validate';
import { highlightTerms } from './highlight';
import { escapeQuickwitQuery } from './utils';
import { sign } from 'crypto';

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
            // Escape the date values to prevent injection
            const escapedStart = escapeQuickwitQuery(start);
            const escapedEnd = escapeQuickwitQuery(end);
            return `created:[${escapedStart} TO ${escapedEnd}]`;
        })
        .join(" OR ");
}

function buildUserQueryFromString(userString: string): string {
    const users = userString.split(" ");
    return users
        .map(user => {
            const sanitizedUser = escapeQuickwitQuery(user.trim());
            if (!sanitizedUser) return null;
            return `(creator:"${sanitizedUser}" OR creator.id:"${sanitizedUser}")`;
        })
        .filter(Boolean)
        .join(" OR ");
}

function buildSearchQueryFromString(qString: string): string {
    const terms = qString.split(" ");
    return terms
        .map(term => {
            const sanitizedTerm = escapeQuickwitQuery(term.trim());
            if (!sanitizedTerm) return null;
            return `(body.value:"${sanitizedTerm}")`;
        })
        .filter(Boolean)
        .join(" AND ");
}

export async function searchIndex(indexId: string, q: string, motivation: string, maxHits: number, page: number, searchUrl: string, date: string, user: string, snippetLength: number = 25) {
    const startOffset = page * maxHits;
    validateSearchQueryParameter(q);
    validatePageNumber(page);
    validateMaxHits(maxHits);
    validateDateRanges(date);
    validateOffset(startOffset);
    validateMotivation(motivation);
    validateUser(user);

    const qQuery = buildSearchQueryFromString(q);
    const motivationQuery = motivation ? ` AND motivation:"${escapeQuickwitQuery(motivation)}"` : '';
    const dateQuery = date ? ` AND (${buildDateQueryFromString(date)})` : '';
    const userQuery = user ? ` AND (${buildUserQueryFromString(user)})` : '';
    const fullQuery = `${qQuery}${motivationQuery}${dateQuery}${userQuery}`;
    //console.log(`Constructed query: ${fullQuery}`);
    const response = await quickwitClient.post(`${indexId + '_annotations'}/search`, {
        query: fullQuery,
        max_hits: maxHits,
        start_offset: startOffset,
    });

    if (response.status === 200 && response.data) {
        const result = makeSearchResponse(indexId, response.data, searchUrl, q, motivation, user, maxHits, page, date);
        return highlightTerms(result, q, snippetLength);
    } else {
        throw new AnnoSearchValidationError('Failed to search index');
    }
}

function buildAutocompleteQueryFromString(qString: string): string {
    const sanitizedQuery = escapeQuickwitQuery(qString.trim());
    return `term:${sanitizedQuery}*`;
}

export async function searchAutocomplete(indexId: string, q: string, maxHits: number, searchUrl: string, ignoredParams: string[]) {
    validateAutocompleteQueryParameter(q);
    validateMaxHits(maxHits);
    const fullQuery = buildAutocompleteQueryFromString(q);
    const response = await quickwitClient.post(`${indexId + '_autocomplete'}/search`, {
        query: fullQuery,
        sort_by: "frequency",
        max_hits: maxHits,
    });
    if (response.status === 200 && response.data) {
        return makeAutocompleteResponse(indexId, response.data, searchUrl, q, ignoredParams);
    } else {
        throw new AnnoSearchValidationError('Failed to search autocomplete index');
    }
}