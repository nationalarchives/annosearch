import axios from 'axios';
import { handleError } from './utils';

const axiosInstance = axios.create({
    baseURL: process.env.QUICKWIT_BASE_URL || 'http://localhost:7280/api/v1/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000, // Set timeout to 5 seconds
});

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
