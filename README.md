# MikeAI

A personal AI assistant that answers questions about Mike's professional experience using an Azure AI Foundry Agent.

## Stack

- `web/`: React, Vite, and Material UI frontend.
- `api/`: Azure Static Web Apps Functions API, using Node.js 22 or newer.

## Local setup

From the repository root, install dependencies:

```sh
npm ci --prefix api
npm ci --prefix web
```

Merge the required server settings from `.env.example` into the repository-root `.env`. Keep secrets out of source control. The API loads this file for local development; Azure settings belong in server-side Static Web Apps configuration.

Run the API and frontend in separate terminals:

```sh
npm --prefix api run start
npm --prefix web run dev
```

The API listens on `http://127.0.0.1:7071`. Local API development does not require Azure Functions Core Tools or Azurite.

## Verify the local environment

Run from the repository root. Node.js should report version 22 or newer.

```sh
node --version
npm --version
npm ls --prefix api --depth=0
npm ls --prefix web --depth=0
node --check api/src/index.js
node --check api/src/devServer.js
npm --prefix web run build
```

The web build runs the TypeScript check and creates `web/dist/`.

## Check the production build

The API is deployed as JavaScript source and has no separate build script. Install its production dependencies, build the frontend, then serve the built frontend locally:

```sh
npm ci --omit=dev --prefix api
npm ci --prefix web
npm --prefix web run build
npm --prefix web run preview
```

The preview server checks the frontend build. For a full Azure Static Web Apps integration check, deploy with app location `web`, API location `api`, and output location `dist`.

## Azure configuration

Set `ACCESS_CODES`, `SESSION_SECRET`, `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_AI_AGENT_NAME`, `AZURE_AI_AGENT_VERSION`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as server-side application settings. Do not expose them as `VITE_*` variables or commit secrets.

Authentication logs include submitted access codes, so restrict log access. Login throttling is per Functions process; configure platform-level rate limiting before broad production use.

Python API documentation: [docs/operations/python-api.md](docs/operations/python-api.md).
