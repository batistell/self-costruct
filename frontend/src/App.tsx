import { FormEvent, useEffect, useRef, useState } from "react";

export type ActivityItem = {
  id: string;
  tool: string;
  args: any;
  result?: any;
  status: "running" | "success" | "error";
  description: string;
  startTime: number;
  endTime?: number;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status?: string;
  activities?: ActivityItem[];
  isLive?: boolean;
};

function getToolBadge(tool: string) {
  switch (tool) {
    case "github_write_file":
      return { label: "GitHub Commit", color: "badge-write", icon: "✍️" };
    case "github_read_file":
      return { label: "GitHub Read", color: "badge-read", icon: "📄" };
    case "github_list_files":
      return { label: "GitHub List", color: "badge-list", icon: "📂" };
    case "github_delete_file":
      return { label: "GitHub Delete", color: "badge-delete", icon: "🗑️" };
    case "deploy_commit":
      return { label: "Supervisor Deploy", color: "badge-deploy", icon: "🚀" };
    default:
      return { label: tool, color: "badge-default", icon: "⚙️" };
  }
}

function formatDuration(start: number, end?: number) {
  if (!end) return "...";
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function ActivityList({ activities, isLive }: { activities: ActivityItem[]; isLive?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activities || activities.length === 0) return null;

  const runningCount = activities.filter((a) => a.status === "running").length;
  const errorCount = activities.filter((a) => a.status === "error").length;

  return (
    <div className={`activityLogContainer ${isLive ? "is-live" : ""}`}>
      <div className="activityLogHeader" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0}>
        <div className="activityLogTitle">
          <span className="activityLogIcon">{isLive ? "⚡" : "📋"}</span>
          <strong>Log de Operações GitHub & Sistema</strong>
          <span className="activityCounter">
            {activities.length} {activities.length === 1 ? "ação" : "ações"}
          </span>
          {runningCount > 0 && <span className="badge-running-pill">Executando ({runningCount})</span>}
          {errorCount > 0 && <span className="badge-error-pill">{errorCount} erro(s)</span>}
        </div>
        <span className="activityToggleArrow">{isOpen ? "▼" : "▶"}</span>
      </div>

      {isOpen && (
        <div className="activityLogList">
          {activities.map((act) => {
            const badge = getToolBadge(act.tool);
            const isItemExpanded = expandedId === act.id;
            const sha =
              (act.result && typeof act.result === "object" && "sha" in act.result
                ? (act.result as any).sha
                : act.args?.sha) || null;

            return (
              <div key={act.id} className={`activityItem status-${act.status}`}>
                <div className="activityItemMain">
                  <div className="activityItemLeft">
                    <span className="statusIcon">
                      {act.status === "running" && <span className="spinnerIcon" />}
                      {act.status === "success" && <span className="successIcon">✓</span>}
                      {act.status === "error" && <span className="errorIcon">✕</span>}
                    </span>
                    <span className={`toolBadge ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                    <span className="activityDesc">{act.description}</span>
                  </div>

                  <div className="activityItemRight">
                    {sha && <span className="shaBadge" title={`Commit SHA: ${sha}`}>SHA: {String(sha).slice(0, 7)}</span>}
                    <span className="activityDuration">{formatDuration(act.startTime, act.endTime)}</span>
                    <button
                      type="button"
                      className="detailsBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isItemExpanded ? null : act.id);
                      }}
                    >
                      {isItemExpanded ? "Ocultar" : "Detalhes"}
                    </button>
                  </div>
                </div>

                {isItemExpanded && (
                  <div className="activityDetails">
                    {act.args && (
                      <div className="detailSection">
                        <span className="detailLabel">Argumentos enviados:</span>
                        <pre>{JSON.stringify(act.args, null, 2)}</pre>
                      </div>
                    )}
                    {act.result !== undefined && (
                      <div className="detailSection">
                        <span className="detailLabel">Resultado retornado:</span>
                        <pre>{JSON.stringify(act.result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      text: "Self Construct online. Diga-me o que alterar; vou inspecionar o repositório, editar o GitHub em tempo real e implantar o commit resultante.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const messageText = input.trim();
    if (!messageText || busy) return;

    setInput("");
    setBusy(true);

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    setMessages((current) => [
      ...current,
      { id: userMessageId, role: "user", text: messageText },
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        status: "Conectando ao agente e analisando...",
        activities: [],
        isLive: true,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message: messageText, stream: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || "Falha na comunicação"}`);
      }

      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let hasDeployed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const eventData = JSON.parse(jsonStr);

              setMessages((current) =>
                current.map((msg) => {
                  if (msg.id !== assistantMessageId) return msg;

                  if (eventData.type === "status") {
                    return { ...msg, status: eventData.message };
                  }

                  if (eventData.type === "tool_start") {
                    const currentActs = msg.activities ? [...msg.activities] : [];
                    const existingIndex = currentActs.findIndex((a) => a.id === eventData.activity.id);
                    if (existingIndex >= 0) {
                      currentActs[existingIndex] = eventData.activity;
                    } else {
                      currentActs.push(eventData.activity);
                    }
                    return {
                      ...msg,
                      status: `Executando: ${eventData.activity.description}`,
                      activities: currentActs,
                    };
                  }

                  if (eventData.type === "tool_end") {
                    const currentActs = msg.activities ? [...msg.activities] : [];
                    const existingIndex = currentActs.findIndex((a) => a.id === eventData.activity.id);
                    if (existingIndex >= 0) {
                      currentActs[existingIndex] = eventData.activity;
                    } else {
                      currentActs.push(eventData.activity);
                    }

                    if (eventData.activity.tool === "deploy_commit" && eventData.activity.status === "success") {
                      hasDeployed = true;
                    }

                    return { ...msg, activities: currentActs };
                  }

                  if (eventData.type === "done") {
                    return {
                      ...msg,
                      text: eventData.text || (msg.text ? msg.text : "Operação finalizada."),
                      activities: eventData.activities ?? msg.activities,
                      status: undefined,
                      isLive: false,
                    };
                  }

                  if (eventData.type === "error") {
                    return {
                      ...msg,
                      text: `Erro: ${eventData.message}`,
                      status: undefined,
                      isLive: false,
                    };
                  }

                  return msg;
                })
              );
            } catch (err) {
              console.warn("Erro ao processar evento SSE:", err, jsonStr);
            }
          }
        }

        if (hasDeployed) {
          setTimeout(() => setPreviewKey((value) => value + 1), 800);
        }
      } else {
        const body = await response.json();
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  text: body.text || "Concluído.",
                  activities: body.activities ?? [],
                  status: undefined,
                  isLive: false,
                }
              : msg
          )
        );

        if ((body.activities ?? []).some((act: ActivityItem) => act.tool === "deploy_commit")) {
          setTimeout(() => setPreviewKey((value) => value + 1), 800);
        }
      }
    } catch (error) {
      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: `Erro durante o processamento: ${error instanceof Error ? error.message : String(error)}`,
                status: undefined,
                isLive: false,
              }
            : msg
        )
      );
    } finally {
      setBusy(false);
    }
  }

  function handleClearChat() {
    if (busy) return;
    setMessages([
      {
        id: `init_${Date.now()}`,
        role: "assistant",
        text: "Histórico limpo. Diga-me o que gostaria de alterar no projeto.",
      },
    ]);
  }

  return (
    <main className={`shell ${isChatCollapsed ? "collapsed" : ""}`}>
      <section className="agentPane">
        <header>
          <div>
            <strong>SELF CONSTRUCT</strong>
            <span>Log & Execução em Tempo Real no GitHub</span>
          </div>
          <div className="headerActions">
            <span className="status">● online</span>
            <button
              type="button"
              className="toggleBtn iconOnly"
              onClick={handleClearChat}
              title="Limpar mensagens do chat"
              disabled={busy}
            >
              🗑️ Limpar
            </button>
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
          {messages.map((message) => (
            <article key={message.id} className={`${message.role} ${message.isLive ? "live-article" : ""}`}>
              <div className="messageHeader">
                <b>{message.role === "user" ? "👤 Você" : "🤖 Agente"}</b>
                {message.isLive && (
                  <span className="liveBadge">
                    <span className="pulseDot" /> AO VIVO
                  </span>
                )}
              </div>

              {message.isLive && message.status && (
                <div className="liveStatusBanner">
                  <span className="spinnerIcon small" />
                  <span>{message.status}</span>
                </div>
              )}

              {message.activities && message.activities.length > 0 && (
                <ActivityList activities={message.activities} isLive={message.isLive} />
              )}

              {message.text ? (
                <p className="messageText">{message.text}</p>
              ) : message.isLive ? null : (
                <p className="messageText muted">Nenhuma mensagem textual retornada.</p>
              )}
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(event);
              }
            }}
            placeholder={busy ? "Agente trabalhando no repositório..." : "Descreva o que alterar (Enter para enviar)..."}
            rows={3}
            disabled={busy}
          />
          <button disabled={busy} type="submit">
            {busy ? "Executando…" : "Enviar"}
          </button>
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
