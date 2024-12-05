import { AnnoSearchValidationError } from "./errors";

export const motivations = [
    'painting',
    'supplementing',
    'contextualizing',
    'contentState',
    'highlighting',
    'commenting',
    'tagging'
];

export function validateQueryParameter(query: string): void {
    if (!query.trim()) {
        throw new AnnoSearchValidationError('Missing query parameter');
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

    const uriPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    const userList = user.split(' ');

    for (const u of userList) {
        if (!uriPattern.test(u)) {
            throw new AnnoSearchValidationError(`Invalid URI in user parameter: ${u}`);
        }
    }
}