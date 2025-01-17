import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);

async function deleteIndexWorker(indexId: string) {
    if (!indexId.trim()) {
        throw new AnnoSearchValidationError('Invalid index parameter');
    }
    const response = await quickwitClient.delete(`indexes/${indexId}`);
    if (response.status === 200 && response.data) {
        //console.log(`Index ${indexId} successfully deleted`);
    } else {
        throw new AnnoSearchValidationError('Failed to delete index');
    }
}

export async function deleteIndex(indexId: string) {
    await deleteIndexWorker(indexId + '_annotations');
    await deleteIndexWorker(indexId + '_autocomplete');
    console.log(`Index ${indexId} successfully deleted`);
}