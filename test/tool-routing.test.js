import test from "node:test";
import assert from "node:assert/strict";
import { chooseToolCalls, createTools } from "../app/tools.js";

test("een weervraag kiest alleen de weather-tool", () => {
  assert.deepEqual(chooseToolCalls("Wat is het weer in Rotterdam?"), [
    { name: "weather", arguments: { city: "Rotterdam" } }
  ]);
});

test("een berekening kiest alleen de calculator", () => {
  assert.deepEqual(chooseToolCalls("Bereken 18 * 7 + 4"), [
    { name: "calculator", arguments: { expression: "18 * 7 + 4" } }
  ]);
});

test("een documentvraag kiest alleen document_search", () => {
  assert.deepEqual(chooseToolCalls("Wat is RAG?"), [
    { name: "document_search", arguments: { query: "Wat is RAG?" } }
  ]);
});

test("calculator weigert een niet-eindig resultaat", async () => {
  const tools = createTools({ search: () => [] });
  const result = await tools.calculator({ expression: "1 / 0" });
  assert.equal(result.result, null);
});
