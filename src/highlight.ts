import { promises as fs } from 'fs';
import { Maniiifest } from 'maniiifest';
import * as path from 'path';
import { normalizeTerm } from './utils';

async function readJsonFromFile(filePath: string): Promise<any> {
    try {
        const absolutePath = path.resolve(filePath);
        const data = await fs.readFile(absolutePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading JSON from file: ${error}`);
        throw error;
    }
}

let matchCounter = 1;

function createItem(id: string, term: string, prefix: string, suffix: string) {
    return {
        "id": `${id}/match-${matchCounter++}`,
        "type": "Annotation",
        "motivation": "highlighting",
        "target": {
            "type": "SpecificResource",
            "source": `${id}`,
            "selector": [
                {
                    "type": "TextQuoteSelector",
                    "prefix": prefix,
                    "exact": term,
                    "suffix": suffix
                }
            ]
        }
    };
}


function createAnnotations(annotation_page: any, query: string): any {
    const terms = query.split(/\s+/).map(normalizeTerm).filter(Boolean); // Split into terms, normalize, remove empty ones
    const annotationPageParser = new Maniiifest(annotation_page, "AnnotationPage");
    const annotations = annotationPageParser.iterateAnnotationPageAnnotation();
    let annotationItems = [];

    for (const annotation of annotations) {
        const annotationParser = new Maniiifest(annotation, "Annotation");
        const bodyParser = annotationParser.iterateAnnotationTextualBody();
        for (const body of bodyParser) {
            const bodyValue = body.value;
            if (bodyValue) {
                for (const term of terms) { // Process each term separately
                    const regex = new RegExp(`(\\b${term}\\b)`, "gi"); // Global + Case-Insensitive
                    let match;

                    while ((match = regex.exec(bodyValue)) !== null) { // Iterate all matches for the term
                        const prefix = bodyValue.substring(Math.max(0, match.index - 10), match.index);
                        const suffix = bodyValue.substring(match.index + term.length, Math.min(bodyValue.length, match.index + term.length + 10));
                        const item = createItem(annotation.id, term, prefix, suffix);
                        annotationItems.push(item);
                    }
                }
            }
        }
    }
    annotation_page.annotations = [];
    annotation_page.annotations.push({
        "items": annotationItems
    });

    return annotation_page;
}



// Example usage with ts-node highlight.ts
(async () => {
    const filePath = '../../maniiifest/test/samples/search.json';
    try {
        const jsonData = await readJsonFromFile(filePath);
        const res = createAnnotations(jsonData, 'london');
        console.log(JSON.stringify(res, null, 2));
    } catch (error) {
        console.error('Failed to read JSON:', error);
    }
})();