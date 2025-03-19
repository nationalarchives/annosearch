import { searchIndex as searchFunction } from './search';
import { searchAutocomplete as autocompleteFunction } from './search';
import { initIndex as initFunction } from './init';
import { deleteIndex as deleteFunction } from './delete';
import { loadIndex as loadFunction } from './load';

interface Config {
    maxHits: number;
    port: number;
    host: string;
    corsOrigin: string;
    searchUrl: string;
}

function loadConfig(): Config {
    return {
        maxHits: parseInt(process.env.ANNOSEARCH_MAX_HITS || '20'),
        port: parseInt(process.env.ANNOSEARCH_PORT || '3000'),
        host: process.env.ANNOSEARCH_HOST || 'localhost',
        corsOrigin: process.env.ANNOSEARCH_CORS_ORIGIN || '*',
        searchUrl: process.env.ANNOSEARCH_PUBLIC_URL || 'http://localhost:3000',
    };
}

class AnnoSearch {
    private maxHits: number;
    private port: number;
    private host: string;
    private corsOrigin: string;
    private searchUrl: string;

    constructor({ maxHits, port, host, corsOrigin, searchUrl }: Config = loadConfig()) {
        this.maxHits = maxHits;
        this.port = port;
        this.host = host;
        this.corsOrigin = corsOrigin;
        this.searchUrl = searchUrl;
    }

    getHost(): string {
        return this.host;
    }

    setHost(host: string) {
        this.host = host;
    }

    getPort(): number {
        return this.port;
    }

    setPort(port: number) {
        this.port = port;
    }

    getCorsOrigin(): string {
        return this.corsOrigin;
    }

    setCorsOrigin(corsOrigin: string) {
        this.corsOrigin = corsOrigin;
    }
    
    getMaxHits(): number {
        return this.maxHits;
    }

    setMaxHits(maxHits: number) {
        this.maxHits = maxHits
    }

    getSearchUrl(): string {
        return this.searchUrl;
    }

    setSearchUrl(searchUrl: string) {
        this.searchUrl = searchUrl;
    }

    async loadIndex(indexId: string, uri: string, type: string, commit: boolean) {
        return await loadFunction(indexId, uri, type, commit);
    }

    async searchIndex(indexId: string, query: string, motivation: string, page: number, date: string, user: string) {
        return searchFunction(indexId, query, motivation, this.maxHits, page, this.searchUrl, date, user);
    }
    
    async searchAutocomplete(indexId: string, query: string, ignoredParams: string[]) {
        return await autocompleteFunction(indexId, query, this.maxHits, this.searchUrl, ignoredParams);
    }

    async initIndex(indexId: string) {
        return await initFunction(indexId);
    }

    async deleteIndex(indexId: string) {
        return await deleteFunction(indexId);
    }
}

export default AnnoSearch;