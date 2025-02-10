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

function createItem(id: string, term: string, prefix: string, suffix: string, counter: number) {
    return {
        "id": `${id}/match-${counter}`,
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


export function highlightTerms(annotation_page: any, query: string, snippetLength = 25): any {
    const terms = query.split(/\s+/).map(normalizeTerm).filter(Boolean); // Split into terms, normalize, remove empty ones
    const annotationPageParser = new Maniiifest(annotation_page, "AnnotationPage");
    const annotations = annotationPageParser.iterateAnnotationPageAnnotation();
    let matchCounter = 1;
    let annotationItems = [];
    for (const annotation of annotations) {
        const annotationParser = new Maniiifest(annotation, "Annotation");
        const bodyParser = annotationParser.iterateAnnotationTextualBody();
        for (const body of bodyParser) {
            const bodyValue = body.value;
            if (bodyValue) {
                for (const term of terms) { // Process each term separately
                    const regex = new RegExp(`\\b(${term})\\b`, "gi"); // Global + Case-Insensitive
                    let match;

                    while ((match = regex.exec(bodyValue)) !== null) { // Iterate all matches for the term
                        const exactMatch = match[0]; // Capture the exact match from the original text
                        let prefix = bodyValue.substring(Math.max(0, match.index - snippetLength), match.index);
                        let suffix = bodyValue.substring(match.index + exactMatch.length, Math.min(bodyValue.length, match.index + exactMatch.length + snippetLength));
                        // Add ellipses if the prefix or suffix is truncated
                        if (match.index - snippetLength > 0) {
                            prefix = '...' + prefix;
                        }
                        if (match.index + exactMatch.length + snippetLength < bodyValue.length) {
                            suffix = suffix + '...';
                        }
                        const item = createItem(annotation.id, exactMatch, prefix, suffix, matchCounter++);
                        annotationItems.push(item);
                    }
                }
            }
        }
    }
    annotation_page.annotations = [];
    annotation_page.annotations.push({
        "type": "AnnotationPage",
        "items": annotationItems
    });

    return annotation_page;
}



// Example usage with ts-node highlight.ts
// (async () => {
//     const filePath = '../../maniiifest/test/samples/search.json';
//     try {
//         const jsonData = await readJsonFromFile(filePath);
//         const res = highlightTerms(jsonData, 'london society');
//         console.log(JSON.stringify(res, null, 2));
//     } catch (error) {
//         console.error('Failed to read JSON:', error);
//     }
// })();