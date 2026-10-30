# MikeAI

A personal AI assistant built to represent Mike's professional background, technical experience, career history, and communication style.

MikeAI combines large language models with structured professional knowledge and vector search to provide grounded, conversational answers about Mike’s experience.

## Overview

MikeAI is designed to:

- Answer questions about Mike’s professional background
- Compare Mike’s experience with job descriptions
- Generate interview responses using real career examples
- Explain technical experience across cloud, AI, healthcare, APIs, and architecture
- Retrieve relevant accomplishments from a vector database
- Generate professional summaries, qualifications, and project documentation
- Maintain a consistent, authentic, and professional voice

MikeAI is not intended to invent experience or exaggerate qualifications. Responses should be based on indexed professional knowledge and clearly distinguish between documented experience, transferable skills, and areas where information is unavailable.

## Core Capabilities

### Professional Experience Retrieval

MikeAI can retrieve relevant information about:

- Current and prior employment
- Job titles and responsibilities
- Technical projects
- Leadership experience
- Certifications
- Healthcare-domain experience
- Cloud and platform architecture
- AI engineering accomplishments
- Data pipelines and connected devices
- Security and compliance work

## Professional Knowledge Architecture

MikeAI uses a retrieval-augmented generation architecture.

```text
Professional Experience Data
          |
          v
   Knowledge Record Builder
          |
          v
       Embedding Model
          |
          v
     Vector Database
          |
          v
     Similarity Search
          |
          v
        LLM Prompt
          |
          v
    Grounded MikeAI Response
```
## API Documentation

See the [Python API guide](docs/operations/python-api.md) for setup and upload details. When the API is running, open /docs for the interactive API reference.

## Chatbot Web App

The chatbot web app is built to connect to an Azure AI Foundry Agent. The frontend, access-code API, and server-side Foundry invocation are implemented; an Azure endpoint, agent, and identity still need to be configured.

- **Frontend:** React, Vite, and Material UI, deployed to Azure Static Web Apps.
- **Access:** An Azure Functions API validates a shared pool of access codes configured in server-side environment variables. The app will not include an access-code management screen; the pool will be managed outside the app. Codes provide access control, not individual user identities.
- **Sessions:** A valid code opens a normal browser web session using a signed, HTTP-only cookie. Users will not need to re-enter it for each chat action. The session expires after 12 hours. Removing a code stops future sign-ins; existing sessions remain active until expiry. Rotating `SESSION_SECRET` invalidates all sessions.
- **Authentication logs:** Server logs record authentication attempts, including the submitted code. Log access should be restricted because the codes appear verbatim.
- **Conversations:** The app keeps the active transcript in page memory only and does not save chat history or create a Foundry conversation/thread. Each request sends the current transcript as Responses API `input` with the configured `agent_reference`; each new chat starts fresh. Retention for individual Foundry responses follows the Azure service settings.

### Web app structure and setup

The web app lives in `web/`; its Azure Static Web Apps Functions API lives in `api/`. The API uses the Azure AI Projects SDK and a service principal (`ClientSecretCredential`) to call the configured Foundry agent.

Requirements: Node.js 22 or newer and npm. The API's local Node host uses the same handlers as the Azure Functions deployment, so local development does not require Azure Functions Core Tools or Azurite.

1. Install dependencies with `npm install` from `web/` and `api/`.
2. Merge the server-side settings from `.env.example` into the repository-level `.env` for local development without replacing existing values. `ACCESS_CODES` is a JSON array, for example `["code-one","code-two"]`. Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
3. From the repository root (`C:\sandbox\mike-ai`), run `npm --prefix api run start` and `npm --prefix web run dev` in separate terminals. If your terminal is already inside `api/`, run `npm run start` instead; inside `web/`, run `npm run dev`.

For Azure Static Web Apps deployment, set the app location to `web`, API location to `api`, and output location to `dist`. Configure `ACCESS_CODES`, `SESSION_SECRET`, `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_AI_AGENT_NAME`, `AZURE_AI_AGENT_VERSION`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as server-side application settings. Assign the service principal the required Azure AI Foundry project/resource permissions. Do not expose these values as Vite `VITE_*` variables or commit the client secret.

The login throttle currently runs in each Functions process, so it is best-effort when the API scales across instances. Add platform-level rate limiting before broad production use.
