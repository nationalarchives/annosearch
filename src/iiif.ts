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

type PageReference = {
    id: string;
    type: string;
};

type AnnotationCollection = {
    id: string;
    type: string;
    total: number;
    first: PageReference;
    last: PageReference;
};

type SearchResponse = {
    "@context": string;
    id: string;
    type: string;
    items: W3CAnnotation[];
    next?: string;
    prev?: string;
    partOf?: AnnotationCollection;
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
        partOf: totalPages > 1 ? {
            id: `${searchUrl}?q=${q}`,
            type: "AnnotationCollection",
            total: data.num_hits,
            first: {
                id: `${searchUrl}?q=${q}&page=0`,
                type: "AnnotationPage"
            },
            last: {
                id: `${searchUrl}?q=${q}&page=${totalPages - 1}`,
                type: "AnnotationPage"
            }
        } : undefined,
        items: data.hits.map((hit: any) => ({
            "@context": "http://www.w3.org/ns/anno.jsonld",
            id: hit.id,
            type: hit.type,
            body: hit.body,
            target: hit.target,
            motivation: hit.motivation,
        })),
        next: nextPage !== null ? `${searchUrl}?q=${q}&page=${nextPage}` : undefined,
        prev: prevPage !== null ? `${searchUrl}?q=${q}&page=${prevPage}` : undefined,
    };
}
