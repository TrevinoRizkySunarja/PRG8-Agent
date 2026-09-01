# Agent P

Agent P is a Dutch study assistant built for the PRG08 agent assignment. It combines deterministic tool routing, document retrieval, source attribution, session-based chat history and an optional Azure OpenAI agent.

## Demo status

The project is intended to run locally because Azure OpenAI requires private credentials and may generate API costs. Without valid Azure credentials, Agent P automatically uses its offline document fallback. Weather data comes from Open-Meteo and does not require an API key.

## Features

- Routes each question to one primary tool, preventing unrelated tool output.
- Uses `document_search` for knowledge-base questions.
- Uses `calculator` for arithmetic questions.
- Uses `weather` for current weather through Open-Meteo.
- Splits Markdown and text documents into searchable chunks.
- Filters retrieval results by exact keyword overlap and vector similarity.
- Shows the tools and document sources used for each answer.
- Separates chat history and LangGraph memory by browser session.
- Falls back safely when Azure OpenAI is missing or unavailable.
- Includes responsive desktop and mobile chat interfaces.

## Tech stack

- Node.js 20+
- LangChain
- LangGraph `MemorySaver`
- Azure OpenAI
- Zod
- Open-Meteo
- HTML, CSS and JavaScript

## Getting started

1. Install dependencies:

```powershell
npm install
```

2. Copy `.env.example` to `.env` and add Azure OpenAI credentials when available.

3. Start Agent P:

```powershell
npm run dev
```

4. Open `http://localhost:3000`.

## Environment variables

```text
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_INSTANCE_NAME=
AZURE_OPENAI_API_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_ENDPOINT=
DOCUMENTS_DIR=
PORT=3000
```

Use either `AZURE_OPENAI_ENDPOINT` or `AZURE_OPENAI_API_INSTANCE_NAME` for the Azure resource configuration. Never commit the real `.env` file.

## API routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/health` | `GET` | Returns model and document-index status |
| `/api/history?sessionId=...` | `GET` | Returns history for one browser session |
| `/api/documents` | `GET` | Lists available knowledge documents |
| `/api/documents` | `POST` | Adds a Markdown knowledge document |
| `/api/chat` | `POST` | Sends a message to Agent P |

Example chat request:

```json
{
  "message": "Wat is het weer in Rotterdam?",
  "sessionId": "demo-session"
}
```

## Project structure

```text
app/                 Agent, tools, server and vector store
data/documents/      Markdown knowledge base
docs/AGENT_FLOW.md   Concise pseudocode and file map
public/              Browser interface
test/                Routing and retrieval tests
```

## Quality checks

```powershell
npm run check
npm test
```

## Example questions

- `Wat is tool calling volgens les 5?`
- `Hoe gebruikt Agent P documenten?`
- `Bereken 18 * 7 + 4`
- `Wat is het weer in Rotterdam?`
- `Waarom is chatgeschiedenis belangrijk?`

See [`docs/AGENT_FLOW.md`](docs/AGENT_FLOW.md) for the short routing and memory pseudocode.
