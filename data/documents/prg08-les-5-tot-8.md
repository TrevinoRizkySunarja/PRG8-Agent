# PRG08 lessen 5 tot en met 8

## Les 5: Agents en tool calling
In les 5 gaat het over agents. Een agent is een AI-systeem dat niet alleen tekst teruggeeft, maar ook kan beslissen om tools te gebruiken. Tool calling betekent dat het model een functie of API kan aanroepen wanneer dat nodig is. Een voorbeeld is een weer-tool, image-tool of documentzoek-tool.

## Les 6: Agent applicatie
In les 6 wordt de agent verwerkt in een applicatie met server en client. De server ontvangt berichten van de gebruiker, bewaart chat history en stuurt de vraag naar de agent. De client toont de chat in de browser. Chat history is belangrijk omdat de agent eerdere berichten kan meenemen.

## Les 7: Documenten lezen
In les 7 leert de agent eigen documenten lezen. Het document wordt opgesplitst in chunks. Daarna worden de chunks omgezet naar embeddings en opgeslagen in een vector database. Bij een vraag zoekt de agent relevante stukken tekst op. Dit heet retrieval augmented generation, vaak afgekort als RAG.

## Les 8: Chatbot afronden
In les 8 worden tools en documenten gecombineerd. De agent kan informatie zoeken in documenten, tools gebruiken en het antwoord tonen in de frontend. Ook kan de applicatie worden klaargemaakt om live te zetten. Voor een goede eindversie is het nuttig dat de gebruiker kan zien welke bron of tool gebruikt is.
