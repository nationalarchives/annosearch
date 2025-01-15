import { Maniiifest } from 'maniiifest';
import { fetchJson, createJsonl } from './utils';
import { AnnoSearchParseError, AnnoSearchValidationError } from './errors';
import { createClient } from './quickwit';

const contentType = 'application/x-ndjson';
const quickwitClient = createClient(contentType);

const termFrequencies = new Map<string, number>();

function* chunkMapToJson<K, V>(map: Map<K, V>, chunkSize: number): Generator<{ term: K; frequency: V }[]> {
    let chunk: { term: K; frequency: V }[] = [];
    for (const [term, frequency] of map.entries()) {
        chunk.push({ term, frequency }); 
        if (chunk.length === chunkSize) {
            yield chunk; 
            chunk = []; 
        }
    }
    if (chunk.length > 0) {
        yield chunk; 
    }
}

async function ingestData<T>(indexId: string, annotations: T[], commit: boolean): Promise<void> {
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
            console.log('writing to index ' + indexId);
            console.log('|' + '+'.repeat(annotations.length) + '|');
        } else {
            throw new AnnoSearchValidationError('Failed to ingest data: Invalid response from Quickwit');
        }
    }
}

function modifyAnnotationTarget(parser: any, uri: string, type: string) {
    const target = parser.getAnnotationTarget();
    const partOf = {
        id: uri,
        type: type,
    };
    const modifySingleTarget = (singleTarget: any) => {
        if (typeof singleTarget === "string") {
            // If the target is a string, return it wrapped in the specified object structure
            return { id: singleTarget, partOf: partOf };
        } else if (typeof singleTarget === "object" && singleTarget !== null) {
            // If the target is already an object, add or merge the partOf field
            return { ...singleTarget, partOf: partOf };
        }
        // Return the target as-is for unexpected types
        return singleTarget;
    };
    if (Array.isArray(target)) {
        return { target: target.map(modifySingleTarget) };
    } else {
        return { target: modifySingleTarget(target) };
    }
}


function incrementTerm(term: string) {
    termFrequencies.set(term, (termFrequencies.get(term) || 0) + 1);
}

function processAutocompleteTerms(parser: any) {
    for (const body of parser.iterateAnnotationPageAnnotationTextualBody()) {
        for (const term of body.value.split(/\s+/)) {
            const normalizedTerm = term
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\u00C0-\u024F]/g, ""); // Allow Unicode Latin characters
            if (normalizedTerm.length > 3) {
                incrementTerm(normalizedTerm);
            }
        }
    }
}

function* processAnnotationsWorker(parser: any, uri: string, type: string) {
    for (const annotation of parser.iterateAnnotationPageAnnotation()) {
        const annotation_parser = new Maniiifest(annotation, "Annotation");
        const modifiedTarget = modifyAnnotationTarget(annotation_parser, uri, type).target;
        yield { ...annotation, target: modifiedTarget };
    }
}

async function processAnnotations(indexId: string, uri: string, type: string, parser: any, commit: boolean) {
    let currentParser = parser;
    while (currentParser) {
        processAutocompleteTerms(currentParser);
        const annotations = Array.from(processAnnotationsWorker(currentParser, uri, type));
        await ingestData(indexId + '_annotations', annotations, commit);
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

async function processAnnotationPageRef(indexId: string, uri: string, type: string, annotationPageUrl: string, commit: boolean) {
    const jsonData = await fetchJson(annotationPageUrl);
    const parser = new Maniiifest(jsonData, "AnnotationPage");
    await processAnnotations(indexId, uri, type, parser, commit);
}

async function processAnnotationPage(indexId: string, uri: string, type: string, page: any, commit: boolean) {
    const parser = new Maniiifest(page, "AnnotationPage");
    await processAnnotations(indexId, uri, type, parser, commit);
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
            await processAnnotationPage(indexId, manifestUrl, type, page, commit);
        } else {
            await processAnnotationPageRef(indexId, manifestUrl, type, page.id, commit);
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
        await processAnnotationPageRef(indexId, annotationCollectionUrl, type, firstPage, commit);
    } else {
        await processAnnotationPage(indexId, annotationCollectionUrl, type, firstPage as any, commit);
    }
}

async function ingestAutocompleteTerms(indexId: string, commit: boolean) {
    const chunks = chunkMapToJson(termFrequencies, 1000);
    for (const chunk of chunks) {
        await ingestData(indexId + '_autocomplete', chunk, commit);
    }
}

export async function loadIndex(indexId: string, uri: string, type: string, commit: boolean) {
    if (!indexId.trim() || !uri.trim()) {
        throw new AnnoSearchValidationError('Invalid index or uri parameter');
    }

    // we won't allow loading data into an index that already contains data
    const indexContents = await quickwitClient.get(`/indexes/${indexId + '_annotations'}/describe`);
    if (indexContents.data.num_published_docs > 0) {
        throw new AnnoSearchValidationError(`Index ${indexId} already contains data`);
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

    await ingestAutocompleteTerms(indexId, commit);
    console.log('Data loaded successfully');
    
}