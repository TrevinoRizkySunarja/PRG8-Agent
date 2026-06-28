const messagesEl = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const template = document.querySelector("#messageTemplate");
const statusList = document.querySelector("#statusList");
const saveDocButton = document.querySelector("#saveDocButton");
const docTitle = document.querySelector("#docTitle");
const docText = document.querySelector("#docText");
const docMessage = document.querySelector("#docMessage");

await loadStatus();
await loadHistory();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  addMessage({ role: "user", content: message });
  addMessage({ role: "assistant", content: "Ik denk even mee...", pending: true });

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  messagesEl.querySelector("[data-pending='true']")?.remove();
  addMessage(data);
});

saveDocButton.addEventListener("click", async () => {
  docMessage.textContent = "Opslaan...";
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: docTitle.value,
      text: docText.value
    })
  });
  const data = await response.json();
  docMessage.textContent = data.ok
    ? `Opgeslagen als ${data.fileName}.`
    : (data.error || "Opslaan mislukt.");
  if (data.ok) {
    docTitle.value = "";
    docText.value = "";
    await loadStatus();
  }
});

async function loadStatus() {
  const response = await fetch("/api/health");
  const data = await response.json();
  statusList.innerHTML = `
    <div><dt>Model</dt><dd>${escapeHtml(data.model)}</dd></div>
    <div><dt>Documentstukken</dt><dd>${data.documentsIndexed}</dd></div>
  `;
}

async function loadHistory() {
  const response = await fetch("/api/history");
  const history = await response.json();
  messagesEl.innerHTML = "";
  if (!history.length) {
    addMessage({
      role: "assistant",
      content: "Hoi, ik ben Agent P. Stel een vraag over de documenten, laat mij iets uitrekenen, of vraag welke bronnen ik gebruik."
    });
    return;
  }
  history.forEach(addMessage);
}

function addMessage(message) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.classList.add(message.role || "assistant");
  if (message.pending) node.dataset.pending = "true";

  node.querySelector(".bubble").textContent = message.content || message.error || "";
  const meta = node.querySelector(".meta");

  for (const tool of message.toolsUsed || []) {
    meta.append(createPill(`tool: ${tool}`));
  }

  for (const source of message.sources || []) {
    meta.append(createPill(`bron: ${source.source} #${source.chunkIndex}`));
  }

  if (!meta.childElementCount) meta.remove();
  messagesEl.append(node);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function createPill(text) {
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = text;
  return pill;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
