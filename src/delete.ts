import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';
import { printJson } from './utils';

const contentType = 'application/json';
const quickwitClient = createClient(contentType);

export async function deleteIndex(indexId: string) {
    if (!indexId.trim()) {
        throw new AnnoSearchValidationError('Invalid index parameter');
    }
    const response = await quickwitClient.delete(`indexes/${indexId}`);
    if (!response.data) {
        throw new AnnoSearchValidationError('No response data received from Quickwit');
    }
    printJson(response.data);
}