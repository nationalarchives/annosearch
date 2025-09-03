import { AnnoSearchValidationError } from "./errors";
import { normalizeTerm, validateNoSpecialChars, validateQueryComplexity } from "./utils";

export const motivations = [
    'painting',
    'supplementing',
    'contextualizing',
    'contentState',
    'highlighting',
    'commenting',
    'tagging'
];

export function validateSearchQueryParameter(query: string): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        throw new AnnoSearchValidationError('Missing query parameter.');
    }
    
    // Add length limits
    if (trimmedQuery.length > 500) {
        throw new AnnoSearchValidationError('Query too long (max 500 characters)');
    }
    
    // Check for dangerous patterns
    validateNoSpecialChars(trimmedQuery);
    
    // Check query complexity
    validateQueryComplexity(trimmedQuery);
    
    const minKeywordLength = 3;
    const whitelistedShortKeywords = new Set(["uk", "ai", "us"]);
    const keywords = trimmedQuery.split(/\s+/);
    
    // Limit number of terms
    if (keywords.length > 20) {
        throw new AnnoSearchValidationError('Too many search terms (max 20)');
    }
    
    for (const keyword of keywords) {
        const normalizedKeyword = normalizeTerm(keyword);
        if (normalizedKeyword.length < minKeywordLength && !whitelistedShortKeywords.has(normalizedKeyword)) {
            throw new AnnoSearchValidationError(`Keyword "${keyword}" must be at least ${minKeywordLength} characters long.`);
        }
        if (!normalizedKeyword) {
            throw new AnnoSearchValidationError(`Keyword "${keyword}" contains invalid characters and is not valid after normalization.`);
        }
    }
}


export function validateAutocompleteQueryParameter(query: string): void {
    const minQueryLength = 3;
    const maxQueryLength = 100; // Add max length
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length > maxQueryLength) {
        throw new AnnoSearchValidationError(`Autocomplete query too long (max ${maxQueryLength} characters)`);
    }
    
    // Check for dangerous patterns
    validateNoSpecialChars(trimmedQuery);
    
    const normalizedQuery = normalizeTerm(trimmedQuery);
    if (!normalizedQuery) {
        throw new AnnoSearchValidationError('Missing autocomplete query parameter after normalization.');
    }
    if (/\s/.test(trimmedQuery)) {
        throw new AnnoSearchValidationError('Autocomplete query must not contain spaces.');
    }
    if (normalizedQuery.length < minQueryLength) {
        throw new AnnoSearchValidationError(`Autocomplete query must be at least ${minQueryLength} characters long.`);
    }
}



export function validateOffset(offset: number): void {
    if (offset < 0) {
        throw new AnnoSearchValidationError('Invalid paging');
    }
}

export function validatePageNumber(pageNumber: number): void {
    if (!Number.isInteger(pageNumber) || pageNumber < 0) {
        throw new AnnoSearchValidationError('Invalid "page" parameter: must be a non-negative integer');
    }
}

export function validateMaxHits(maxHits: number): void {
    if (!Number.isInteger(maxHits) || maxHits <= 0) {
        throw new AnnoSearchValidationError('Invalid "maxHits" configuration: must be a positive integer');
    }
}

export function validateMotivation(motivation: string): void {
    // handle when not included
    if (!motivation) {
        return;
    }

    if (!motivations.includes(motivation)) {
        throw new AnnoSearchValidationError('Invalid motivation parameter');
    }
}

export function validateDateRanges(ranges: string): void {
    // handle when not included
    if (!ranges) {
        return
    }
    // Split the ranges by space
    const rangeList = ranges.split(" ");
    // Define the regex pattern for a valid date range in ISO8601 format
    const rangePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    // Check each range
    for (const range of rangeList) {
        if (!rangePattern.test(range)) {
            throw new AnnoSearchValidationError(`Invalid range format: ${range}`);
        }

        // Further validate that the start date is before the end date
        const [start, end] = range.split("/");
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            throw new AnnoSearchValidationError(`Invalid date range: ${range}`);
        }
    }
}


export function validateUser(user: string): void {
    if (!user) {
        return;
    }
    // Ensure it is a valid URI
    const uriPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    const uriList = user.split(' ');
    for (const uri of uriList) {
        if (!uriPattern.test(uri)) {
            throw new AnnoSearchValidationError(`Invalid URI: ${uri}`);
        }
    }
}
