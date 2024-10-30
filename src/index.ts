import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json

const client = new AnnoSearch();

// Configure yargs to manage commands and options
yargs(hideBin(process.argv))
    .scriptName('annosearch')
    .usage('$0 <command> [options]')
    .command(
        'search',
        'Perform a search query on a specified index',
        (yargs) => {
            return yargs
                .options({
                    index: {
                        alias: 'i',
                        type: 'string',
                        description: 'Index ID',
                        demandOption: true,
                    },
                    query: {
                        alias: 'q',
                        type: 'string',
                        description: 'Search query',
                        demandOption: true,
                    },
                    max_hits: {
                        alias: 'm',
                        type: 'number',
                        description: 'Maximum number of hits',
                        default: 20, // Default max_hits if not specified
                    },
                });
        },
        (argv) => {
            client.search(argv.index, argv.query, argv.max_hits);
        }
    )
    .command(
        'version',
        'Show the version of the application',
        {},
        () => {
            console.log(`Version: ${version}`);
        }
    )
    .demandCommand(1, 'You need to specify at least one command to proceed.')
    .strict()
    .help()
    .alias('help', 'h')
    .version(false)
    .argv;
