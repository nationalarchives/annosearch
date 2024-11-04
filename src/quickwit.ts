import axios from 'axios';

const baseURL = process.env.QUICKWIT_BASE_URL || 'http://localhost:7280/api/v1/';

export function createAxiosInstance(contentType: 'application/json' | 'application/yaml') {
    return axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': contentType,
        },
        timeout: 5000, // Set timeout to 5 seconds
    });
}