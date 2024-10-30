import { search } from './search';

class AnnoSearch {
  private indexId: string;
  private query: string;
  private maxHits: number;

  constructor(indexId: string, query: string, maxHits: number) {
    this.indexId = indexId;
    this.query = query;
    this.maxHits = maxHits;
  }

  // Method to perform the search query
  async search() {
    await search(this.indexId, this.query, this.maxHits);
  }
}

export default AnnoSearch;