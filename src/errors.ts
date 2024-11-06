// errors.ts

export class AnnoSearchError extends Error {
    constructor(message: string, public statusCode: number = 500) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor); // Captures the correct stack trace
    }
}

export class AnnoSearchNotFoundError extends AnnoSearchError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class AnnoSearchValidationError extends AnnoSearchError {
    constructor(message = 'Invalid input data') {
        super(message, 400);
    }
}

export class AnnoSearchNetworkError extends AnnoSearchError {
    constructor(message = 'Network error occurred') {
        super(message, 503);
    }
}

export class AnnoSearchParseError extends AnnoSearchError {
    constructor(message = 'Error parsing data') {
        super(message, 422); // 422 Unprocessable Entity is often used for parsing issues
    }
}
