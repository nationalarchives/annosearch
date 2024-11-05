import { Maniiifest } from 'maniiifest';
import { fetchJson, printJson } from './utils';
import { AnnotationPageT } from 'maniiifest/dist/specification';

async function processAnnotations(parser: any) {
    const annotations = parser.iterateAnnotationPageAnnotation();
    for (const annotation of annotations) {
        printJson(annotation);
    }
}

async function processAnnotationPageRef(annotationPageUrl: string) {
    const jsonData = await fetchJson(annotationPageUrl);
    const parser = new Maniiifest(jsonData, "AnnotationPage");
    await processAnnotations(parser);
}

async function processAnnotationPage(page: AnnotationPageT) {
    const parser = new Maniiifest(page, "AnnotationPage");
    await processAnnotations(parser);
}

async function processManifest(manifestUrl: string) {
    const jsonData = await fetchJson(manifestUrl);
    const parser = new Maniiifest(jsonData);
    const type = parser.getSpecificationType();
    if (type !== 'Manifest') {
        throw new Error(`Specification should be a Manifest.`);
    }
    const annotationPages = parser.iterateManifestCanvasW3cAnnotationPage();
    for (const page of annotationPages) {
        if (page.items) {
            await processAnnotationPage(page);
        } else {
            await processAnnotationPageRef(page.id);
        }
    }
}

async function processCollection(collectionUrl: string) {
    const jsonData = await fetchJson(collectionUrl);
    const parser = new Maniiifest(jsonData);
    const type = parser.getSpecificationType();
    if (type !== 'Collection') {
        throw new Error(`Specification should be a Collection.`);
    }
    const manifests = parser.iterateCollectionManifest();
    let count = 0;
    for (const item of manifests) {
        if (count >= 1) break;
        const manifestRef = new Maniiifest(item);
        const manifestId = manifestRef.getManifestId();
        if (manifestId) {
            await processManifest(manifestId);
        } else {
            console.error('Manifest ID is null');
        }
        count++;
    }
}

export async function loadIndex(indexId: string, uri: string, type: string) {
    switch (type) {
        case 'Manifest':
            await processManifest(uri);
            break;
        case 'Collection':
            await processCollection(uri);
            break;
        default:
            throw new Error(`Unsupported type: ${type}`);
    }
}