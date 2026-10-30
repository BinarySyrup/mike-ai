# Repository Guidelines

## Project Structure & Modules

This directory is the Azure Static Web Apps Functions API. `src/index.js` registers the Functions handlers; `src/handlers/` contains auth and chat routes; `src/services/foundryAgent.js` calls Azure AI Foundry. Shared auth, HTTP response, and rate-limit helpers live in `src/`. `src/devServer.js` provides the local Node host. `host.json` configures the Functions host. The sibling `../web/` contains the React frontend; API assets and tests are not currently present.

## Build, Test, and Development

Use Node.js 22 or newer. From this directory:

```sh
npm ci
npm run start
```

`npm run start` serves the local API at `http://127.0.0.1:7071` and reads local settings from the repository-root `.env`. Check JavaScript syntax with `node --check src/index.js` and `node --check src/devServer.js`. There is no separate API build command; from the repository root, `npm --prefix web run build` type-checks and builds the frontend into `web/dist/`.

## Coding Style & Naming

Follow the existing CommonJS style: two-space indentation, double quotes, semicolons, and `camelCase` for variables and functions. Keep route-specific behavior in `src/handlers/`, shared helpers in `src/`, and Foundry integration in `src/services/`. No formatter or linter is configured; match nearby code.

## Testing Guidelines

No API test framework or `npm test` script is configured. Syntax checks are useful for quick validation but do not replace behavior tests. If adding tests, use `tests/*.test.js` and add a repeatable npm test script.

## Commits & Pull Requests

Recent history includes Conventional Commit prefixes such as `feat:` and `fix:`. Prefer `type: concise imperative summary`, for example `fix: reject expired sessions`. Pull requests should describe behavior changes, configuration impact, and verification performed. Include screenshots for frontend changes and call out deployment or security implications.

## Security & Configuration

Merge required local values from the repository `.env.example` into the repository-root `.env`; never commit secrets or expose server settings through `VITE_*` variables. Keep credentials and access codes out of logs. Existing authentication logs include submitted access codes, so access to production logs must be restricted. Azure settings belong in server-side Static Web Apps configuration.
