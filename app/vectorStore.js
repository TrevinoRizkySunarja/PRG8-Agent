import fs from "node:fs/promises";
import path from "node:path";

const VECTOR_SIZE = 384;
const STOP_WORDS = new Set([
  "de", "het", "een", "en", "of", "in", "op", "van", "voor", "met", "dat",
  "die", "dit", "is", "zijn", "te", "je", "ik", "we", "ze", "er", "als",
  "aan", "bij", "om", "wat", "welke", "hoe", "waarom", "the", "a", "an",
  "to", "and", "for", "of", "with", "on", "in"
]);

export class VectorStore {
  constructor() {
    this.documents = [];
  }

  async loadFromDirectory(directory) {
    await fs.mkdir(directory, { recursive: true });
    const files = await fs.readdir(directory);
    this.documents = [];

    for (const file of files) {
      if (!/\.(md|txt)$/i.test(file)) continue;
      const filePath = path.join(directory, file);
      const text = await fs.readFile(filePath, "utf8");
      this.addDocument({
        id: file,
        title: titleFromText(text, file),
        source: file,
        text
      });
    }
  }

  addDocument({ id, title, source, text }) {
    const chunks = chunkText(text);
    chunks.forEach((chunk, index) => {
      this.documents.push({
        id: `${id}#${index + 1}`,
        title,
        source,
        chunkIndex: index + 1,
        text: chunk,
        vector: embed(chunk)
      });
    });
  }

  search(query, limit = 4) {
    const queryVector = embed(query);
    return this.documents
      .map((doc) => ({
        ...doc,
        score: cosineSimilarity(queryVector, doc.vector)
      }))
      .filter((doc) => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ vector, ...doc }) => doc);
  }

  get size() {
    return this.documents.length;
  }
}

function titleFromText(text, fallback) {
  const firstHeading = text.split(/\r?\n/).find((line) => line.trim().startsWith("#"));
  return firstHeading ? firstHeading.replace(/^#+\s*/, "").trim() : fallback;
}

function chunkText(text, maxWords = 130, overlap = 25) {
  const sections = text
    .replace(/\r\n/g, "\n")
    .split(/\n(?=##?\s)/)
    .map((section) => section.trim())
    .filter(Boolean);

  const chunks = [];
  for (const section of sections) {
    const words = section.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      chunks.push(section);
      continue;
    }

    for (let start = 0; start < words.length; start += maxWords - overlap) {
      chunks.push(words.slice(start, start + maxWords).join(" "));
    }
  }
  return chunks;
}

function embed(text) {
  const vector = new Array(VECTOR_SIZE).fill(0);
  for (const token of tokenize(text)) {
    const index = hashToken(token) % VECTOR_SIZE;
    vector[index] += 1;
  }

  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2 && !STOP_WORDS.has(token)) ?? [];
}

function hashToken(token) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cosineSimilarity(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}
