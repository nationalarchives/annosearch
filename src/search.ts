import { handleError } from './utils';
import { createAxiosInstance } from './quickwit';

const contentType = 'application/json';
const axiosInstance = createAxiosInstance(contentType);

export async function searchIndex(indexId: string, query: string, maxHits: number, startOffset: number) {
    try {
        console.log(`Sending request to Quickwit with indexId: ${indexId}, query: ${query}, and maxHits: ${maxHits} at offset: ${startOffset}`);

        const response = await axiosInstance.post(`${indexId}/search`, {
            query: query,
            max_hits: maxHits,
            start_offset: startOffset,
        });

        return response.data;
    } catch (error: any) {
        handleError(error);
    }
}
