import { cp } from 'fs/promises';

async function copyFiles() {
    try {
        await cp('src/index-config.yaml', 'dist/index-config.yaml', { recursive: false });
        console.log('File copied successfully.');
    } catch (error) {
        console.error('Error copying file:', error.message);
        process.exit(1); // Exit with failure if the copy fails
    }
}

copyFiles();

