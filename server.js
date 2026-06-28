import express from "express";
import { callAgent, getLatestMessages, checkpointer } from "./agent.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ------------------------------
// 1. Chat history ophalen
// ------------------------------
app.get("/history/:threadId", async (req, res) => {
  const history = await getLatestMessages(checkpointer, req.params.threadId);
  res.json(history);
});

// ------------------------------
// 2. Chat endpoint
// ------------------------------
app.post("/api/chat", async (req, res) => {
  const { message, threadId } = req.body;

  const response = await callAgent(message, threadId);

  res.json(response);
});

// ------------------------------
// 3. Server starten
// ------------------------------
app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);