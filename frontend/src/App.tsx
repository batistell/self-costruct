import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
type Activity = { tool: string; result: unknown };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Self Construct online. Tell me what to change; I will edit GitHub and deploy the resulting commit back to this runtime." },
  ]);
  const [input, setInput] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((current) => [...current, { role: "user", text: message }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const raw = await response.text();
      let body: any = {};

      if (raw.trim()) {
        try {
          body = JSON.parse(raw);
        } catch {
          throw new Error(`HTTP ${response.status}: expected JSON but received: ${raw.slice(0, 500)}`);
        }
      }

      if (!response.ok) {
        throw new Error(body.error ?? raw || `Agent request failed with HTTP ${response.status}`);
      }

      if (!raw.trim()) {
        throw new Error(`Agent returned an empty response (HTTP ${response.status})`);
      }

      setActivities(body.activities ?? []);
      setMessages((current) => [...current, { role: "assistant", text: body.text || "Done." }]);
      if ((body.activities ?? []).some((activity: Activity) => activity.tool === "deploy_commit")) {
        setTimeout(() => setPreviewKey((value) => value + 1), 800);
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: `Error: ${error instanceof Error ? error.message : String(error)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="agentPane">
        <header><div><strong>SELF CONSTRUCT</strong><span>Git-driven runtime</span></div><span className="status">● online</span></header>
        <div className="messages">
          {messages.map((message, index) => <article key={index} className={message.role}><b>{message.role === "user" ? "You" : "Agent"}</b><p>{message.text}</p></article>)}
          {busy && <article className="assistant"><b>Agent</b><p>Working on GitHub…</p></article>}
        </div>
        {activities.length > 0 && <details className="activity"><summary>Last run · {activities.length} tool calls</summary><pre>{JSON.stringify(activities, null, 2)}</pre></details>}
        <form onSubmit={submit}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Describe what should change…" rows={3} />
          <button disabled={busy}>{busy ? "Running…" : "Send"}</button>
        </form>
      </section>
      <section className="previewPane">
        <header><strong>Live Preview</strong><button onClick={() => setPreviewKey((value) => value + 1)}>Reload</button></header>
        <iframe key={previewKey} src="http://127.0.0.1:5174" title="Self Construct preview" />
      </section>
    </main>
  );
}
