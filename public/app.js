// -----------------------------
// 1. Unieke thread ID
// -----------------------------
let threadId = localStorage.getItem("threadId");
if (!threadId) {
  threadId = crypto.randomUUID();
  localStorage.setItem("threadId", threadId);
}

// -----------------------------
// 2. UI elementen
// -----------------------------
const form = document.querySelector("form");
const input = document.querySelector("input");
const chat = document.querySelector("#chat");

// -----------------------------
// 3. Bericht toevoegen aan UI
// -----------------------------
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
}

// -----------------------------
// 4. History ophalen
// -----------------------------
async function loadHistory() {
  try {
    const res = await fetch(`/history/${threadId}`);
    const history = await res.json();

    history.forEach((msg) => {
      addMessage(msg.role, msg.content);
    });
  } catch (err) {
    console.error("History error:", err);
  }
}

// -----------------------------
// 5. Bericht versturen
// -----------------------------
async function sendMessage(message) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threadId })
    });

    const data = await res.json();

    // AI antwoord
    addMessage("assistant", data.message);

    // Tools gebruikt?
    if (data.usedTools?.length > 0) {
      addMessage("system", `Tools used: ${data.usedTools.join(", ")}`);
    }

    // Afbeelding?
    if (data.image) {
      const img = document.createElement("img");
      img.src = data.image;
      img.className = "chat-image";
      chat.appendChild(img);
    }
  } catch (err) {
    console.error("Chat error:", err);
    addMessage("system", "Er ging iets mis met de server.");
  }
}

// -----------------------------
// 6. Form submit handler
// -----------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  input.value = "";

  addMessage("user", message);
  sendMessage(message);
});

// -----------------------------
// 7. Start: history laden
// -----------------------------
loadHistory();