import { Maniiifest } from 'maniiifest';
import { fetchJson, printJson } from './utils';

async function processAnnotationPage(annotationPageUrl: string) {
    const jsonData = await fetchJson(annotationPageUrl);
    const parser = new Maniiifest(jsonData, "AnnotationPage");
    const annotations = parser.iterateAnnotationPageAnnotation();
    for (const annotation of annotations) {
        printJson(annotation);
    }
}

async function processManifest(manifestUrl: string) {
    const jsonData = await fetchJson(manifestUrl);
    const parser = new Maniiifest(jsonData);
    const annotationPages = parser.iterateManifestCanvasW3cAnnotationPage();
    for (const page of annotationPages) {
        await processAnnotationPage(page.id);
    }
}

async function processCollection(collectionUrl: string) {
    const jsonData = await fetchJson(collectionUrl);
    const parser = new Maniiifest(jsonData);
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

export async function loadIndex(indexId: string, uri: string) {
    console.log(indexId, uri);
    processCollection(uri);
}