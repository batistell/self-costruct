import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
type Activity = { tool: string; result: unknown };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Self Construct online. Diga-me o que alterar; vou editar o GitHub e implantar o commit resultante de volta neste ambiente." },
  ]);
  const [input, setInput] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

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
          throw new Error(`HTTP ${response.status}: JSON esperado, mas foi recebido: ${raw.slice(0, 500)}`);
        }
      }

      if (!response.ok) {
        const detail = body.error ?? (raw || `A requisição do agente falhou com HTTP ${response.status}`);
        throw new Error(detail);
      }

      if (!raw.trim()) {
        throw new Error(`O agente retornou uma resposta vazia (HTTP ${response.status})`);
      }

      setActivities(body.activities ?? []);
      setMessages((current) => [...current, { role: "assistant", text: body.text || "Concluído." }]);
      if ((body.activities ?? []).some((activity: Activity) => activity.tool === "deploy_commit")) {
        setTimeout(() => setPreviewKey((value) => value + 1), 800);
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: `Erro: ${error instanceof Error ? error.message : String(error)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`shell ${isChatCollapsed ? "collapsed" : ""}`}>
      <section className="agentPane">
        <header>
          <div>
            <strong>SELF CONSTRUCT</strong>
            <span>Ambiente orientado a Git</span>
          </div>
          <div className="headerActions">
            <span className="status">● online</span>
            <button
              type="button"
              className="toggleBtn"
              onClick={() => setIsChatCollapsed(true)}
              title="Recolher menu do chat"
              aria-label="Recolher menu do chat"
            >
              ◀ Recolher
            </button>
          </div>
        </header>
        <div className="messages">
          {messages.map((message, index) => (
            <article key={index} className={message.role}>
              <b>{message.role === "user" ? "Você" : "Agente"}</b>
              <p>{message.text}</p>
            </article>
          ))}
          {busy && (
            <article className="assistant">
              <b>Agente</b>
              <p>Trabalhando no GitHub…</p>
            </article>
          )}
        </div>
        {activities.length > 0 && (
          <details className="activity">
            <summary>
              Última execução · {activities.length} chamada{activities.length === 1 ? "" : "s"} de ferramenta
            </summary>
            <pre>{JSON.stringify(activities, null, 2)}</pre>
          </details>
        )}
        <form onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Descreva o que deve ser alterado…"
            rows={3}
          />
          <button disabled={busy}>{busy ? "Executando…" : "Enviar"}</button>
        </form>
      </section>
      <section className="previewPane">
        <header>
          <div className="previewHeaderLeft">
            {isChatCollapsed && (
              <button
                type="button"
                className="toggleBtn expandChatBtn"
                onClick={() => setIsChatCollapsed(false)}
                title="Expandir menu do chat"
                aria-label="Expandir menu do chat"
              >
                💬 Abrir Chat
              </button>
            )}
            <strong>Pré-visualização ao vivo</strong>
          </div>
          <button onClick={() => setPreviewKey((value) => value + 1)}>Recarregar</button>
        </header>
        <iframe key={previewKey} src="http://127.0.0.1:5174" title="Pré-visualização do Self Construct" />
      </section>
    </main>
  );
}
