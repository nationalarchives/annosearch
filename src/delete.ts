import { handleError } from './utils';
import { createClient } from './quickwit';

const contentType = 'application/json'; 
const quickwitClient = createClient(contentType);

export async function deleteIndex(indexId: string) {
    try {
        const response = await quickwitClient.delete(`indexes/${indexId}`);
        console.log('Response:', response.data);
    } catch (error) {
        handleError(error);
    }
}