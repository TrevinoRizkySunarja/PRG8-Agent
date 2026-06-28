import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { answerWithAgent } from "./agent.js";
import { createTools } from "./tools.js";
import { VectorStore } from "./vectorStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

await loadEnv(path.join(root, ".env"));

const documentsDir = process.env.DOCUMENTS_DIR
  ? path.resolve(process.env.DOCUMENTS_DIR)
  : path.join(root, "data", "documents");
const historyPath = path.join(root, "data", "chat-history.json");
const port = Number(process.env.PORT || 3000);

const vectorStore = new VectorStore();
await vectorStore.loadFromDirectory(documentsDir);
const tools = createTools(vectorStore);
let chatHistory = await readJson(historyPath, []);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, {
        ok: true,
        documentsIndexed: vectorStore.size,
        documentsDir,
        model: process.env.AZURE_OPENAI_API_KEY ? "AzureChatOpenAI via LangChain" : "offline fallback"
      });
    }

    if (request.method === "GET" && url.pathname === "/api/history") {
      return sendJson(response, chatHistory.slice(-30));
    }

    if (request.method === "GET" && url.pathname === "/api/documents") {
      const files = await fs.readdir(documentsDir);
      return sendJson(response, files.filter((file) => /\.(md|txt)$/i.test(file)));
    }

    if (request.method === "POST" && url.pathname === "/api/documents") {
      const body = await readBody(request);
      const title = sanitizeFileName(body.title || "nieuw-document");
      const text = String(body.text || "").trim();
      if (!text) return sendJson(response, { error: "Documenttekst ontbreekt." }, 400);

      const fileName = `${Date.now()}-${title}.md`;
      await fs.writeFile(path.join(documentsDir, fileName), `# ${body.title || "Nieuw document"}\n\n${text}`, "utf8");
      await vectorStore.loadFromDirectory(documentsDir);
      return sendJson(response, { ok: true, fileName, documentsIndexed: vectorStore.size });
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = await readBody(request);
      const message = String(body.message || "").trim();
      if (!message) return sendJson(response, { error: "Bericht ontbreekt." }, 400);

      chatHistory.push({ role: "user", content: message, at: new Date().toISOString() });
      const result = await answerWithAgent({
        message,
        history: chatHistory,
        tools
      });
      const assistantMessage = {
        role: "assistant",
        content: result.answer,
        at: new Date().toISOString(),
        toolsUsed: result.toolsUsed,
        sources: result.sources
      };
      chatHistory.push(assistantMessage);
      await fs.writeFile(historyPath, JSON.stringify(chatHistory.slice(-80), null, 2), "utf8");
      return sendJson(response, assistantMessage);
    }

    return serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    return sendJson(response, { error: "Er ging iets mis op de server." }, 500);
  }
});

server.listen(port, () => {
  console.log(`Agent P draait op http://localhost:${port}`);
  console.log(`${vectorStore.size} documentstukken geindexeerd.`);
});

async function serveStatic(response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath));
  if (!filePath.startsWith(publicDir)) return sendText(response, "Forbidden", 403);

  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": contentType(filePath) });
    response.end(data);
  } catch {
    sendText(response, "Not found", 404);
  }
}

async function loadEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env is optional; the app can run in offline demo mode.
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function sendText(response, text, status = 200) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function sanitizeFileName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";
}
