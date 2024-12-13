
# Annotation Search

AnnoSearch uses [Quickwit](https://quickwit.io) as its backend database to efficiently index and query [W3C Web Annotation](https://www.w3.org/TR/annotation-model/) data. AnnoSearch can load data directly from [IIIF](https://iiif.io/) resources and web annotation servers such as [Miiify](https://github.com/nationalarchives/miiify).

## Usage

Make sure you have Quickwit installed and [running](https://quickwit.io/docs/get-started/quickstart) and then install AnnoSearch.

```bash
npm install -g annosearch
```

### Commands

#### `init`

Initialize a new index with a specified ID.

```bash
annosearch init --index <index-id>
```

#### `load`

Load an index from a URI, specifying the type of content being loaded (e.g., Manifest, Collection, or AnnotationCollection).

```bash
annosearch load --index <index-id> --type <type> --uri <uri>
```

- `type`: The type of content (Manifest, Collection, AnnotationCollection).
- `uri`: The URI to load the content from.

#### `delete`

Delete an existing index by ID.

```bash
annosearch delete --index <index-id>
```

#### `search`

Perform a search on a specified index.

```bash
annosearch search --index <index-id> --query <search-query> [--page <page-number>] [--motivation <motivation>] [--date <date-ranges>] [--user <users>]
```

- `query`: The search query string.
- `page`: Optional page number (defaults to 0).
- `motivation`: Optional space separated list of motivation terms.
- `date`: Optional space separated list of date ranges.
- `user`: Optional space separated list of URIs that are the identities of users. 

#### `serve`

Start a web server that provides a search service using the [IIIF Content Search 2.0 API](https://iiif.io/api/search/2.0/).

```bash
annosearch serve --port <port> --host <host>
```

- `port`: The port on which to run the server.
- `host`: The host on which to run the server.

#### `version`

Display the current version of AnnoSearch.

```bash
annosearch version
```


## Configuration

Configure AnnoSearch by setting the following environment variables:

- **`ANNOSEARCH_MAX_HITS`**: Maximum number of search results per query.
  - **Default**: `20`
  
- **`ANNOSEARCH_PORT`**: Port on which AnnoSearch runs.
  - **Default**: `3000`

- **`ANNOSEARCH_HOST`**: Host on which AnnoSearch runs.
  - **Default**: `localhost`

- **`ANNOSEARCH_PUBLIC_URL`**: URL for public-facing server requests.
  - **Default**: `http://localhost:3000`

Adjust these values as needed to customize AnnoSearch’s configuration and behavior.

## Todo

- Implement the autocomplete service
- Implement extended API responses


## License

This project is licensed under the MIT License.


