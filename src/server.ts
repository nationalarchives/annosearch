// FILE: server.ts

import express from 'express';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json
import { handleWebError } from './utils';

const client = new AnnoSearch();

export async function serve(argv: any) {
    const app = express();

    const port = argv.port;
    const host = argv.host;

    app.get('/:index/search', async (req, res) => {
        const { index } = req.params;
        const { q, page } = req.query;

        const pageNumber = parseInt(page as string) || 0;
        const offset = pageNumber * client.getMaxHits();

        try {
            const results = await client.searchIndex(index as string, q as string, offset);
            res.json(results);
        } catch (error: any) {
            handleWebError(error, res);
        }
    });

    app.get('/version', async (req, res) => {
        res.json({ version });
    });

    app.listen(port, () => {
        console.log(`Server is running on ${host}:${port}`);
    });
}