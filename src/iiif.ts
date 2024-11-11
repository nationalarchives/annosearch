type Body = {
    format: string;
    language: string;
    type: string;
    value: string;
};

type W3CAnnotation = {
    "@context": string;
    id: string;
    type: string;
    body: Body;
    target: string;
    motivation: string;
};

type SearchResponse = {
    "@context": string;
    id: string;
    type: string;
    total: number;
    items: W3CAnnotation[];
    next?: string;
    prev?: string;
};

export function makeSearchResponse(data: any, searchUrl: string, query: string, maxHits: number, page: number): SearchResponse {
    const totalPages = Math.ceil(data.num_hits / maxHits);
    const nextPage = page + 1 < totalPages ? page + 1 : null;
    const prevPage = page > 0 ? page - 1 : null;
    const q = encodeURIComponent(query);

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: `${searchUrl}?q=${q}&page=${page}`,
        type: "AnnotationPage",
        total: data.num_hits,
        items: data.hits.map((hit: any) => ({
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: hit.id,
            type: hit.type,
            body: hit.body,
            target: hit.target,
            motivation: hit.motivation,
        })),
        // Add 'next' link if there is a next page
        next: nextPage !== null ? `${searchUrl}?q=${q}&page=${nextPage}` : undefined,
        // Add 'prev' link if there is a previous page
        prev: prevPage !== null ? `${searchUrl}?q=${q}&page=${prevPage}` : undefined,
    };
}
