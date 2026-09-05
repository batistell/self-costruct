import { ClipboardEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";

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

export type AttachedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 Data URL
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: AttachedFile[];
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string, filename: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("json") || /\.(json|ya?ml)$/i.test(filename)) return "⚙️";
  if (/\.(ts|tsx|js|jsx|html|css|scss|py|rs|go|c|cpp|java|php|sql|sh)$/i.test(filename)) return "💻";
  if (mimeType.startsWith("text/") || /\.(txt|md|log|csv)$/i.test(filename)) return "📄";
  return "📁";
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

function AttachmentPreviewList({
  attachments,
  onRemove,
  onClearAll,
}: {
  attachments: AttachedFile[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="attachmentQueueContainer">
      <div className="attachmentQueueHeader">
        <span>
          📎 Arquivos anexados ({attachments.length})
        </span>
        {attachments.length > 1 && (
          <button type="button" className="clearAttachmentsBtn" onClick={onClearAll}>
            Remover todos
          </button>
        )}
      </div>
      <div className="attachmentQueueList">
        {attachments.map((file) => (
          <div key={file.id} className="attachmentQueueItem" title={file.name}>
            {file.type.startsWith("image/") ? (
              <img src={file.data} alt={file.name} className="attachmentQueueThumb" />
            ) : (
              <span className="attachmentQueueIcon">{getFileIcon(file.type, file.name)}</span>
            )}
            <div className="attachmentQueueMeta">
              <span className="attachmentQueueName">{file.name}</span>
              <span className="attachmentQueueSize">{formatFileSize(file.size)}</span>
            </div>
            <button
              type="button"
              className="attachmentRemoveBtn"
              onClick={() => onRemove(file.id)}
              aria-label={`Remover ${file.name}`}
              title="Remover anexo"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageAttachmentsView({ attachments }: { attachments: AttachedFile[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="messageAttachmentsContainer">
      {attachments.map((file) => (
        <div key={file.id} className={`messageAttachmentCard ${file.type.startsWith("image/") ? "is-image" : ""}`}>
          {file.type.startsWith("image/") ? (
            <a href={file.data} target="_blank" rel="noopener noreferrer" className="imageAttachmentLink">
              <img src={file.data} alt={file.name} className="messageAttachmentImage" />
              <div className="imageOverlay">
                <span className="imageOverlayName">{file.name}</span>
                <span className="imageOverlaySize">{formatFileSize(file.size)}</span>
              </div>
            </a>
          ) : (
            <div className="docAttachmentChip">
              <span className="docIcon">{getFileIcon(file.type, file.name)}</span>
              <div className="docInfo">
                <span className="docName" title={file.name}>
                  {file.name}
                </span>
                <span className="docSize">{formatFileSize(file.size)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      text: "Self Construct online. Diga-me o que alterar ou anexe arquivos e imagens; vou inspecionar o repositório, editar o GitHub em tempo real e implantar o commit resultante.",
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, attachments]);

  const processFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    filesArray.forEach((file) => {
      // 20MB limit per file check
      if (file.size > 20 * 1024 * 1024) {
        alert(`O arquivo "${file.name}" excede o limite recomendado de 20MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const newAttachment: AttachedFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            data: result,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      // Reset input value to allow uploading the same file again if desired
      e.target.value = "";
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const messageText = input.trim();
    const currentAttachments = [...attachments];

    if ((!messageText && currentAttachments.length === 0) || busy) return;

    setInput("");
    setAttachments([]);
    setBusy(true);

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        text: messageText,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      },
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
        body: JSON.stringify({
          message: messageText,
          files: currentAttachments,
          stream: true,
        }),
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
        text: "Histórico limpo. Diga-me o que gostaria de alterar no projeto ou envie arquivos/imagens.",
      },
    ]);
  }

  return (
    <main
      className={`shell ${isChatCollapsed ? "collapsed" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <section className={`agentPane ${isDragOver ? "drag-active" : ""}`}>
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

              {message.attachments && message.attachments.length > 0 && (
                <MessageAttachmentsView attachments={message.attachments} />
              )}

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

        {isDragOver && (
          <div className="dragDropOverlay">
            <div className="dragDropCard">
              <span className="dragIcon">📥</span>
              <strong>Solte os arquivos aqui</strong>
              <span>Eles serão anexados para análise</span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="chatForm">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            style={{ display: "none" }}
            aria-hidden="true"
          />

          <AttachmentPreviewList
            attachments={attachments}
            onRemove={removeAttachment}
            onClearAll={() => setAttachments([])}
          />

          <div className="inputRow">
            <button
              type="button"
              className="attachButton"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              title="Anexar arquivos ou imagens"
              aria-label="Anexar arquivos"
            >
              📎
            </button>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onPaste={handlePaste}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(event);
                }
              }}
              placeholder={
                busy
                  ? "Agente trabalhando no repositório..."
                  : attachments.length > 0
                  ? "Descreva o que fazer com os anexos (Enter para enviar)..."
                  : "Descreva o que alterar ou cole imagens/arquivos (Enter para enviar)..."
              }
              rows={attachments.length > 0 ? 2 : 3}
              disabled={busy}
            />

            <button
              className="sendBtn"
              disabled={busy || (!input.trim() && attachments.length === 0)}
              type="submit"
            >
              {busy ? "Executando…" : "Enviar"}
            </button>
          </div>
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
