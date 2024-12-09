import execa from 'execa';
import path from 'path';
import axios from 'axios';

const cliPath = path.resolve(__dirname, '../dist/index.js');

async function runCLI(command: string) {
    return execa('node', [cliPath, ...command.split(' ')]);
}

describe('CLI: version command', () => {
    it('should display the version', async () => {
        const { stdout } = await runCLI('version');
        expect(stdout).toContain('version');
    });
});

describe('CLI: init command', () => {
    it('should initialize an index successfully', async () => {
        const { stdout } = await runCLI('init --index test-index');
        expect(stdout).toContain('Index created successfully');
    });

    it('should fail if no index ID is provided', async () => {
        await expect(runCLI('init')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: index'),
        });
    });
});

describe('CLI: load command', () => {
    it('should load an index successfully', async () => {
        const { stdout } = await runCLI('load --index test-index --uri https://gist.githubusercontent.com/jptmoore/e10bae6350fcf1324e045b78566cd749/raw/f35478c9165aa41697cc9f5f563e07820db5d289/bt209.json --type Manifest');
        expect(stdout).toContain('Loading Manifest');
    });

    it('should fail if required arguments are missing', async () => {
        await expect(runCLI('load --index test-index --uri https://gist.githubusercontent.com/jptmoore/e10bae6350fcf1324e045b78566cd749/raw/f35478c9165aa41697cc9f5f563e07820db5d289/bt209.json')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: type'),
        });
    });
});

describe('CLI: search command', () => {
    it('should perform a search with empty result successfully', async () => {
        const { stdout } = await runCLI('search --index test-index --query foobar');
        const output = JSON.parse(stdout);
        expect(output.items).toEqual([]);
    });

    it('should fail if required arguments are missing', async () => {
        await expect(runCLI('search --index test-index')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: query'),
        });
    });
});


describe('CLI: serve command', () => {
    let serverProcess: execa.ExecaChildProcess;

    beforeAll(async () => {
        serverProcess = execa('node', [cliPath, 'serve']);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the server to start
    });

    afterAll(() => {
        serverProcess.kill();
    });

    it('API: version request', async () => {
        const response = await axios.get('http://localhost:3000/version');
        const version = require('../package.json').version;
        expect(response.data).toEqual({ version });
    });

    it('API: should perform a search with empty result successfully', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=foobar');
        expect(response.data.items).toEqual([]);
    });

    it('API: should perform a search and return results from one item', async () => {

        // Perform a search for a keyword from the JSON data
        const response = await axios.get('http://localhost:3000/test-index/search?q=William');
        expect(response.data.items.length).toBeGreaterThan(0);

        // Validate one of the results
        const firstItem = response.data.items[0];
        expect(firstItem).toMatchObject({
            id: expect.stringContaining('http'),
            type: 'Annotation',
            motivation: 'supplementing',
            body: {
                type: 'TextualBody',
                value: expect.stringContaining('William'),
                format: 'text/plain',
            },
            target: expect.any(String),
        });
    });

});

describe('CLI: delete command', () => {
    it('should delete an index successfully', async () => {
        const { stdout } = await runCLI('delete --index test-index');
        expect(stdout).toContain('Index deleted successfully');
    });

    it('should fail if index ID is missing', async () => {
        await expect(runCLI('delete')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: index'),
        });
    });
});




