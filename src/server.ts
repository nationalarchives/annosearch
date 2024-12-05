// FILE: server.ts

import express from 'express';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json
import { handleWebError } from './utils';
import logger, { logErrorHandler } from './logger'; // Import shared logger
import pinoHttp from 'pino-http';
import { AnnoSearchNotFoundError } from './errors';
import validator from 'validator';

export async function serve(client: AnnoSearch) {
    const app = express();
    const port = client.getPort();
    const host = client.getHost()

    app.use(pinoHttp({ logger }));

    app.get('/:index/search', async (req, res) => {
        try {
            // Sanitize path parameter
            const index = validator.escape(req.params.index || '');
            // Sanitize query parameters
            const q = validator.escape(req.query.q as string || '');
            const page = validator.toInt(req.query.page as string || '0');
            const motivation = validator.escape(req.query.motivation as string || '');
            const date = validator.escape(req.query.date as string || '');
            const user = validator.escape(req.query.user as string || '');
            const results = await client.searchIndex(index, q, motivation, page, date, user);
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

    app.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    });
}