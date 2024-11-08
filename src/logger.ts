// FILE: logger.ts

import { Request, Response, NextFunction } from 'express';
import { handleWebError } from './utils';
import pino from 'pino';

// Define the logger configuration
const logger = pino({
    level: 'info',  // Default log level
    timestamp: pino.stdTimeFunctions.isoTime,  // ISO time format for easier readability and consistency
    formatters: {
        level: (label) => ({ level: label }),  // Single-line style for log levels
    },
    messageKey: 'msg',  // Key for the log message
    transport: {
        target: 'pino-pretty',  // Use pino-pretty to format logs in a readable way
        options: {
            colorize: true,  // Adds color to the console output
            singleLine: true,  // Ensures logs appear in a single line for easier parsing and reading
        },
    },
});


// Middleware to log other errors using handleWebError
export function logErrorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
    handleWebError(error, res);
}

export default logger;
