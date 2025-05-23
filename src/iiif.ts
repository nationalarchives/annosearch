

export function makeSearchResponse(indexId: string, data: any, searchUrl: string, query: string, motivation: string, user: string, maxHits: number, page: number, date: string): any {
    const totalPages = Math.ceil(data.num_hits / maxHits);
    const nextPage = page + 1 < totalPages ? page + 1 : null;
    const prevPage = page > 0 ? page - 1 : null;
    const queryParam = encodeURIComponent(query);
    const motivationParam = motivation ? `&motivation=${encodeURIComponent(motivation)}` : '';
    const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
    const userParam = user ? `&user=${encodeURIComponent(user)}` : '';
    const id = `${searchUrl}/${indexId}/search?q=${queryParam}${motivationParam}${dateParam}${userParam}`;

    return {
        "@context": "http://iiif.io/api/search/2/context.json",
        id: `${id}&page=${page}`,
        type: "AnnotationPage",
        partOf: totalPages > 1 ? {
            id: id,
            type: "AnnotationCollection",
            total: data.num_hits,
            first: {
                id: `${id}&page=0`,
                type: "AnnotationPage"
            },
            last: {
                id: `${id}&page=${totalPages - 1}`,
                type: "AnnotationPage"
            }
        } : undefined,
        startIndex: page * maxHits,
        items: data.hits.map((hit: any) => ({
            ...hit
        })),
        next: nextPage !== null ? `${id}&page=${nextPage}` : undefined,
        prev: prevPage !== null ? `${id}&page=${prevPage}` : undefined,
    };
}


export function makeAutocompleteResponse(indexId: string, data: any, searchUrl: string, query: string, ignoredParams: string[]): any {
    const response: any = {
        "@context": "http://iiif.io/api/search/2/context.json",
        id: `${searchUrl}/${indexId}/autocomplete?q=${encodeURIComponent(query)}`,
        type: "TermPage",
        ...(ignoredParams.length > 0 && { ignored: ignoredParams }), // Add ignored if it exists
        items: data.hits.map((hit: any) => ({
            value: hit.term,
            language: hit.language,
            total: hit.frequency,
            service: [
                {
                    id: `${searchUrl}/${indexId}/search?q=${encodeURIComponent(hit.term)}`,
                    type: "SearchService2"
                }
            ]
        })),
    };

    return response;
}