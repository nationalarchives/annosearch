// FILE: server.ts

import express from 'express';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json
import { handleWebError } from './utils';
import logger, { logErrorHandler } from './logger'; // Import shared logger
import pinoHttp from 'pino-http';
import { AnnoSearchNotFoundError, AnnoSearchValidationError } from './errors';


const client = new AnnoSearch();

export async function serve(argv: any) {
    const app = express();
    const port = argv.port;
    const host = argv.host;

    app.use(pinoHttp({ logger }));

    app.get('/:index/search', async (req, res) => {
        try {
            const { index } = req.params;
            const { q, page } = req.query;
            const pageNumber = page ? parseInt(page as string, 10) : 0;
            const maxHits = client.getMaxHits();
            // Validate the 'page' parameter
            if (!Number.isInteger(pageNumber) || pageNumber < 0) {
                throw new AnnoSearchValidationError('Invalid "page" parameter: must be a non-negative integer');
            }
            // Validate the 'maxHits' parameter
            if (!Number.isInteger(maxHits) || maxHits <= 0) {
                throw new AnnoSearchValidationError('Invalid "maxHits" configuration: must be a positive integer');
            }
            const offset = pageNumber * client.getMaxHits();
            const results = await client.searchIndex(index as string, q as string, offset);
            res.json(results);
        } catch (error: any) {
            handleWebError(error, res);
        }
    });

    app.get('/version', async (req, res) => {
        try {
            res.json({ version });
        } catch (error) {
            handleWebError(error, res);
        }
    });

    app.use((req, res, next) => {
        const error = new AnnoSearchNotFoundError(`404 Not Found: ${req.method} ${req.originalUrl}`);
        next(error);
    });
    app.use(logErrorHandler);

    app.listen(port, () => {
        console.log(`Server is running on ${host}:${port}`);
    });
}