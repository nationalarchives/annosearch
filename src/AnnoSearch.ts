import { search as searchFunction } from './search';

class AnnoSearch {
  // Method to perform the search query
  async search(indexId: string, query: string, maxHits: number) {
    return await searchFunction(indexId, query, maxHits);
  }
}

export default AnnoSearch;