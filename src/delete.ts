import { handleError } from './utils';
import { createClient } from './quickwit';
import { AnnoSearchValidationError } from './errors';

const contentType = 'application/json'; 
const quickwitClient = createClient(contentType);

export async function deleteIndex(indexId: string) {
    try {
        if (!indexId.trim()) {
            throw new AnnoSearchValidationError('Invalid index parameter');
        }
        const response = await quickwitClient.delete(`indexes/${indexId}`);
        if (!response.data) {
            throw new AnnoSearchValidationError('No response data received from Quickwit');
        }
        console.log('Response:', response.data);
    } catch (error: any) {
        handleError(error);
    }
}