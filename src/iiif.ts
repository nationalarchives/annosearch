
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
};

export function makeSearchResponse(data: any, searchUrl: string): SearchResponse {
    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: searchUrl,
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
    };
}





