import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import AnnoSearch from './AnnoSearch';

// Parse command-line arguments using yargs
yargs(hideBin(process.argv))
  .option('index', {
    alias: 'i',
    type: 'string',
    description: 'Index ID',
    demandOption: true
  })
  .option('query', {
    alias: 'q',
    type: 'string',
    description: 'Search query',
    demandOption: true
  })
  .option('max_hits', {
    alias: 'm',
    type: 'number',
    description: 'Maximum number of hits',
    default: 10 // Default max_hits if not specified
  })
  .help()
  .parseAsync()
  .then(argv => {
    // Create an instance of AnnoSearch and run the search query
    const client = new AnnoSearch(argv.index as string, argv.query as string, argv.max_hits as number);
    client.search();
  })
  .catch(error => {
    console.error('Error parsing arguments:', error);
  });