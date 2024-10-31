import { timeStamp } from 'console';
import { search as searchFunction } from './search';

class AnnoSearch {
  
  private maxHits: number;
  private port: number;
  private host: string;

  constructor(maxHits: number = 10, port: number = 3000, host: string = 'http://localhost') {
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

  async search(indexId: string, query: string, startOffset: number) {
    return await searchFunction(indexId, query, this.maxHits, startOffset);
  }
}

export default AnnoSearch;