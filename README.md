# PRG8-Agent

Node.js AI agent project built with Express, LangChain, LangGraph memory and Azure OpenAI. The app exposes a small web server with a chat endpoint, keeps message history per thread and demonstrates tool calling through custom weather and time tools.

## Demo Status

This project is designed to run locally because it depends on private API credentials for Azure OpenAI and optional Replicate image generation. For portfolio use, a short screen recording is recommended instead of exposing a public backend with API costs.

## Features

- Express server with static frontend support from `public/`
- Chat API endpoint at `/api/chat`
- Conversation history endpoint at `/history/:threadId`
- LangChain agent setup with Azure OpenAI
- LangGraph `MemorySaver` checkpointing for thread-based memory
- Custom tool calling for weather and current time
- Optional Replicate image-generation tool file included in the project
- Environment-based configuration through `.env`

## Tech Stack

- Node.js
- Express
- LangChain
- LangGraph
- Azure OpenAI
- Replicate

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file with the required Azure OpenAI configuration for `AzureChatOpenAI`. If you use the image-generation tool, also add a Replicate API token.

Start the server:

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

## API Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/chat` | `POST` | Sends a user message to the agent |
| `/history/:threadId` | `GET` | Returns recent user and assistant messages for a thread |

Example chat request:

```json
{
  "message": "What is the weather in Rotterdam?",
  "threadId": "demo-thread"
}
```

## Project Structure

```text
agent.js          Agent, model, tools and memory setup
server.js         Express server and API routes
tools.js          Weather and time tools
tools.image.js    Replicate image-generation tool
public/           Static frontend files
```

## Portfolio Notes

This repository shows an AI agent backend with tool calling, persistent thread context and a simple HTTP API that can be connected to a frontend chat interface.