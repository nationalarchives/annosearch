import { searchIndex as searchFunction } from './search';
import { initIndex as initFunction } from './init';
import { deleteIndex as deleteFunction } from './delete';
import { loadIndex as loadFunction } from './load';

interface Config {
    maxHits: number;
    port: number;
    host: string;
    searchUrl: string;
}

function loadConfig(): Config {
    return {
        maxHits: parseInt(process.env.ANNOSEARCH_MAX_HITS || '20'),
        port: parseInt(process.env.ANNOSEARCH_PORT || '3000'),
        host: process.env.ANNOSEARCH_HOST || 'http://localhost',
        searchUrl: process.env.ANNOSEARCH_SEARCH_URL || 'https://example.com/iiif/v2/content/search',
    };
}

class AnnoSearch {
    private maxHits: number;
    private port: number;
    private host: string;
    private searchUrl: string;

    constructor({ maxHits, port, host, searchUrl }: Config = loadConfig()) {
        this.maxHits = maxHits;
        this.port = port;
        this.host = host;
        this.searchUrl = searchUrl;
    }

    getHost(): string {
        return this.host;
    }

    getPort(): number {
        return this.port;
    }

    getMaxHits(): number {
        return this.maxHits;
    }

    getSearchUrl(): string {
        return this.searchUrl;
    }

    async loadIndex(indexId: string, uri: string, type: string) {
        return await loadFunction(indexId, uri, type);
    }

    async searchIndex(indexId: string, query: string, startOffset: number, searchUrl: string) {
        return searchFunction(indexId, query, this.maxHits, startOffset, searchUrl);
    }

    async initIndex(indexId: string) {
        return await initFunction(indexId);
    }

    async deleteIndex(indexId: string) {
        return await deleteFunction(indexId);
    }
}

export default AnnoSearch;