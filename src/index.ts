#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';
import { serve } from './server';
import { printJson, logError } from './utils';
import { version } from '../package.json'; // Import version from package.json
import { motivations } from './validate';

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
        .option('motivation', {
            alias: 'm',
            type: 'string',
            description: 'Motivation',
            choices: motivations,
            demandOption: false,
        })
        .option('date', {
            alias: 'd',
            type: 'string',
            description: 'Date range',
            demandOption: false,
        })
        .option('user', {
            alias: 'u',
            type: 'string',
            description: 'User ID',
            demandOption: false,
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
        const results = await client.searchIndex(argv.index as string, argv.query as string, argv.motivation, argv.page as number, argv.date as string, argv.user as string);
        printJson(results);
    } catch (error) {
        logError(error);
    }
}

async function initCommand(argv: any) {
    try {
        await client.initIndex(argv.index as string);
    } catch (error) {
        logError(error);
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
        await client.loadIndex(argv.index as string, argv.uri as string, argv.type as string, argv.commit as boolean);
    } catch (error) {
        logError(error);
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
            description: 'Type of IIIF specification or W3C web annotation collection',
            choices: ['Manifest', 'Collection', 'AnnotationCollection'],
            demandOption: true,
        })
        .option('commit', {
            type: 'boolean',
            description: 'Force commit the changes to the index',
            default: false
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
        logError(error);
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
        })
        .option('cors', {
            type: 'string',
            description: 'CORS origin',
            default: client.getCorsOrigin(),
        });
}

async function serveCommand(argv: any) {
    client.setPort(argv.port);
    client.setHost(argv.host);
    client.setCorsOrigin(argv.cors);
    serve(client);
}

async function versionOptions(yargs: any) { }

function versionCommand() {
    printJson({ version });
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
        logError(error);
    }
}

main();