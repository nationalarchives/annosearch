import { Maniiifest } from 'maniiifest';
import { fetchJson, createJsonl } from './utils';
import { AnnoSearchParseError, AnnoSearchValidationError } from './errors';
import { createClient } from './quickwit';

const contentType = 'application/x-ndjson';
const quickwitClient = createClient(contentType);

async function processAnnotations(indexId: string, parser: any, commit: boolean) {
    let currentParser = parser;
    while (currentParser) {
        const annotations = Array.from(currentParser.iterateAnnotationPageAnnotation());
        if (annotations.length > 0) {
            const payload = createJsonl(annotations);
            const url = commit ? `${indexId}/ingest?commit=force` : `${indexId}/ingest`;
            const response = await quickwitClient.post(url, payload);
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

async function processAnnotationPageRef(indexId: string, annotationPageUrl: string, commit: boolean) {
    const jsonData = await fetchJson(annotationPageUrl);
    const parser = new Maniiifest(jsonData, "AnnotationPage");
    await processAnnotations(indexId, parser, commit);
}

async function processAnnotationPage(indexId: string, page: any, commit: boolean) {
    const parser = new Maniiifest(page, "AnnotationPage");
    await processAnnotations(indexId, parser, commit);
}

async function processManifest(indexId: string, manifestUrl: string, commit: boolean) {
    const jsonData = await fetchJson(manifestUrl);
    const parser = new Maniiifest(jsonData);
    const type = parser.getSpecificationType();
    if (type !== 'Manifest') {
        throw new AnnoSearchParseError('Specification should be a Manifest');
    }
    const annotationPages = parser.iterateManifestCanvasW3cAnnotationPage();
    for (const page of annotationPages) {
        if (page.items) {
            await processAnnotationPage(indexId, page, commit);
        } else {
            await processAnnotationPageRef(indexId, page.id, commit);
        }
    }
}

async function processCollection(indexId: string, collectionUrl: string, commit: boolean) {
    const jsonData = await fetchJson(collectionUrl);
    const parser = new Maniiifest(jsonData);
    const type = parser.getSpecificationType();
    if (type !== 'Collection') {
        throw new AnnoSearchParseError('Specification should be a Collection');
    }
    const manifests = parser.iterateCollectionManifest();
    for (const item of manifests) {
        const manifestRef = new Maniiifest(item);
        const manifestId = manifestRef.getManifestId();
        if (manifestId) {
            await processManifest(indexId, manifestId, commit);
        } else {
            throw new AnnoSearchValidationError('Manifest ID is null');
        }
    }
}

async function processAnnotationCollection(indexId: string, annotationCollectionUrl: string, commit: boolean) {
    const jsonData = await fetchJson(annotationCollectionUrl);
    const parser = new Maniiifest(jsonData, "AnnotationCollection");
    const type = parser.getAnnotationCollectionType();
    if (type !== 'AnnotationCollection') {
        throw new AnnoSearchParseError('Should be a W3C annotation collection');
    }
    const firstPage = parser.getAnnotationCollectionFirst();
    if (typeof firstPage === 'string') { // means it is a URI
        await processAnnotationPageRef(indexId, firstPage, commit);
    } else {
        await processAnnotationPage(indexId, firstPage as any, commit);
    }
}

export async function loadIndex(indexId: string, uri: string, type: string, commit: boolean) {
    if (!indexId.trim() || !uri.trim()) {
        throw new AnnoSearchValidationError('Invalid index or uri parameter');
    }
    console.log(`Loading ${type} from ${uri} into index ${indexId}`);
    switch (type) {
        case 'Manifest':
            await processManifest(indexId, uri, commit);
            break;
        case 'Collection':
            await processCollection(indexId, uri, commit);
            break;
        case 'AnnotationCollection':
            await processAnnotationCollection(indexId, uri, commit);
            break;
        default:
            throw new AnnoSearchValidationError('unsupported type');
    }
}