import { search as searchFunction } from './search';
import { init } from './init';

class AnnoSearch {
    constructor(
        private maxHits: number = 10,
        private port: number = 3000,
        private host: string = 'http://localhost'
    ) { }

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

    async search(indexId: string, query: string, startOffset: number) {
        return searchFunction(indexId, query, this.maxHits, startOffset);
    }

    async init(indexId: string) {
        return await init(indexId);
    }
    
}

export default AnnoSearch;