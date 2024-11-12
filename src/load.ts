import { Maniiifest } from 'maniiifest';
import { fetchJson, createJsonl } from './utils';
import { AnnoSearchParseError, AnnoSearchValidationError } from './errors';
import { AnnotationPageT } from 'maniiifest/dist/specification';
import { createClient } from './quickwit';

const contentType = 'application/x-ndjson';
const quickwitClient = createClient(contentType);

async function processAnnotations(indexId: string, parser: any) {
    let currentParser = parser;

    while (currentParser) {
        const annotations = Array.from(currentParser.iterateAnnotationPageAnnotation());
        if (annotations.length > 0) {
            const payload = createJsonl(annotations);
            const response = await quickwitClient.post(`${indexId}/ingest`, payload);
            if (!response.data) {
                throw new AnnoSearchValidationError('No response data received from Quickwit');
            }
            // Check if the response is successful and has data
            if (response.status === 200 && response.data) {
                // Print a line of '+' symbols based on the batch length
                console.log('|' + '+'.repeat(annotations.length) + '|');
            } else {
                throw new AnnoSearchValidationError('Failed to ingest data: Invalid response from Quickwit');
            }
        }

        // Move to the next annotation page if available
        const nextPageUrl = currentParser.getAnnotationPage().next;
        if (nextPageUrl) {
            const jsonData = await fetchJson(nextPageUrl);
            if (!jsonData) {
                throw new AnnoSearchValidationError('No JSON data returned from fetchJson');
            }
            currentParser = new Maniiifest(jsonData, "AnnotationPage");
        } else {
            currentParser = null;
        }
    }
}

async function processAnnotationPageRef(indexId: string, annotationPageUrl: string) {
    const jsonData = await fetchJson(annotationPageUrl);
    const parser = new Maniiifest(jsonData, "AnnotationPage");
    await processAnnotations(indexId, parser);
}

async function processAnnotationPage(indexId: string, page: AnnotationPageT) {
    const parser = new Maniiifest(page, "AnnotationPage");
    await processAnnotations(indexId, parser);
}

async function processManifest(indexId: string, manifestUrl: string) {
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
}

async function processCollection(indexId: string, collectionUrl: string) {
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
}


export async function loadIndex(indexId: string, uri: string, type: string) {
    if (!indexId.trim() || !uri.trim()) {
        throw new AnnoSearchValidationError('Invalid index or uri parameter');
    }
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
}