import { AzureChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { chooseToolCalls } from "./tools.js";

const SYSTEM_PROMPT = `Je bent Agent P, een vriendelijke Nederlandstalige studie-assistent.
Je helpt studenten met programmeeropdrachten. Antwoord rustig, concreet en behulpzaam.
Gebruik documentcontext wanneer die beschikbaar is. Als het antwoord niet uit de documenten komt,
zeg dan kort dat je redeneert buiten de bron. Noem bronnen onderaan als ze gebruikt zijn.`;

const memorySaver = new MemorySaver();
let langChainAgent = null;

export async function answerWithAgent({ message, history, tools }) {
  const toolCalls = chooseToolCalls(message);
  const toolResults = [];

  for (const call of toolCalls) {
    if (!tools[call.name]) continue;
    const result = await tools[call.name](call.arguments);
    toolResults.push(result);
  }

  const documentResult = toolResults.find((result) => result.name === "document_search");
  const sources = (documentResult?.results ?? [])
    .filter((item) => item.score >= 0.08)
    .slice(0, 3);

  const context = sources
    .map((source, index) => `[Bron ${index + 1}: ${source.source}, chunk ${source.chunkIndex}]\n${source.text}`)
    .join("\n\n");

  const toolSummary = toolResults
    .filter((result) => result.name !== "document_search")
    .map((result) => `${result.name}: ${result.summary}`)
    .join("\n");

  if (hasAzureConfig()) {
    try {
      const agent = getLangChainAgent(tools);
      const result = await agent.invoke(
        {
          messages: [
            ...history.slice(-8).map(({ role, content }) => ({ role, content })),
            {
              role: "user",
              content: [
                `Vraag: ${message}`,
                context ? `Al gevonden documentcontext:\n${context}` : "Er is nog geen relevante documentcontext gevonden.",
                toolSummary ? `Al uitgevoerde toolresultaten:\n${toolSummary}` : "Nog geen extra toolresultaten.",
                "Gebruik waar nodig je tools: document_search, calculator of weather.",
                "Antwoord in het Nederlands als Agent P."
              ].join("\n\n")
            }
          ]
        },
        {
          configurable: {
            thread_id: "agent-p-demo"
          }
        }
      );

      const aiAnswer = extractFinalContent(result);
      if (aiAnswer) {
        return {
          answer: aiAnswer,
          toolsUsed: [
            "LangChain createAgent actief met AzureChatOpenAI en MemorySaver.",
            ...toolResults.map((result) => result.summary)
          ],
          sources
        };
      }
    } catch (error) {
      console.error("LangChain agent fout:", error.message);
    }
  }

  return fallbackAnswer({ message, sources, toolResults });
}

function getLangChainAgent(tools) {
  if (langChainAgent) return langChainAgent;

  const model = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    temperature: 0.3
  });

  langChainAgent = createAgent({
    model,
    tools: createLangChainTools(tools),
    systemPrompt: SYSTEM_PROMPT,
    checkpointer: memorySaver
  });

  return langChainAgent;
}

function createLangChainTools(tools) {
  return [
    tool(
      async ({ query }) => {
        const result = await tools.document_search({ query });
        return JSON.stringify(result.results.map(({ source, chunkIndex, text, score }) => ({
          source,
          chunkIndex,
          score,
          text
        })));
      },
      {
        name: "document_search",
        description: "Zoekt relevante informatie in de documenten van Agent P.",
        schema: z.object({
          query: z.string().describe("De vraag of zoekterm van de gebruiker.")
        })
      }
    ),
    tool(
      async ({ expression }) => {
        const result = await tools.calculator({ expression });
        return result.summary;
      },
      {
        name: "calculator",
        description: "Rekent een veilige simpele berekening uit.",
        schema: z.object({
          expression: z.string().describe("Een simpele rekensom, bijvoorbeeld 18 * 7 + 4.")
        })
      }
    ),
    tool(
      async ({ city }) => {
        const result = await tools.weather({ city });
        return result.summary;
      },
      {
        name: "weather",
        description: "Haalt gratis actueel weer op voor een stad via Open-Meteo, zonder API-key.",
        schema: z.object({
          city: z.string().describe("De stad waarvoor het weer moet worden opgehaald.")
        })
      }
    )
  ];
}

function hasAzureConfig() {
  return Boolean(
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME &&
    process.env.AZURE_OPENAI_API_VERSION &&
    (process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_API_INSTANCE_NAME)
  );
}

function extractFinalContent(result) {
  const messages = result?.messages ?? [];
  const lastMessage = [...messages].reverse().find((item) => item?.content);
  return normalizeContent(lastMessage?.content ?? result?.output ?? "");
}

function normalizeContent(content) {
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text;
        return part?.text ?? "";
      })
      .join("")
      .trim();
  }
  return String(content || "").trim();
}

function fallbackAnswer({ message, sources, toolResults }) {
  const usefulToolResults = toolResults.filter((result) => result.name !== "document_search");
  const sourceText = sources.map((source) => source.text.replace(/^#+\s*/gm, "")).join("\n\n");
  const toolText = usefulToolResults.map((result) => result.summary).join(" ");

  if (sourceText || toolText) {
    return {
      answer: [
        "Ik heb dit gevonden:",
        sourceText ? summarize(sourceText) : "",
        toolText ? `Toolresultaat: ${toolText}` : "",
        sources.length ? "Bronnen: " + sources.map((source) => `${source.source} chunk ${source.chunkIndex}`).join(", ") : ""
      ].filter(Boolean).join("\n\n"),
      toolsUsed: toolResults.map((result) => result.summary),
      sources
    };
  }

  return {
    answer: `Ik kan dit niet direct uit de documenten halen. Mijn redenering: je vraag gaat over "${message}", dus ik zou eerst de opdrachtcriteria erbij pakken, bepalen welke tool of documentbron nodig is, en daarna pas een definitief antwoord geven.`,
    toolsUsed: toolResults.map((result) => result.summary),
    sources: []
  };
}

function summarize(text) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 5);
  return sentences.join(" ");
}
