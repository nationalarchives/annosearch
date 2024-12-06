

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
        "@context": "http://www.w3.org/ns/anno.jsonld",
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
