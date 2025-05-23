import execa from 'execa';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import nock from 'nock';

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
        expect(stdout).toContain('created');
    });

    it('should fail if no index ID is provided', async () => {
        await expect(runCLI('init')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: index'),
        });
    });
});

describe('CLI: load command', () => {
    beforeEach(() => {
        // Read the JSON file
        const mockFilePath = path.resolve(__dirname, 'AnnotationCollection.json');
        const fileContent = fs.readFileSync(mockFilePath, 'utf-8');

        // Mock the remote URI to return the file content
        nock('https://gist.githubusercontent.com')
            .get('/jptmoore/2f4767b74b296064c25d321f61a49480/raw/f227010619c003cb83cc937cacb1b4fcbaef3c68/AnnotationCollection')
            .reply(200, JSON.parse(fileContent));
    });

    afterEach(() => {
        nock.cleanAll(); // Clean up mocks after each test
    });

    it('should load an index successfully from the mocked URI', async () => {
        const { stdout } = await runCLI(
            'load --index test-index --uri https://gist.githubusercontent.com/jptmoore/2f4767b74b296064c25d321f61a49480/raw/f227010619c003cb83cc937cacb1b4fcbaef3c68/AnnotationCollection --type AnnotationCollection --commit'
        );
        expect(stdout).toContain('Loading AnnotationCollection');
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

    it('API: should return the first page of results', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&page=0');
        // Validate the number of items returned on the first page
        expect(response.data.items.length).toBeLessThanOrEqual(20); // Assuming 20 items per page
    });

    it('API: should return the last page of results', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&page=1');
        // Validate that the number of items matches the remainder
        expect(response.data.items.length).toBe(5);
    });

    it('API: should return an empty page for out-of-range page number', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&page=2');
        // Validate that the response contains no items
        expect(response.data.items).toEqual([]);
    });

    it('API: should return results from one item', async () => {
        // Perform a search for a keyword from the JSON data
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation');
        expect(response.data.items.length).toBeGreaterThan(0);
        const firstItem = response.data.items[0];
        expect(firstItem).toMatchObject({
            id: expect.stringContaining('http'),
            type: 'Annotation',
            motivation: 'highlighting',
            body: {
                type: 'TextualBody',
                value: expect.stringContaining('Annotation'),
                format: 'text/plain',
            },
        });
        expect(firstItem.target).toMatchObject({
            id: expect.stringContaining('http'),
            partOf: {
                id: expect.stringContaining('http'),
                type: 'AnnotationCollection',
            },
        });
    });


    it('API: should validate the total count in partOf', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation');
        // Validate the partOf.total matches the sum of all pages
        expect(response.data.partOf.total).toBe(25); // Assuming 25 total items
    });

    it('API: should validate first and last page links in partOf', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation');
        // Validate the first page link
        expect(response.data.partOf.first.id).toContain('page=0');
        expect(response.data.partOf.first.type).toBe('AnnotationPage');
        // Validate the last page link
        expect(response.data.partOf.last.id).toContain('page=1');
        expect(response.data.partOf.last.type).toBe('AnnotationPage');
    });

    it('API: should return results with specific motivation', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&motivation=highlighting');
        // Validate that all returned items have the specified motivation
        response.data.items.forEach((item: { motivation: string; }) => {
            expect(item.motivation).toBe('highlighting');
        });
    });

    it('API: should return results within a specific date range', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&date=2024-01-01T00:00:00Z/2024-12-31T23:59:59Z');
        // Validate that all items are within the specified date range
        response.data.items.forEach((item: { created: string; }) => {
            const createdDate = new Date(item.created);
            expect(createdDate >= new Date('2024-01-01T00:00:00Z')).toBeTruthy();
            expect(createdDate <= new Date('2024-12-31T23:59:59Z')).toBeTruthy();
        });
    });

    it('API: should return results created by a specific user', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&user=http://example.org/users/1');
        // Validate that all items were created by the specified user
        response.data.items.forEach((item: { creator: { id: string; }; }) => {
            expect(item.creator.id).toBe('http://example.org/users/1');
        });
    });

    it('API: should return an empty result for excessively large page number', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&page=100');
        expect(response.data.items).toEqual([]);
    });

    it('API: should return filtered results for multiple parameters', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation&motivation=highlighting&date=2024-01-01T00:00:00Z/2024-12-31T23:59:59Z&user=http://example.org/users/1');
        response.data.items.forEach((item: any) => {
            expect(item.motivation).toBe('highlighting');
            const createdDate = new Date(item.created);
            expect(createdDate >= new Date('2024-01-01T00:00:00Z')).toBeTruthy();
            expect(createdDate <= new Date('2024-12-31T23:59:59Z')).toBeTruthy();
            expect(item.creator.id).toBe('http://example.org/users/1');
        });
    });

    it('API: should return a 400 error for invalid page number', async () => {
        await expect(axios.get('http://localhost:3000/test-index/search?q=annotation&page=-1')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return a 400 error for missing query parameter', async () => {
        await expect(axios.get('http://localhost:3000/test-index/search')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return a 404 error for invalid path', async () => {
        await expect(axios.get('http://localhost:3000/invalid-path')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('API: should return a 404 error for invalid method', async () => {
        await expect(axios.post('http://localhost:3000/version')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('API: should return 400 error for invalid date range', async () => {
        await expect(axios.get('http://localhost:3000/test-index/search?q=annotation&date=invalid')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return 400 error for invalid motivation', async () => {
        await expect(axios.get('http://localhost:3000/test-index/search?q=annotation&motivation=invalid')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return 400 error for invalid user', async () => {
        await expect(axios.get('http://localhost:3000/test-index/search?q=annotation&user=invalid')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return 404 error for missing index', async () => {
        await expect(axios.get('http://localhost:3000/missing-index/search?q=annotation')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('API: should return keyword matches for autocomplete', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno');
        // Validate that all returned items contain the keyword
        response.data.items.forEach((item: { value: string; }) => {
            expect(item.value).toContain('anno');
        });
    });

    it('API: should return a 400 status for missing keyword', async () => {
        await expect(axios.get('http://localhost:3000/test-index/autocomplete')).rejects.toMatchObject({
            response: { status: 400 },
        });
    });

    it('API: should return a 404 status for missing index', async () => {
        await expect(axios.get('http://localhost:3000/missing-index/autocomplete?q=anno')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('API: should return a 404 status for invalid path', async () => {
        await expect(axios.get('http://localhost:3000/invalid-path/autocomplete?q=anno')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });

    it('API: should return ignored parameters in the response', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno&date=2023-12-01&user=12345');
        expect(response.data).toHaveProperty('ignored');
        expect(response.data.ignored).toEqual(expect.arrayContaining(['date', 'user']));
    });

    it('API: should not include ignored property when no ignored parameters are present', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno');
        expect(response.data).not.toHaveProperty('ignored');
    });

    it('API: should not include the ignored property when no ignored parameters are present', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno&irrelevant=value');
        expect(response.data).not.toHaveProperty('ignored');
    });

    it('API: should return valid items even with ignored parameters present', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno&date=2023-12-01');
        response.data.items.forEach((item: { value: string }) => {
            expect(item.value).toContain('anno');
        });
        expect(response.data.ignored).toEqual(expect.arrayContaining(['date']));
    });

    it('API: should validate the total property for each autocomplete item', async () => {
        const response = await axios.get('http://localhost:3000/test-index/autocomplete?q=anno');
        response.data.items.forEach((item: { total: number }) => {
            expect(item).toHaveProperty('total');
            expect(typeof item.total).toBe('number');
            expect(item.total).toBeGreaterThanOrEqual(0);
        });
    });

    it('API: should return highlighting results for a single term', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=text');

        expect(response.data.annotations.length).toBeGreaterThan(0);

        const firstAnnotationPage = response.data.annotations[0];
        expect(firstAnnotationPage).toMatchObject({
            type: 'AnnotationPage',
            items: expect.any(Array),
        });

        const firstItem = firstAnnotationPage.items[0];
        expect(firstItem).toMatchObject({
            id: expect.stringContaining('http'),
            type: 'Annotation',
            motivation: 'highlighting',
            target: {
                type: 'SpecificResource',
                source: expect.stringContaining('http'),
                selector: [
                    {
                        type: 'TextQuoteSelector',
                        prefix: expect.any(String),
                        exact: 'text',
                        suffix: expect.any(String),
                    },
                ],
            },
        });
    });

    it('API: should return results for multiple query terms', async () => {
        const response = await axios.get('http://localhost:3000/test-index/search?q=annotation text');

        expect(response.data.annotations.length).toBeGreaterThan(0);

        const annotationItems = response.data.annotations[0].items;
        expect(annotationItems.length).toBeGreaterThan(1); // Should return multiple items

        for (const item of annotationItems) {
            expect(item).toMatchObject({
                id: expect.stringContaining('http'),
                type: 'Annotation',
                motivation: 'highlighting',
                target: {
                    type: 'SpecificResource',
                    source: expect.stringContaining('http'),
                    selector: expect.arrayContaining([
                        {
                            type: 'TextQuoteSelector',
                            prefix: expect.any(String),
                            exact: expect.stringMatching(/Annotation|text/), 
                            suffix: expect.any(String),
                        },
                    ]),
                },
            });
        }
    });

});

describe('CLI: invalid command', () => {
    it('should return an error for an unknown command', async () => {
        await expect(runCLI('unknown-command')).rejects.toMatchObject({
            stderr: expect.stringContaining('Unknown argument: unknown-command'),
        });
    });
});



describe('CLI: delete command', () => {
    it('should delete an index successfully', async () => {
        const { stdout } = await runCLI('delete --index test-index');
        expect(stdout).toContain('deleted');
    });

    it('should fail if index ID is missing', async () => {
        await expect(runCLI('delete')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: index'),
        });
    });
});




