

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

You can use AnnoSearch either natively with npm or via Docker containers.

### Native Installation (npm)

Make sure you have Quickwit installed and [running](https://quickwit.io/docs/get-started/quickstart) and then install AnnoSearch.

```bash
npm install -g annosearch
```

Once installed, you can use all the commands directly (see [Commands](#commands) section below).

### Docker Usage

For containerized deployments, you can use Docker instead of installing npm packages.

#### Using Docker Compose

The docker-compose.yml file supports both pulling the published image from GitHub Container Registry (GHCR) or building locally:

```bash
# Pull from GHCR (recommended for production)
docker compose pull
docker compose up

# Or build locally (for development)
docker compose build
docker compose up
```

The published image is available at `ghcr.io/annosearch/annosearch:latest`.

## Commands

The following commands work with both native npm installation and Docker. For each command, expand the "Docker example" section to see how to run it in a container.

#### `init`

Initialize a new index with a specified ID.

```bash
annosearch init --index <index-id>
```

<details>
<summary>Docker example</summary>

```bash
# Using docker-compose
docker compose run --rm annosearch init --index <index-id>

# Using standalone docker (with published image)
docker run --rm --network annosearch_default \
  -e QUICKWIT_BASE_URL=http://quickwit:7280/api/v1/ \
  -v $(pwd)/qwdata:/quickwit/qwdata \
  ghcr.io/annosearch/annosearch:latest init --index <index-id>
```

</details>

#### `load`

Load an index from a URI, specifying the type of content being loaded (e.g., Manifest, Collection, or AnnotationCollection).

```bash
annosearch load --index <index-id> --type <type> --uri <uri>
```

- `type`: The type of content (Manifest, Collection, AnnotationCollection).
- `uri`: The URI to load the content from.

<details>
<summary>Docker example</summary>

```bash
# Using docker-compose
docker compose run --rm annosearch load --index <index-id> --type <type> --uri <uri>

# Using standalone docker (with published image)
docker run --rm --network annosearch_default \
  -e QUICKWIT_BASE_URL=http://quickwit:7280/api/v1/ \
  -v $(pwd)/qwdata:/quickwit/qwdata \
  ghcr.io/annosearch/annosearch:latest load --index <index-id> --type <type> --uri <uri>
```

</details>

#### `delete`

Delete an existing index by ID.

```bash
annosearch delete --index <index-id>
```

<details>
<summary>Docker example</summary>

```bash
# Using docker-compose
docker compose run --rm annosearch delete --index <index-id>

# Using standalone docker (with published image)
docker run --rm --network annosearch_default \
  -e QUICKWIT_BASE_URL=http://quickwit:7280/api/v1/ \
  -v $(pwd)/qwdata:/quickwit/qwdata \
  ghcr.io/annosearch/annosearch:latest delete --index <index-id>
```

</details>

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

<details>
<summary>Docker example</summary>

```bash
# Using docker-compose
docker compose run --rm annosearch search --index <index-id> --query <search-query>

# Using standalone docker (with published image)
docker run --rm --network annosearch_default \
  -e QUICKWIT_BASE_URL=http://quickwit:7280/api/v1/ \
  -v $(pwd)/qwdata:/quickwit/qwdata \
  ghcr.io/annosearch/annosearch:latest search --index <index-id> --query <search-query>
```

</details> 

#### `serve`

Start a web server that provides a search service using the [IIIF Content Search 2.0 API](https://iiif.io/api/search/2.0/).

```bash
annosearch serve --port <port> --host <host> --cors <cors-origin>
```

- `port`: The port on which to run the server.
- `host`: The host on which to run the server.
- `cors`: The cors origin.

For example, if you have indexed a collection called `foobar`, you can search it via:

```bash
http://localhost:3000/foobar/search?q=baz
```

<details>
<summary>Docker example</summary>

```bash
# Using docker-compose (recommended)
docker compose up

# Using standalone docker (with published image)
docker run --rm --network annosearch_default \
  -e QUICKWIT_BASE_URL=http://quickwit:7280/api/v1/ \
  -e ANNOSEARCH_PUBLIC_URL=http://localhost:3000 \
  -p 3000:3000 \
  -v $(pwd)/qwdata:/quickwit/qwdata \
  ghcr.io/annosearch/annosearch:latest serve --port 3000 --host 0.0.0.0
```

</details>

#### `version`

Display the current version of AnnoSearch.

```bash
annosearch version
```

<details>
<summary>Docker example</summary>

```bash
docker run --rm ghcr.io/annosearch/annosearch:latest version
```

</details>


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

- **`ANNOSEARCH_SNIPPET_LENGTH`**: Length of text snippets returned in search results.
  - **Default**: `25`

Adjust these values as needed to customize AnnoSearch’s configuration and behavior.

## Compatibility

Annosearch is built using the [maniiifest parser](https://github.com/jptmoore/maniiifest). To test your manifest or collection with this parser use the following [online validator](https://maniiifest.onrender.com/).

## License

This project is licensed under the MIT License.


