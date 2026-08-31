import { AzureChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { chooseToolCalls } from "./tools.js";

const SYSTEM_PROMPT = `Je bent Agent P, een vriendelijke Nederlandstalige studie-assistent.
Je helpt studenten met programmeeropdrachten. Antwoord rustig, concreet en behulpzaam.
Gebruik document_search precies een keer voordat je een inhoudelijke vraag beantwoordt.
Gebruik alleen relevante informatie uit het toolresultaat. Als de documenten geen antwoord geven,
zeg dat dan eerlijk en verzin geen bron. Noem gebruikte bronnen kort onderaan.`;

const memorySaver = new MemorySaver();
let langChainAgent = null;
let azureUnavailableReason = "";

export async function answerWithAgent({ message, tools, sessionId }) {
  const toolCalls = chooseToolCalls(message);

  if (!toolCalls.length) {
    return {
      answer: "Hoi! Ik ben Agent P. Waar kan ik je mee helpen?",
      toolsUsed: [],
      sources: []
    };
  }

  const [call] = toolCalls;
  if (call.name !== "document_search") {
    const result = await runTool(tools, call);
    return {
      answer: result.summary,
      toolsUsed: [result.name],
      sources: []
    };
  }

  if (hasAzureConfig() && !azureUnavailableReason) {
    try {
      const agent = getLangChainAgent(tools);
      const result = await agent.invoke(
        {
          messages: [{ role: "user", content: message }]
        },
        {
          configurable: {
            thread_id: sessionId
          }
        }
      );

      const aiAnswer = extractFinalContent(result);
      const sources = extractSources(result);
      if (aiAnswer) {
        return {
          answer: aiAnswer,
          toolsUsed: ["document_search"],
          sources
        };
      }
    } catch (error) {
      if (isConfigurationError(error)) azureUnavailableReason = error.message;
      console.error("LangChain agent fout:", error.message);
    }
  }

  const documentResult = await runTool(tools, call);
  const sources = (documentResult.results ?? []).slice(0, 3);
  return fallbackAnswer({ message, sources });
}

function getLangChainAgent(tools) {
  if (langChainAgent) return langChainAgent;

  const model = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    temperature: 0.2,
    maxRetries: 0,
    timeout: 15000
  });

  langChainAgent = createAgent({
    model,
    tools: [createDocumentSearchTool(tools)],
    systemPrompt: SYSTEM_PROMPT,
    checkpointer: memorySaver
  });

  return langChainAgent;
}

function createDocumentSearchTool(tools) {
  return tool(
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
        query: z.string().describe("De volledige vraag van de gebruiker.")
      })
    }
  );
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
  const lastMessage = [...messages].reverse().find((item) => messageType(item) === "ai" && item?.content);
  return normalizeContent(lastMessage?.content ?? result?.output ?? "");
}

function extractSources(result) {
  const messages = result?.messages ?? [];
  const lastUserIndex = messages.findLastIndex((item) => messageType(item) === "human");
  const toolMessage = messages.slice(lastUserIndex + 1)
    .find((item) => messageType(item) === "tool" && item.name === "document_search");
  try {
    return JSON.parse(normalizeContent(toolMessage?.content)).slice(0, 3);
  } catch {
    return [];
  }
}

function messageType(message) {
  return message?._getType?.() || message?.type || message?.role || "";
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

function fallbackAnswer({ message, sources }) {
  const sourceText = sources.map((source) => source.text.replace(/^#+\s*/gm, "")).join("\n\n");

  if (sourceText) {
    return {
      answer: [
        "Ik heb dit in de documenten gevonden:",
        summarize(sourceText),
        "Bronnen: " + sources.map((source) => `${source.source} chunk ${source.chunkIndex}`).join(", ")
      ].filter(Boolean).join("\n\n"),
      toolsUsed: ["document_search"],
      sources
    };
  }

  return {
    answer: `Ik kan geen relevant antwoord op "${message}" in de ingeladen documenten vinden. Voeg een passende bron toe of stel de vraag specifieker.`,
    toolsUsed: ["document_search"],
    sources: []
  };
}

async function runTool(tools, call) {
  const selectedTool = tools[call.name];
  if (!selectedTool) throw new Error(`Onbekende tool: ${call.name}`);
  try {
    return await selectedTool(call.arguments);
  } catch (error) {
    return {
      name: call.name,
      summary: `De ${call.name}-tool is tijdelijk niet beschikbaar: ${error.message}`,
      result: null,
      results: []
    };
  }
}

function isConfigurationError(error) {
  return /401|403|authentication|subscription key|api key|endpoint/i.test(error?.message || "");
}

export function getAgentStatus() {
  if (!hasAzureConfig()) return "offline fallback";
  if (azureUnavailableReason) return "Azure geconfigureerd, maar niet beschikbaar";
  return "AzureChatOpenAI via LangChain";
}

function summarize(text) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 5);
  return sentences.join(" ");
}
