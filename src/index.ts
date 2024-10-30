import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';
import { version } from '../package.json'; // Import version from package.json

const client = new AnnoSearch();

// Function to print the results
function printResults(results: unknown): void {
    console.log(JSON.stringify(results, null, 2)); // Print the returned JSON
}

// Function to handle errors
function handleError(error: unknown): void {
    if (error instanceof Error) {
        console.error('Error performing search:', error.message);
    } else {
        console.error('Error performing search:', error);
    }
}

// Define yargs commands
async function main() {
    try {
        await yargs(hideBin(process.argv))
            .scriptName('annosearch')
            .usage('$0 <command> [options]')
            .command(
                'search',
                'Perform a search query on a specified index',
                (yargs) => {
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
                },
                async (argv) => {
                    try {
                        console.log(`Searching index: ${argv.index}, Query: ${argv.query}, Max Hits: ${argv.max_hits}`);
                        const results = await client.search(argv.index as string, argv.query as string, argv.max_hits as number);
                        printResults(results);
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'version',
                'Show the version of the application',
                () => { },
                () => {
                    console.log(`Version: ${version}`);
                }
            )
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
