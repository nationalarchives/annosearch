import { Maniiifest } from 'maniiifest';
import { fetchJson, createJsonl, printJson, handleError } from './utils';
import { AnnoSearchParseError, AnnoSearchValidationError } from './errors';
import { AnnotationPageT } from 'maniiifest/dist/specification';
import { createClient } from './quickwit';

const contentType = 'application/x-ndjson';
const quickwitClient = createClient(contentType);

async function processAnnotations(indexId: string, parser: any) {
    let currentParser = parser;

    while (currentParser) {
        const annotations = currentParser.iterateAnnotationPageAnnotation();

        for (const annotation of annotations) {
            const jsonl = createJsonl(annotation);
            if (!jsonl) {
                throw new AnnoSearchValidationError('Invalid annotation data generated from JSONL conversion');
            }
            try {
                const response = await quickwitClient.post(`${indexId}/ingest?commit=force`, jsonl);
                if (!response.data) {
                    throw new AnnoSearchValidationError('No response data received from Quickwit');
                }
                printJson(response.data);

            } catch (error: any) {
                handleError(error);
            }
        }

        const nextPageUrl = currentParser.getAnnotationPage().next;
        if (nextPageUrl) {
            try {
                const jsonData = await fetchJson(nextPageUrl);
                if (!jsonData) {
                    throw new AnnoSearchValidationError('No JSON data returned from fetchJson');
                }
                currentParser = new Maniiifest(jsonData, "AnnotationPage");

            } catch (error: any) {
                throw new AnnoSearchParseError('Failed to retrieve or parse the next annotation page');
            }
        } else {
            currentParser = null;
        }
    }
}


async function processAnnotationPageRef(indexId: string, annotationPageUrl: string) {
    try {
        const jsonData = await fetchJson(annotationPageUrl);
        const parser = new Maniiifest(jsonData, "AnnotationPage");
        await processAnnotations(indexId, parser);
    } catch (error: any) {
        handleError(error);
    }
}

async function processAnnotationPage(indexId: string, page: AnnotationPageT) {
    try {
        const parser = new Maniiifest(page, "AnnotationPage");
        await processAnnotations(indexId, parser);
    } catch (error: any) {
        handleError(error);
    }
}

async function processManifest(indexId: string, manifestUrl: string) {
    try {
        const jsonData = await fetchJson(manifestUrl);
        const parser = new Maniiifest(jsonData);
        const type = parser.getSpecificationType();
        if (type !== 'Manifest') {
            throw new AnnoSearchParseError('Specification should be a Manifest');
        }
        const annotationPages = parser.iterateManifestCanvasW3cAnnotationPage();
        for (const page of annotationPages) {
            if (page.items) {
                await processAnnotationPage(indexId, page);
            } else {
                await processAnnotationPageRef(indexId, page.id);
            }
        }
    } catch (error: any) {
        handleError(error);
    }
}

async function processCollection(indexId: string, collectionUrl: string) {
    try {
        const jsonData = await fetchJson(collectionUrl);
        const parser = new Maniiifest(jsonData);
        const type = parser.getSpecificationType();
        if (type !== 'Collection') {
            throw new AnnoSearchParseError('Specification should be a Collection');
        }
        const manifests = parser.iterateCollectionManifest();
        // need to remove count later once tested
        let count = 0;
        for (const item of manifests) {
            if (count >= 1) break;
            const manifestRef = new Maniiifest(item);
            const manifestId = manifestRef.getManifestId();
            if (manifestId) {
                await processManifest(indexId, manifestId);
            } else {
                throw new AnnoSearchValidationError('Manifest ID is null');
            }
            count++;
        }
    } catch (error: any) {
        handleError(error);
    }
}


export async function loadIndex(indexId: string, uri: string, type: string) {
    if (!indexId.trim() || !uri.trim()) {
        throw new AnnoSearchValidationError('Invalid indexId or uri parameter');
    }
    try {
        switch (type) {
            case 'Manifest':
                await processManifest(indexId, uri);
                break;
            case 'Collection':
                await processCollection(indexId, uri);
                break;
            default:
                throw new AnnoSearchValidationError('unsupported type');
        }
    } catch (error: any) {
        handleError(error);
    }
}