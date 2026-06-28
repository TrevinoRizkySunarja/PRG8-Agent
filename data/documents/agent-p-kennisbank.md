# Agent P kennisbank

## Wat Agent P is
Agent P is een vriendelijke studie-assistent voor studenten die een programmeeropdracht moeten begrijpen, plannen en uitleggen. De agent helpt met vragen over de opdracht, geeft korte uitleg, maakt voorbeelden en verwijst naar bronnen uit de documenten die hij heeft gelezen.

## Doelgroep
Agent P is bedoeld voor eerste- of tweedejaars studenten Creative Media and Game Technologies die werken aan PRG08. De gebruiker wil snel weten wat er in een opdracht staat, welke onderdelen belangrijk zijn en hoe die onderdelen technisch werken.

## Documenten
Agent P leest Markdown- en tekstbestanden uit de map `data/documents`. Bij het starten van de server splitst de agent deze documenten in kleinere stukken. Elk stuk krijgt een lokale embedding op basis van woorden en wordt opgeslagen in een eenvoudige vectorstore in het geheugen.

Wanneer de gebruiker een vraag stelt, zoekt Agent P eerst in deze documentstukken. De meest relevante stukken worden aan het antwoord toegevoegd als context. In de interface laat Agent P zien welke bronnen gebruikt zijn.

## Tools
Agent P heeft meerdere tools:

1. `document_search`: zoekt relevante informatie in de ingeladen documenten.
2. `calculator`: rekent simpele sommen uit wanneer de gebruiker een berekening vraagt.
3. `weather`: haalt weersinformatie op via OpenWeather als `OPENWEATHER_API_KEY` in het `.env` bestand staat.

De toolresultaten worden zichtbaar gemaakt in de frontend, zodat de gebruiker kan uitleggen welke tools de agent heeft gebruikt.

## Gedrag en houding
Agent P praat vriendelijk, rustig en behulpzaam. De agent noemt zichzelf Agent P en gebruikt korte duidelijke antwoorden. Als informatie uit een document komt, zegt hij dat erbij. Als het document geen antwoord geeft, probeert Agent P logisch te redeneren en meldt hij eerlijk dat het antwoord niet direct uit de documenten komt.

## Fallback
Als er geen `OPENAI_API_KEY` is ingesteld, werkt Agent P nog steeds als demo. Dan gebruikt hij de gevonden documentstukken om een eenvoudig antwoord te maken. Dit is minder slim dan een taalmodel, maar handig voor testen en de screencast.

## Screencastpunten
In de screencast kan de student laten zien:

1. De frontend-chat met avatar Agent P.
2. Een vraag die vanuit het document beantwoord wordt.
3. Een vraag waarbij een tool wordt gebruikt, bijvoorbeeld een som of het weer.
4. De bronnen onder het antwoord.
5. De chatgeschiedenis.
6. De fallback of redeneerzin wanneer het document geen direct antwoord bevat.
