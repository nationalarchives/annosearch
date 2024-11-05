import { Maniiifest } from 'maniiifest';
import { fetchJson, createJsonl } from './utils';
import { AnnotationPageT } from 'maniiifest/dist/specification';
import { createAxiosInstance } from './quickwit';


const contentType = 'application/x-ndjson';
const axiosInstance = createAxiosInstance(contentType);

async function processAnnotations(indexId: string, parser: any) {
    let currentParser = parser;

    while (currentParser) {
        const annotations = currentParser.iterateAnnotationPageAnnotation();
        for (const annotation of annotations) {
            const jsonl = createJsonl(annotation);
            try {
                const response = await axiosInstance.post(`${indexId}/ingest?commit=force`, jsonl);
                console.log(response.data);
            } catch (error: any) {
                console.error('Error sending annotation to Quickwit:', error.message);
            }
        }
        const nextPageUrl = currentParser.getAnnotationPage().next;
        if (nextPageUrl) {
            const jsonData = await fetchJson(nextPageUrl);
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
        throw new Error(`Specification should be a Manifest.`);
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
        throw new Error(`Specification should be a Collection.`);
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
            console.error('Manifest ID is null');
        }
        count++;
    }
}

export async function loadIndex(indexId: string, uri: string, type: string) {
    switch (type) {
        case 'Manifest':
            await processManifest(indexId, uri);
            break;
        case 'Collection':
            await processCollection(indexId, uri);
            break;
        default:
            throw new Error(`Unsupported type: ${type}`);
    }
}