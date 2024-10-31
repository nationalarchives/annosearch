import yargs from 'yargs';
import express from 'express';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json
import { printResults, handleError } from './utils';

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
        .option('max_hits', {
            alias: 'm',
            type: 'number',
            description: 'Maximum number of hits',
            default: 10, // Default max_hits if not specified
        });
}

async function searchCommand(argv: any) {
    try {
        console.log(`Searching index: ${argv.index}, Query: ${argv.query}, Max Hits: ${argv.max_hits}`);
        const results = await client.search(argv.index as string, argv.query as string, argv.max_hits as number);
        printResults(results);
    } catch (error) {
        handleError(error);
    }
}

async function serveCommand(argv: any) {
    const app = express();
    const port = argv.port || 3000;

    app.get('/search', async (req, res) => {
        const { index, query, max_hits } = req.query;
        try {
            const results = await client.search(index as string, query as string, parseInt(max_hits as string) || 10);
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
        console.log(`Server is running on http://localhost:${port}`);
    });
}

async function serveOptions(yargs: any) {
    return yargs.option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: 3000,
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