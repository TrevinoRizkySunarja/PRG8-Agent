# Agent P flow

## Vraag routeren - `app/tools.js`

```text
ONTVANG vraag
ALS het een weervraag is: kies alleen weather
ANDERS ALS het een berekening is: kies alleen calculator
ANDERS ALS het een begroeting is: gebruik geen tool
ANDERS: kies alleen document_search
```

## Antwoord maken - `app/agent.js`

```text
VOER de gekozen tool maximaal een keer uit
GEEF weather en calculator direct terug
GEBRUIK voor documentvragen LangChain met alleen document_search
VAL terug op lokale documentresultaten als Azure niet werkt
```

## Bronnen zoeken - `app/vectorStore.js`

```text
SPLITS documenten in stukken
VERGELIJK echte zoekwoorden voordat de vectorscore meetelt
BEWAAR alleen voldoende relevante resultaten
TOON maximaal drie bronnen
```

## Chatgeheugen - `app/server.js` en `public/app.js`

```text
MAAK per browser een unieke sessie-ID
BEWAAR en laad alleen berichten van die sessie
START bij Nieuwe chat met een nieuwe sessie-ID
```
