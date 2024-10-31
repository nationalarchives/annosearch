import { search as searchFunction } from './search';

class AnnoSearch {
  
  private maxHits: number;

  constructor(maxHits: number = 10) {
    this.maxHits = maxHits; 
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