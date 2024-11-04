import { searchIndex as searchFunction } from './search';
import { initIndex as initFunction } from './init';
import { deleteIndex as deleteFunction } from './delete';

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