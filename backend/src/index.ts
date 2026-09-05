import "dotenv/config";
import express from "express";
import { runAgent } from "./agent.js";
import { clearMessages, deleteMessage, getH2Info, getMessages, initH2Database, saveMessage, updateMessagePartial } from "./db.js";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing. Create a local .env file before starting Self Construct.");
  process.exit(1);
}

// Initialize H2 Database and load persisted messages from file
initH2Database();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Retrieve all messages stored in H2 database file
app.get("/api/messages", (_req, res) => {
  try {
    const messages = getMessages();
    const info = getH2Info();
    res.json({ messages, info });
  } catch (error) {
    console.error("[backend/messages:get]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Save / sync a message or multiple messages directly in H2
app.post("/api/messages", (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body?.messages)) {
      body.messages.forEach((m) => saveMessage(m));
      return res.json({ ok: true, count: body.messages.length });
    }
    if (body?.message) {
      const saved = saveMessage(body.message);
      return res.json({ ok: true, message: saved });
    }
    res.status(400).json({ error: "message or messages array required" });
  } catch (error) {
    console.error("[backend/messages:post]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Update a specific message by ID
app.patch("/api/messages/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    const updated = updateMessagePartial(id, { text });
    res.json({ ok: true, message: updated });
  } catch (error) {
    console.error("[backend/messages:patch]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Delete a specific message by ID
app.delete("/api/messages/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteMessage(id);
    res.json({ ok: true, deleted });
  } catch (error) {
    console.error("[backend/messages:delete:id]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Clear all messages in H2 database file
app.delete("/api/messages", (_req, res) => {
  try {
    clearMessages();
    res.json({ ok: true, message: "H2 Database messages cleared" });
  } catch (error) {
    console.error("[backend/messages:delete]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Get H2 database info & status
app.get("/api/h2/info", (_req, res) => {
  res.json(getH2Info());
});

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  const clientUserMessageId = req.body?.userMessageId || `user_${Date.now()}`;
  const clientAssistantMessageId = req.body?.assistantMessageId || `asst_${Date.now()}`;

  if (!message && files.length === 0) {
    return res.status(400).json({ error: "message or files are required" });
  }

  // Persist the user's message immediately into H2 Database
  saveMessage({
    id: clientUserMessageId,
    role: "user",
    text: message,
    attachments: files.length > 0 ? files : undefined,
    createdAt: Date.now(),
    isLive: false,
  });

  // Persist the assistant message placeholder with live processing status immediately
  saveMessage({
    id: clientAssistantMessageId,
    role: "assistant",
    text: "",
    status: "Iniciando processamento com a IA...",
    activities: [],
    createdAt: Date.now(),
    isLive: true,
  });

  const previousHistory = getMessages()
    .filter((m) => m.id !== clientUserMessageId && m.id !== clientAssistantMessageId && m.text)
    .map((m) => ({ role: m.role, text: m.text }));

  const history =
    Array.isArray(req.body?.history) && req.body.history.length > 0
      ? req.body.history
      : previousHistory;

  const wantsStream =
    req.headers.accept?.includes("text/event-stream") ||
    req.query.stream === "true" ||
    req.body?.stream === true;

  if (wantsStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendEvent = (event: unknown) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let latestActivities: any[] = [];

    try {
      await runAgent({ message, files, history }, (evt) => {
        if (evt.type === "tool_start" || evt.type === "tool_end") {
          const idx = latestActivities.findIndex((a) => a.id === evt.activity.id);
          if (idx >= 0) {
            latestActivities[idx] = evt.activity;
          } else {
            latestActivities.push(evt.activity);
          }

          // Continuously save ongoing processing activities into H2 file database
          updateMessagePartial(clientAssistantMessageId, {
            activities: [...latestActivities],
            status: evt.type === "tool_start" ? `Executando: ${evt.activity.description}` : "Processando...",
            isLive: true,
          });
        } else if (evt.type === "status") {
          updateMessagePartial(clientAssistantMessageId, {
            status: evt.message,
            activities: [...latestActivities],
            isLive: true,
          });
        } else if (evt.type === "done") {
          latestActivities = evt.activities || latestActivities;
          // Persist the completed assistant response into H2 Database
          saveMessage({
            id: clientAssistantMessageId,
            role: "assistant",
            text: evt.text || "Operação finalizada com sucesso.",
            activities: latestActivities,
            status: undefined,
            createdAt: Date.now(),
            isLive: false,
          });
        }
        sendEvent(evt);
      });
      res.end();
    } catch (error) {
      console.error("[backend/stream]", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      // Persist the error assistant response into H2 Database with all accumulated activities
      saveMessage({
        id: clientAssistantMessageId,
        role: "assistant",
        text: `Erro: ${errMsg}`,
        activities: latestActivities,
        status: undefined,
        createdAt: Date.now(),
        isLive: false,
      });
      sendEvent({
        type: "error",
        message: errMsg,
      });
      res.end();
    }
    return;
  }

  try {
    let latestActivities: any[] = [];
    const result = await runAgent({ message, files, history }, (evt) => {
      if (evt.type === "tool_start" || evt.type === "tool_end") {
        const idx = latestActivities.findIndex((a) => a.id === evt.activity.id);
        if (idx >= 0) {
          latestActivities[idx] = evt.activity;
        } else {
          latestActivities.push(evt.activity);
        }
        updateMessagePartial(clientAssistantMessageId, {
          activities: [...latestActivities],
          status: evt.type === "tool_start" ? `Executando: ${evt.activity.description}` : "Processando...",
          isLive: true,
        });
      } else if (evt.type === "status") {
        updateMessagePartial(clientAssistantMessageId, {
          status: evt.message,
          activities: [...latestActivities],
          isLive: true,
        });
      }
    });

    // Persist completed assistant response into H2 Database
    saveMessage({
      id: clientAssistantMessageId,
      role: "assistant",
      text: result.text || "Operação finalizada com sucesso.",
      activities: result.activities,
      status: undefined,
      createdAt: Date.now(),
      isLive: false,
    });
    res.json(result);
  } catch (error) {
    console.error("[backend]", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    saveMessage({
      id: clientAssistantMessageId,
      role: "assistant",
      text: `Erro: ${errMsg}`,
      activities: latestActivities,
      status: undefined,
      createdAt: Date.now(),
      isLive: false,
    });
    res.status(500).json({ error: errMsg });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[backend] listening on http://127.0.0.1:${port}`);
});
