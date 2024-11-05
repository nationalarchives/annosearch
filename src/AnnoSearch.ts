import { searchIndex as searchFunction } from './search';
import { initIndex as initFunction } from './init';
import { deleteIndex as deleteFunction } from './delete';
import { loadIndex as loadFunction } from './load';

interface Config {
    maxHits: number;
    port: number;
    host: string;
}

function loadConfig(): Config {
    return {
        maxHits: parseInt(process.env.ANNOSEARCH_MAX_HITS || '10', 10),
        port: parseInt(process.env.ANNOSEARCH_PORT || '3000', 10),
        host: process.env.ANNOSEARCH_HOST || 'http://localhost',
    };
}

class AnnoSearch {
    private maxHits: number;
    private port: number;
    private host: string;

    constructor({ maxHits, port, host }: Config = loadConfig()) {
        this.maxHits = maxHits;
        this.port = port;
        this.host = host;
    }

    setHost(host: string) {
        this.host = host;
    }

    getHost(): string {
        return this.host;
    }

    setPort(port: number) {
        this.port = port;
    }

    getPort(): number {
        return this.port;
    }

    setMaxHits(maxHits: number) {
        this.maxHits = maxHits;
    }

    getMaxHits(): number {
        return this.maxHits;
    }

    async loadIndex(indexId: string, uri: string) {
        return await loadFunction(indexId, uri);
    }

    async searchIndex(indexId: string, query: string, startOffset: number) {
        return searchFunction(indexId, query, this.maxHits, startOffset);
    }

    async initIndex(indexId: string) {
        return await initFunction(indexId);
    }

    async deleteIndex(indexId: string) {
        return await deleteFunction(indexId);
    }
}

export default AnnoSearch;