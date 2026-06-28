# Agent P

Agent P is een vriendelijke studie-assistent voor de PRG08 use case agent-opdracht. De app combineert de onderdelen uit les 5 t/m 8: agentgedrag, tool calling, server/client, chatgeschiedenis, documenten lezen en bronvermelding.

## Starten

1. Kopieer `.env.example` naar `.env`.
2. Vul je Azure OpenAI gegevens in voor echte LLM-antwoorden.
3. De weather-tool gebruikt Open-Meteo en heeft geen API-key nodig.
4. Start de app:

```powershell
npm run dev
```

Open daarna `http://localhost:3000`.

Zonder Azure OpenAI keys werkt Agent P in offline demo-modus. Dan gebruikt hij de documentzoekresultaten en eenvoudige fallback-logica. Met Azure keys gebruikt hij LangChain via `AzureChatOpenAI`, `createAgent` en `MemorySaver`.

## Wat de app doet

- Leest `.md` en `.txt` documenten uit `data/documents`.
- Splitst documenten in chunks en maakt lokale embeddings.
- Zoekt relevante chunks met cosine similarity.
- Gebruikt tools via serverfuncties:
  - `document_search` voor documentvragen.
  - `calculator` voor berekeningen.
  - `weather` voor actueel weer via Open-Meteo zonder API-key.
- Gebruikt LangChain:
  - `AzureChatOpenAI` als chatmodel wanneer Azure keys ingevuld zijn.
  - `createAgent` om het model met tools te combineren.
  - `MemorySaver` als checkpoint memory voor de agent.
- Bewaart chatgeschiedenis in `data/chat-history.json`.
- Toont in de frontend welke bronnen en tools gebruikt zijn.
- Redeneert vriendelijk verder als het document geen direct antwoord bevat.

## Screencast volgorde

1. Laat de opdrachtcriteria zien en leg uit dat Agent P documenten en tools moet combineren.
2. Open `data/documents/prg08-les-5-tot-8.md` en leg uit dat dit de kennisbron is.
3. Open `app/vectorStore.js` en leg uit: tekst splitten, lokaal embedden, cosine similarity.
4. Open `app/tools.js` en leg uit: documentzoek-tool, calculator-tool en gratis Open-Meteo weer-tool.
5. Open `app/agent.js` en leg uit: hier staan `AzureChatOpenAI`, `createAgent` en `MemorySaver`; Agent P kiest tools, geeft context aan het model en gebruikt fallback als er geen Azure key is.
6. Start `npm run dev` en open `http://localhost:3000`.
7. Stel een documentvraag, bijvoorbeeld: `Wat is RAG?`
8. Stel een toolvraag, bijvoorbeeld: `Bereken 18 * 7 + 4`.
9. Stel een vraag die niet in het document staat en wijs op de eerlijke redeneerfallback.
10. Laat de bronlabels en toollabels onder het antwoord zien.

## Voorbeeldvragen

- `Wat is tool calling volgens les 5?`
- `Hoe gebruikt Agent P documenten?`
- `Bereken 18 * 7 + 4`
- `Wat is het weer in Rotterdam?`
- `Waarom is chatgeschiedenis belangrijk?`
