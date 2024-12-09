import { exec } from 'child_process';
import path from 'path';

const cliPath = path.resolve(__dirname, '../dist/index.js');

function runCLI(args: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(`node ${cliPath} ${args}`, (error, stdout, stderr) => {
            if (error) {
                reject({ stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
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
        const { stdout } = await runCLI('load --index test-index --uri https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/manifest.json --type Manifest');
        expect(stdout).toContain('Loading Manifest');
    });

    it('should fail if required arguments are missing', async () => {
        await expect(runCLI('load --index test-index --uri https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/manifest.json')).rejects.toMatchObject({
            stderr: expect.stringContaining('Missing required argument: type'),
        });
    });
});

describe('CLI: search command', () => {
    it('should perform a search successfully', async () => {
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

// describe('CLI: serve command', () => {
//     it('should start the server successfully', async () => {
//         const { stdout } = await runCLI('serve --port 8080 --host localhost');
//         expect(stdout).toContain('Server running on http://localhost:8080');
//     });
// });



