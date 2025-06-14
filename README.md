

# Annotation search

Annosearch uses [Quickwit](https://quickwit.io) as its backend database to efficiently index and query [W3C Web Annotation](https://www.w3.org/TR/annotation-model/) data. Annosearch can ingest data directly from [IIIF](https://iiif.io/) resources such as IIIF collections and web annotation servers such as [Miiify](https://github.com/nationalarchives/miiify) and make it available to IIIF viewers through the [IIIF Content Search 2.0 API](https://iiif.io/api/search/2.0/). Annosearch supports type-safe ingestion using the [Maniiifest](https://github.com/jptmoore/maniiifest) library. 

## Tutorial

We first need to create an index.
```
❯ annosearch init --index cookbook
Index cookbook created successfully
```
We can now load the index with the annotations referenced in a IIIF manifest.
```
❯ annosearch load --index cookbook --type Manifest --uri https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/manifest.json
Loading Manifest from https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/manifest.json into index cookbook
Data loaded successfully
```
After Quickwit finishes ingesting and indexing the data we can perform a search.
```
❯ annosearch search --index cookbook --query brunnen
{
  "@context": "http://iiif.io/api/search/2/context.json",
  "id": "http://localhost:3000/cookbook/search?q=brunnen&page=0",
  "type": "AnnotationPage",
  "startIndex": 0,
  "items": [
    {
      "body": {
        "format": "text/plain",
        "language": "de",
        "type": "TextualBody",
        "value": "Göttinger Marktplatz mit Gänseliesel Brunnen"
      },
      "id": "https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/canvas-1/annopage-2/anno-1",
      "motivation": "commenting",
      "target": {
        "id": "https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/canvas-1",
        "partOf": {
          "id": "https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/manifest.json",
          "type": "Manifest"
        }
      },
      "type": "Annotation"
    }
  ],
  "annotations": [
    {
      "type": "AnnotationPage",
      "items": [
        {
          "id": "https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/canvas-1/annopage-2/anno-1/match-1",
          "type": "Annotation",
          "motivation": "highlighting",
          "target": {
            "type": "SpecificResource",
            "source": "https://iiif.io/api/cookbook/recipe/0266-full-canvas-annotation/canvas-1/annopage-2/anno-1",
            "selector": [
              {
                "type": "TextQuoteSelector",
                "prefix": "...rktplatz mit Gänseliesel ",
                "exact": "Brunnen",
                "suffix": ""
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Usage

### Installation

Make sure you have Quickwit installed and [running](https://quickwit.io/docs/get-started/quickstart) and then install AnnoSearch.

```bash
npm install -g annosearch
```

### Deployment

Once you have created your data and are ready to deploy you can use Docker to start the service and serve the qwdata directory containing the Quickwit data.

```bash
docker compose up
```

Call the version endpoint to check the service is running.
```bash
❯ http :3000/version
HTTP/1.1 200 OK
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 19
Content-Type: application/json; charset=utf-8
Date: Wed, 11 Jun 2025 13:01:46 GMT
ETag: W/"13-iZUY2mYGnAauZNa8YzHxtZrPkFE"
Keep-Alive: timeout=5
X-Powered-By: Express

{
    "version": "0.3.6"
}
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

- `query`: A space separated list of search query terms.
- `page`: Optional page number (defaults to 0).
- `motivation`: Optional space separated list of motivation terms.
- `date`: Optional space separated list of date ranges.
- `user`: Optional space separated list of URIs that are the identities of users. 

#### `serve`

Start a web server that provides a search service using the [IIIF Content Search 2.0 API](https://iiif.io/api/search/2.0/).

```bash
annosearch serve --port <port> --host <host> --cors <cors-origin>
```

- `port`: The port on which to run the server.
- `host`: The host on which to run the server.
- `cors`: The cors origin.

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
  - **Default**: `0.0.0.0`

- **`ANNOSEARCH_PUBLIC_URL`**: URL for public-facing server requests.
  - **Default**: `http://localhost:3000`

- **`ANNOSEARCH_CORS_ORIGIN`**: Cors origin.
  - **Default**: `*`

Adjust these values as needed to customize AnnoSearch’s configuration and behavior.

## License

This project is licensed under the MIT License.


