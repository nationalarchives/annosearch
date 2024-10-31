import { search as searchFunction } from './search';

class AnnoSearch {
  // Method to perform the search query
  async search(indexId: string, query: string, maxHits: number, startOffset: number) {
    return await searchFunction(indexId, query, maxHits, startOffset);
  }
}

export default AnnoSearch;