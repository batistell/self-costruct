import "dotenv/config";
import express from "express";
import { runAgent } from "./agent.js";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing. Create a local .env file before starting Self Construct.");
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });

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

    try {
      await runAgent(message, (evt) => sendEvent(evt));
      res.end();
    } catch (error) {
      console.error("[backend/stream]", error);
      sendEvent({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      res.end();
    }
    return;
  }

  try {
    const result = await runAgent(message);
    res.json(result);
  } catch (error) {
    console.error("[backend]", error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[backend] listening on http://127.0.0.1:${port}`);
});
