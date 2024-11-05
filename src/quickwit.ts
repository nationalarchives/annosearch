import axios from 'axios';

const baseURL = process.env.QUICKWIT_BASE_URL || 'http://localhost:7280/api/v1/';
const timeout = parseInt(process.env.QUICKWIT_TIMEOUT || '5000', 10);

export function createAxiosInstance(contentType: 'application/json' | 'application/yaml' | 'application/x-ndjson') {
    return axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': contentType,
        },
        timeout: timeout, // 5 seconds timeout
    });
}