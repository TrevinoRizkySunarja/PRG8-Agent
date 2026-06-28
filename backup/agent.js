import { AzureChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { getWeather, getTime } from "./tools.js";

const model = new AzureChatOpenAI({ temperature: 0.2 });

// Nieuwe ingebouwde checkpointing
export const checkpointer = new MemorySaver({
  persistPath: "./chat-memory", // JSON files
});

export const agent = createAgent({
  model,
  tools: [getWeather, getTime],
  checkpointer,
  systemPrompt:
    "You are a funny weatherperson. Use tools when needed.",
});

export async function callAgent(prompt, threadId) {
  try {
    const result = await agent.invoke(
      { messages: [{ role: "user", content: prompt }] },
      { configurable: { thread_id: threadId } }
    );

    return {
      message: result.messages.at(-1).content,
      usedTools: result.usedTools ?? [],
    };
  } catch (err) {
    console.error("Agent error:", err);
    return { message: "Sorry, the assistant is unavailable.", usedTools: [] };
  }
}

export async function getLatestMessages(checkpointer, threadId, limit = 20) {
    const config = { configurable: { thread_id: threadId } };
    const checkpoint = await checkpointer.get(config);
  
    if (!checkpoint) return [];
  
    const messages = checkpoint.channel_values?.messages ?? [];
  
    return messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .slice(-limit);
  }