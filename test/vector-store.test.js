import test from "node:test";
import assert from "node:assert/strict";
import { VectorStore } from "../app/vectorStore.js";

test("documentzoeking laat ongerelateerde bronnen weg", () => {
  const store = new VectorStore();
  store.addDocument({
    id: "les.md",
    title: "Les",
    source: "les.md",
    text: "RAG gebruikt retrieval augmented generation met documentcontext."
  });
  store.addDocument({
    id: "restaurant.md",
    title: "Restaurant",
    source: "restaurant.md",
    text: "Dit restaurant serveert pasta en pizza."
  });

  const results = store.search("Wat is RAG?");
  assert.deepEqual(results.map((result) => result.source), ["les.md"]);
});
