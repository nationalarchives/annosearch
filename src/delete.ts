import { handleError } from './utils';
import { createAxiosInstance } from './quickwit';

const contentType = 'application/json'; 
const axiosInstance = createAxiosInstance(contentType);

export async function deleteIndex(indexId: string) {
    try {
        const response = await axiosInstance.delete(`indexes/${indexId}`);
        console.log('Response:', response.data);
    } catch (error) {
        handleError(error);
    }
}