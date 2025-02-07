import { promises as fs } from 'fs';
import { Maniiifest } from 'maniiifest';
import * as path from 'path';

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

function createItem(id: string, value: string, prefix: string, suffix: string) {
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
                    "exact": value,
                    "suffix": suffix
                }
            ]
        }
    };
}

function createAnnotations(annotation_page: any, query: string): any {
    const annotationPageParser = new Maniiifest(annotation_page, "AnnotationPage");
    const annotations = annotationPageParser.iterateAnnotationPageAnnotation();
    let annotationItems = [];

    for (const annotation of annotations) {
        const annotationParser = new Maniiifest(annotation, "Annotation");
        const bodyParser = annotationParser.iterateAnnotationTextualBody();
        for (const body of bodyParser) {
            const bodyValue = body.value;
            if (bodyValue) {
                const match = new RegExp(`(\\b${query}\\b)`, "i").exec(bodyValue);
                if (match) {
                    const prefix = bodyValue.substring(Math.max(0, match.index - 10), match.index);
                    const suffix = bodyValue.substring(match.index + query.length, Math.min(bodyValue.length, match.index + query.length + 10));
                    const item = createItem(annotation.id, query, prefix, suffix);
                    annotationItems.push(item);
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