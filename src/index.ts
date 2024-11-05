import yargs from 'yargs';
import express from 'express';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json
import { printJson, handleError } from './utils';

const client = new AnnoSearch();

async function searchOptions(yargs: any) {
    return yargs
        .option('index', {
            alias: 'i',
            type: 'string',
            description: 'Index ID',
            demandOption: true,
        })
        .option('query', {
            alias: 'q',
            type: 'string',
            description: 'Search query',
            demandOption: true,
        })
        .option('page', {
            alias: 'p',
            type: 'number',
            description: 'Page number',
            default: 0, // Default page number if not specified
        });
}

async function searchCommand(argv: any) {
    try {
        const offset = argv.page * client.getMaxHits();
        const results = await client.searchIndex(argv.index as string, argv.query as string, offset as number);
        printJson(results);
    } catch (error) {
        handleError(error);
    }
}

async function initCommand(argv: any) {
    try {
        await client.initIndex(argv.index as string);
    } catch (error) {
        handleError(error);
    }
}

async function initOptions(yargs: any) {
    return yargs.option('index', {
        alias: 'i',
        type: 'string',
        description: 'Index ID',
        demandOption: true,
    });
}

async function loadCommand(argv: any) {
    try {
        await client.loadIndex(argv.index as string, argv.uri as string, argv.type as string);
    } catch (error) {
        handleError(error);
    }
}

async function loadOptions(yargs: any) {
    return yargs
        .option('index', {
            alias: 'i',
            type: 'string',
            description: 'Index ID',
            demandOption: true,
        })
        .option('type', {
            alias: 't',
            type: 'string',
            description: 'Type of IIIF specification',
            choices: ['Manifest', 'Collection', 'AnnotationPage', 'AnnotationCollection'], 
            default: 'Manifest',
        })
        .option('uri', {
            alias: 'u',
            type: 'string',
            description: 'URI to load the index from',
            demandOption: true,
        });
}

async function deleteCommand(argv: any) {
    try {
        await client.deleteIndex(argv.index as string);
    } catch (error) {
        handleError(error);
    }
}

async function deleteOptions(yargs: any) {
    return yargs.option('index', {
        alias: 'i',
        type: 'string',
        description: 'Index ID',
        demandOption: true,
    });
}

async function serveCommand(argv: any) {
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
        } catch (error) {
            const errorMessage = (error as Error).message;
            res.status(500).json({ error: errorMessage });
        }
    });

    app.get('/version', async (req, res) => {
        res.json({ version });
    });

    app.listen(port, () => {
        console.log(`Server is running on ${host}:${port}`);
    });
}

async function serveOptions(yargs: any) {
    return yargs.option('port', {
        type: 'number',
        description: 'Port to run the server on',
        default: client.getPort(),
    })
    .option('host', {
        type: 'string',
        description: 'Host to run the server on',
        default: client.getHost(),
    });
}

async function versionOptions(yargs: any) { }

function versionCommand() {
    console.log(JSON.stringify({ version }));
}

async function main() {
    try {
        await yargs(hideBin(process.argv))
            .scriptName('annosearch')
            .usage('$0 <command> [options]')
            .command('init', 'Initialize an index with the provided ID', initOptions, initCommand)
            .command('load', 'Load an index with the provided ID from a URI', loadOptions, loadCommand)
            .command('delete', 'Delete an index with the provided ID', deleteOptions, deleteCommand)
            .command('search', 'Perform a search query on a specified index', searchOptions, searchCommand)
            .command('serve', 'Start an Express server to call search', serveOptions, serveCommand)
            .command('version', 'Show the version of the application', versionOptions, versionCommand)
            .demandCommand(1, 'You need to specify a command (e.g., search, version)')
            .strict()
            .help()
            .alias('h', 'help')
            .alias('v', 'version')
            .showHelpOnFail(true)
            .parseAsync();
    } catch (error) {
        handleError(error);
    }
}

main();