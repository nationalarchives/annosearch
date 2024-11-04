import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: process.env.QUICKWIT_BASE_URL || 'http://localhost:7280/api/v1/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000, // Set timeout to 5 seconds
});

export async function deleteIndex(indexId: string) {
    try {
        const response = await axiosInstance.delete(`indexes/${indexId}`);
        console.log('Response:', response.data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}