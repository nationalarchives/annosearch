import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);

export async function deleteIndex(indexId: string) {
    if (!indexId.trim()) {
        throw new AnnoSearchValidationError('Invalid index parameter');
    }
    const response = await quickwitClient.delete(`indexes/${indexId}`);
    if (response.status === 200 && response.data) {
        console.log('Index deleted successfully');
    } else {
        throw new AnnoSearchValidationError('Failed to delete index');
    }
}