// errors.ts

export class AnnoSearchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor); // Captures the correct stack trace
    }
}

export class AnnoSearchValidationError extends AnnoSearchError {
    constructor(message = 'Invalid input data') {
        super(message);
    }
}

export class AnnoSearchNetworkError extends AnnoSearchError {
    constructor(message = 'Network error occurred') {
        super(message);
    }
}

export class AnnoSearchNotFoundError extends AnnoSearchError {
    constructor(message = 'Resource not found') {
        super(message);
    }
}

export class AnnoSearchParseError extends AnnoSearchError {
    constructor(message = 'Error parsing data') {
        super(message);
    }
}
