import axios from 'axios';

export async function search(indexId: string, query: string, maxHits: number) {
  try {
    // Log the request details
    console.log(`Sending request to Quickwit with indexId: ${indexId}, query: ${query}, and maxHits: ${maxHits}`);

    // Perform a search query
    const response = await axios.post(`http://localhost:7280/api/v1/${indexId}/search`, {
      query: query,
      max_hits: maxHits
    });

    // Log the results
    console.log(response.data);
  } catch (error: any) {
    // Handle the error
    if (error.response) {
      console.error('Quickwit query error:', error.response.data);
    } else {
      console.error('Quickwit query error:', error.message);
    }
  }
}