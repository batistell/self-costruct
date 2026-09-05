import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import versionData from "./version.json";
import "./styles.css";

type Section = "dashboard" | "journey" | "diagnostic" | "clientsDiagnostic" | "goals" | "plan" | "content" | "progress" | "profile";
type Task = { id: number; title: string; category: string; due: string; done: boolean };

const VALID_SECTIONS: Section[] = [
  "dashboard",
  "journey",
  "diagnostic",
  "clientsDiagnostic",
  "goals",
  "plan",
  "content",
  "progress",
  "profile"
];

function getInitialSection(): Section {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "") as Section;
    if (VALID_SECTIONS.includes(hash)) {
      return hash;
    }
  }
  return "dashboard";
}

type ClientDiagnosticItem = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  category: "Prioritário" | "Em Tratamento" | "Preventivo" | "Concluído";
  overallScore: number;
  lastVisit: string;
  nextStep: string;
  mainIssue: string;
  metrics: {
    periodontal: number;
    restorative: number;
    aesthetic: number;
    prevention: number;
    adherence: number;
  };
};

const initialClients: ClientDiagnosticItem[] = [
  {
    id: "CLI-001",
    name: "Carolina Mendes",
    age: 34,
    avatar: "CM",
    category: "Em Tratamento",
    overallScore: 82,
    lastVisit: "02/05/2025",
    nextStep: "Moldagem para alinhador invisível",
    mainIssue: "Apinhamento moderado e profilaxia de rotina",
    metrics: { periodontal: 90, restorative: 85, aesthetic: 70, prevention: 88, adherence: 95 }
  },
  {
    id: "CLI-002",
    name: "Rodrigo Antunes",
    age: 42,
    avatar: "RA",
    category: "Prioritário",
    overallScore: 48,
    lastVisit: "28/04/2025",
    nextStep: "Raspagem subgengival quadrante 2 e 3",
    mainIssue: "Gengivite avançada com sangramento ao toque",
    metrics: { periodontal: 35, restorative: 60, aesthetic: 55, prevention: 40, adherence: 50 }
  },
  {
    id: "CLI-003",
    name: "Juliana Ferreira",
    age: 29,
    avatar: "JF",
    category: "Em Tratamento",
    overallScore: 76,
    lastVisit: "04/05/2025",
    nextStep: "Restauração em resina composta no elemento 16",
    mainIssue: "Cárie oclusal média e bruxismo noturno",
    metrics: { periodontal: 80, restorative: 65, aesthetic: 85, prevention: 75, adherence: 90 }
  },
  {
    id: "CLI-004",
    name: "Lucas Barreto",
    age: 38,
    avatar: "LB",
    category: "Preventivo",
    overallScore: 91,
    lastVisit: "15/04/2025",
    nextStep: "Check-up preventivo semestral em 6 meses",
    mainIssue: "Saúde bucal excelente, apenas manutenção",
    metrics: { periodontal: 95, restorative: 92, aesthetic: 90, prevention: 94, adherence: 98 }
  },
  {
    id: "CLI-005",
    name: "Beatriz Nogueira",
    age: 51,
    avatar: "BN",
    category: "Prioritário",
    overallScore: 54,
    lastVisit: "22/04/2025",
    nextStep: "Planejamento de implante no elemento 24",
    mainIssue: "Perda óssea localizada e ausência dental",
    metrics: { periodontal: 50, restorative: 45, aesthetic: 62, prevention: 55, adherence: 70 }
  },
  {
    id: "CLI-006",
    name: "Fernando Vasconcelos",
    age: 45,
    avatar: "FV",
    category: "Concluído",
    overallScore: 94,
    lastVisit: "03/05/2025",
    nextStep: "Retorno de acompanhamento em 90 dias",
    mainIssue: "Reabilitação oral e clareamento finalizados",
    metrics: { periodontal: 92, restorative: 96, aesthetic: 95, prevention: 92, adherence: 95 }
  }
];

const stages = [
  ["Despertar", "Reconheça seu momento"],
  ["Clareza", "Entenda onde quer chegar"],
  ["Direção", "Escolha seu caminho"],
  ["Construção", "Transforme plano em ação"],
  ["Prosperidade", "Cresça com consistência"],
] as const;

const diagnostic = [
  ["Carreira", 72], ["Financeiro", 48], ["Gestão", 61], ["Posicionamento", 38],
  ["Clínica", 84], ["Vendas", 52], ["Conhecimento técnico", 88], ["Desenvolvimento pessoal", 66],
] as const;

const defaultTasks: Task[] = [
  { id: 1, title: "Definir objetivo profissional para os próximos 24 meses", category: "Clareza", due: "Hoje", done: false },
  { id: 2, title: "Levantar custos fixos e variáveis da clínica", category: "Financeiro", due: "Amanhã", done: false },
  { id: 3, title: "Assistir aula: Quem sou eu, onde estou e para onde vou?", category: "Curso", due: "Esta semana", done: true },
  { id: 4, title: "Revisar posicionamento atual nas redes sociais", category: "Posicionamento", due: "Esta semana", done: false },
];

function ProgressBar({ value, color }: { value: number; color?: string }) {
  const barColor = color ? color : value >= 80 ? "#10b981" : value >= 60 ? "#059669" : "#eab308";
  return (
    <div className="progress">
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: barColor }} />
    </div>
  );
}

function VersionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="versionModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="versionModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="versionModalHeader">
          <div className="versionModalTitleGroup">
            <span className="versionPill">v{versionData.version}</span>
            <div>
              <h3>Informações da Versão e Commit</h3>
              <small>Build ativo e implantado em produção</small>
            </div>
          </div>
          <button className="versionCloseBtn" onClick={onClose} aria-label="Fechar modal" title="Pressione Backspace ou Esc para fechar">✕</button>
        </div>

        <div className="versionModalBody">
          <div className="versionInfoBox">
            <span className="versionLabel">MENSAGEM DO COMMIT ATUAL</span>
            <p className="commitMessageText">{versionData.commitMessage}</p>
          </div>

          <div className="versionGrid">
            <div className="versionGridItem">
              <span className="versionLabel">VERSÃO</span>
              <strong>v{versionData.version}</strong>
            </div>
            <div className="versionGridItem">
              <span className="versionLabel">STATUS</span>
              <strong className="statusActive">● {versionData.environment}</strong>
            </div>
            <div className="versionGridItem">
              <span className="versionLabel">HASH DO COMMIT</span>
              <code>{versionData.sha}</code>
            </div>
            <div className="versionGridItem">
              <span className="versionLabel">AUTOR</span>
              <strong>{versionData.author}</strong>
            </div>
          </div>

          {versionData.changelog && versionData.changelog.length > 0 && (
            <div className="changelogSection">
              <span className="versionLabel">HISTÓRICO RECENTE DE VERSÕES & COMMITS</span>
              <div className="changelogList">
                {versionData.changelog.map((item, idx) => (
                  <div key={idx} className="changelogItem">
                    <span className="changelogTag">{item.version}</span>
                    <div className="changelogContent">
                      <p>{item.message}</p>
                      <small>{item.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="versionModalFooter">
          <button className="primary" onClick={onClose}>Fechar Detalhes</button>
        </div>
      </div>
    </div>
  );
}

function ClientsDiagnosticSection({
  selectedClient,
  setSelectedClient,
  showNewModal,
  setShowNewModal,
}: {
  selectedClient: ClientDiagnosticItem | null;
  setSelectedClient: (c: ClientDiagnosticItem | null) => void;
  showNewModal: boolean;
  setShowNewModal: (open: boolean) => void;
}) {
  const [clients, setClients] = useState<ClientDiagnosticItem[]>(initialClients);
  const [filter, setFilter] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // New client form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientAge, setNewClientAge] = useState(30);
  const [newClientCategory, setNewClientCategory] = useState<"Prioritário" | "Em Tratamento" | "Preventivo" | "Concluído">("Em Tratamento");
  const [newClientScore, setNewClientScore] = useState(75);
  const [newClientIssue, setNewClientIssue] = useState("");
  const [newClientNextStep, setNewClientNextStep] = useState("");

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = filter === "Todos" || c.category === filter;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.mainIssue.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [clients, filter, searchTerm]);

  const avgScore = useMemo(() => {
    if (clients.length === 0) return 0;
    const total = clients.reduce((acc, curr) => acc + curr.overallScore, 0);
    return Math.round(total / clients.length);
  }, [clients]);

  const priorityCount = useMemo(() => {
    return clients.filter((c) => c.category === "Prioritário" || c.overallScore < 60).length;
  }, [clients]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const initials = newClientName
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const created: ClientDiagnosticItem = {
      id: `CLI-${String(clients.length + 1).padStart(3, "0")}`,
      name: newClientName,
      age: Number(newClientAge),
      avatar: initials || "PC",
      category: newClientCategory,
      overallScore: Number(newClientScore),
      lastVisit: "Hoje",
      nextStep: newClientNextStep || "Avaliação de acompanhamento",
      mainIssue: newClientIssue || "Consulta diagnóstica geral",
      metrics: {
        periodontal: Math.min(100, Math.max(20, newClientScore + Math.floor(Math.random() * 10 - 5))),
        restorative: Math.min(100, Math.max(20, newClientScore + Math.floor(Math.random() * 10 - 5))),
        aesthetic: Math.min(100, Math.max(20, newClientScore + Math.floor(Math.random() * 10 - 5))),
        prevention: Math.min(100, Math.max(20, newClientScore + Math.floor(Math.random() * 10 - 5))),
        adherence: 85,
      }
    };

    setClients([created, ...clients]);
    setShowNewModal(false);
    setNewClientName("");
    setNewClientIssue("");
    setNewClientNextStep("");
  };

  return (
    <div className="clientDiagPage">
      <div className="pageTitleRow">
        <PageTitle
          eyebrow="CENTRAL CLÍNICA DE PACIENTES"
          title="Diagnóstico dos Clientes"
          text="Acompanhe a saúde bucal, índice clínico, nível de adesão e planejamento de cada paciente."
        />
        <button className="primary addClientBtn" onClick={() => setShowNewModal(true)}>
          + Novo Diagnóstico de Cliente
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid four diagSummaryGrid">
        <div className="card clientKpiCard">
          <span className="clientKpiLabel">TOTAL DE PACIENTES</span>
          <b className="clientKpiVal">{clients.length}</b>
          <small className="clientKpiSub">Acompanhados na clínica</small>
        </div>
        <div className="card clientKpiCard">
          <span className="clientKpiLabel">ÍNDICE MÉDIO CLÍNICO</span>
          <b className="clientKpiVal gold">{avgScore}<span className="clientKpiSubUnit">/100</span></b>
          <small className="clientKpiSub">Status geral saudável</small>
        </div>
        <div className="card clientKpiCard alertCard">
          <span className="clientKpiLabel">CASOS PRIORITÁRIOS</span>
          <b className="clientKpiVal alert">{priorityCount}</b>
          <small className="clientKpiSub">Atenção requerida</small>
        </div>
        <div className="card clientKpiCard">
          <span className="clientKpiLabel">ADESÃO AO TRATAMENTO</span>
          <b className="clientKpiVal success">89%</b>
          <small className="clientKpiSub">Assiduidade geral</small>
        </div>
      </div>

      {/* Diagnostic breakdown by clinical dimensions */}
      <div className="card clinicalDimensionsCard">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">VISÃO GERAL DA CARTEIRA</span>
            <h2>Dimensões Clínicas dos Pacientes</h2>
          </div>
          <span className="dimBadge">Base: {clients.length} avaliações</span>
        </div>
        <div className="dimGrid">
          <div className="dimItem">
            <div className="dimHeader"><span>Saúde Periodontal & Gengival</span><b>76%</b></div>
            <ProgressBar value={76} />
            <small>68% dos pacientes com gengiva saudável</small>
          </div>
          <div className="dimItem">
            <div className="dimHeader"><span>Índice Restaurador / Cáries</span><b>82%</b></div>
            <ProgressBar value={82} />
            <small>82% sem lesões ativas de cárie</small>
          </div>
          <div className="dimItem">
            <div className="dimHeader"><span>Oclusão & Alinhamento Estético</span><b>71%</b></div>
            <ProgressBar value={71} />
            <small>Casos de orto e alinhadores em evolução</small>
          </div>
          <div className="dimItem">
            <div className="dimHeader"><span>Higiene & Prevenção Contínua</span><b>85%</b></div>
            <ProgressBar value={85} />
            <small>Excelente índice de manutenção preventiva</small>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clientsControlBar">
        <div className="filterPills">
          {["Todos", "Prioritário", "Em Tratamento", "Preventivo", "Concluído"].map((cat) => (
            <button
              key={cat}
              className={`filterPillBtn ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
              {cat === "Todos" && <span className="pillCount">{clients.length}</span>}
              {cat !== "Todos" && <span className="pillCount">{clients.filter((c) => c.category === cat).length}</span>}
            </button>
          ))}
        </div>
        <div className="clientSearchBox">
          <input
            type="text"
            placeholder="Buscar por nome ou diagnóstico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clearSearchBtn" onClick={() => setSearchTerm("")}>✕</button>
          )}
        </div>
      </div>

      {/* Client Diagnostic List */}
      <div className="clientsListGrid">
        {filteredClients.length === 0 ? (
          <div className="emptyClientsCard card">
            <p>Nenhum paciente encontrado com o filtro selecionado.</p>
            <button className="secondary" onClick={() => { setFilter("Todos"); setSearchTerm(""); }}>
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const badgeClass =
              client.category === "Prioritário"
                ? "badge-priority"
                : client.category === "Em Tratamento"
                ? "badge-treatment"
                : client.category === "Preventivo"
                ? "badge-preventive"
                : "badge-done";

            return (
              <div key={client.id} className="card clientDiagCard">
                <div className="clientCardHead">
                  <div className="clientAvatar">{client.avatar}</div>
                  <div className="clientMainMeta">
                    <div className="clientNameRow">
                      <h3>{client.name}</h3>
                      <span className="clientId">{client.id}</span>
                    </div>
                    <span className="clientAgeInfo">{client.age} anos · Última consulta: {client.lastVisit}</span>
                  </div>
                  <span className={`clientCategoryBadge ${badgeClass}`}>{client.category}</span>
                </div>

                <div className="clientDiagBody">
                  <div className="diagIssueBox">
                    <span className="diagLabel">DIAGNÓSTICO PRINCIPAL:</span>
                    <p>{client.mainIssue}</p>
                  </div>

                  <div className="clientScoreRow">
                    <div className="scoreCol">
                      <span className="diagLabel">PONTUAÇÃO CLÍNICA</span>
                      <div className="clientScoreDisplay">
                        <b className={client.overallScore < 60 ? "text-danger" : client.overallScore >= 80 ? "text-success" : "text-primary"}>
                          {client.overallScore}
                        </b>
                        <span>/100</span>
                      </div>
                    </div>
                    <div className="clientScoreBarCol">
                      <ProgressBar value={client.overallScore} />
                      <small className="scoreStateText">
                        {client.overallScore >= 80
                          ? "Saúde Bucal Ótima"
                          : client.overallScore >= 60
                          ? "Quadro Estável / Em Acompanhamento"
                          : "Atenção Crítica Requerida"}
                      </small>
                    </div>
                  </div>

                  <div className="diagMiniMetrics">
                    <div>
                      <span>Periodontal:</span>
                      <strong>{client.metrics.periodontal}%</strong>
                    </div>
                    <div>
                      <span>Restaurador:</span>
                      <strong>{client.metrics.restorative}%</strong>
                    </div>
                    <div>
                      <span>Estética:</span>
                      <strong>{client.metrics.aesthetic}%</strong>
                    </div>
                    <div>
                      <span>Prevenção:</span>
                      <strong>{client.metrics.prevention}%</strong>
                    </div>
                  </div>

                  <div className="nextStepBox">
                    <span className="diagLabel">PRÓXIMO PASSO:</span>
                    <strong>{client.nextStep}</strong>
                  </div>
                </div>

                <div className="clientCardFooter">
                  <button className="secondary btnSmall" onClick={() => setSelectedClient(client)}>
                    Ver Detalhes do Diagnóstico →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Client Detail Modal */}
      {selectedClient && (
        <div className="versionModalOverlay" onClick={() => setSelectedClient(null)} role="dialog" aria-modal="true">
          <div className="versionModalCard clientDetailModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="versionModalHeader">
              <div className="versionModalTitleGroup">
                <div className="clientAvatar modalAvatar">{selectedClient.avatar}</div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedClient.name}</h3>
                  <small>{selectedClient.id} · {selectedClient.age} anos · Categoria: {selectedClient.category}</small>
                </div>
              </div>
              <button className="versionCloseBtn" onClick={() => setSelectedClient(null)} aria-label="Fechar modal" title="Pressione Backspace ou Esc para fechar">✕</button>
            </div>

            <div className="versionModalBody">
              <div className="diagHeroBox">
                <div>
                  <span className="versionLabel">SCORE GERAL DO DIAGNÓSTICO</span>
                  <div className="bigScoreNumber">
                    <b>{selectedClient.overallScore}</b>
                    <span>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={selectedClient.overallScore} />
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#374151" }}>
                    {selectedClient.overallScore >= 80
                      ? "Excelente evolução. Paciente mantém adesão e plano preventivo em dia."
                      : selectedClient.overallScore >= 60
                      ? "Plano em andamento. Procedimentos restauradores e preventivos programados."
                      : "Quadro prioritário. Necessita de retorno imediato e controle periodontal."}
                  </p>
                </div>
              </div>

              <div className="versionInfoBox">
                <span className="versionLabel">QUADRO CLÍNICO & DIAGNÓSTICO</span>
                <p className="commitMessageText">{selectedClient.mainIssue}</p>
              </div>

              <div className="diagDetailMetrics">
                <span className="versionLabel">AVALIAÇÃO POR ÁREAS</span>
                <div className="diagMetricBars">
                  <div className="diagMetricBarRow">
                    <span>Saúde Periodontal & Gengiva</span>
                    <strong>{selectedClient.metrics.periodontal}/100</strong>
                    <ProgressBar value={selectedClient.metrics.periodontal} />
                  </div>
                  <div className="diagMetricBarRow">
                    <span>Estrutura Dental & Restaurações</span>
                    <strong>{selectedClient.metrics.restorative}/100</strong>
                    <ProgressBar value={selectedClient.metrics.restorative} />
                  </div>
                  <div className="diagMetricBarRow">
                    <span>Alinhamento & Estética</span>
                    <strong>{selectedClient.metrics.aesthetic}/100</strong>
                    <ProgressBar value={selectedClient.metrics.aesthetic} />
                  </div>
                  <div className="diagMetricBarRow">
                    <span>Prevenção & Higienização</span>
                    <strong>{selectedClient.metrics.prevention}/100</strong>
                    <ProgressBar value={selectedClient.metrics.prevention} />
                  </div>
                  <div className="diagMetricBarRow">
                    <span>Adesão às Consultas & Recomendações</span>
                    <strong>{selectedClient.metrics.adherence}/100</strong>
                    <ProgressBar value={selectedClient.metrics.adherence} />
                  </div>
                </div>
              </div>

              <div style={{ background: "#f9fbf9", border: "1px solid #d1e7dd", borderRadius: 12, padding: 14 }}>
                <span className="versionLabel">PLANO DE AÇÃO IMEDIATO</span>
                <strong style={{ display: "block", color: "#064e3b", fontSize: 13, marginTop: 4 }}>
                  {selectedClient.nextStep}
                </strong>
                <small style={{ color: "#6b7280", display: "block", marginTop: 4 }}>
                  Última visita registrada: {selectedClient.lastVisit}
                </small>
              </div>
            </div>

            <div className="versionModalFooter">
              <button className="secondary" onClick={() => setSelectedClient(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewModal && (
        <div className="versionModalOverlay" onClick={() => setShowNewModal(false)} role="dialog" aria-modal="true">
          <div className="versionModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="versionModalHeader">
              <div className="versionModalTitleGroup">
                <span className="versionPill">+ Novo</span>
                <div>
                  <h3 style={{ margin: 0 }}>Novo Diagnóstico de Paciente</h3>
                  <small>Cadastre um novo caso clínico na plataforma</small>
                </div>
              </div>
              <button className="versionCloseBtn" onClick={() => setShowNewModal(false)} aria-label="Fechar formulário" title="Pressione Backspace ou Esc para fechar">✕</button>
            </div>

            <form onSubmit={handleAddClient}>
              <div className="versionModalBody" style={{ gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                    Nome Completo do Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Mariana Albuquerque"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
                  />
                </div>

                <div className="grid two" style={{ gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                      Idade
                    </label>
                    <input
                      type="number"
                      value={newClientAge}
                      onChange={(e) => setNewClientAge(Number(e.target.value))}
                      min={1}
                      max={120}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                      Status / Categoria
                    </label>
                    <select
                      value={newClientCategory}
                      onChange={(e) => setNewClientCategory(e.target.value as any)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13, background: "#fff" }}
                    >
                      <option value="Em Tratamento">Em Tratamento</option>
                      <option value="Prioritário">Prioritário</option>
                      <option value="Preventivo">Preventivo</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                    Pontuação do Diagnóstico (0 - 100): <strong>{newClientScore}</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={newClientScore}
                    onChange={(e) => setNewClientScore(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#059669" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                    Diagnóstico Principal / Queixa
                  </label>
                  <input
                    type="text"
                    value={newClientIssue}
                    onChange={(e) => setNewClientIssue(e.target.value)}
                    placeholder="Ex: Sensibilidade dentinária e restauração infiltrada"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                    Próximo Passo / Conduta
                  </label>
                  <input
                    type="text"
                    value={newClientNextStep}
                    onChange={(e) => setNewClientNextStep(e.target.value)}
                    placeholder="Ex: Agendar troca de restauração e profilaxia"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
                  />
                </div>
              </div>

              <div className="versionModalFooter" style={{ gap: 10 }}>
                <button type="button" className="secondary" onClick={() => setShowNewModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  Salvar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>(getInitialSection);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDiagnosticItem | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try { return JSON.parse(localStorage.getItem("dp_tasks") || "null") || defaultTasks; } catch { return defaultTasks; }
  });

  const isAnyModalOrDrawerOpen = showVersionModal || selectedClient !== null || showNewModal || mobileMenuOpen;

  // Function to navigate between sections with full Browser History (Back & Forward) support
  const navigateTo = (newSection: Section, replace = false) => {
    setSection(newSection);
    setMobileMenuOpen(false);

    if (typeof window !== "undefined") {
      const url = `#${newSection}`;
      if (replace) {
        window.history.replaceState({ section: newSection }, "", url);
      } else if (window.location.hash !== url) {
        window.history.pushState({ section: newSection }, "", url);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Synchronize with initial URL hash
  useEffect(() => {
    const initial = getInitialSection();
    if (window.location.hash !== `#${initial}`) {
      window.history.replaceState({ section: initial }, "", `#${initial}`);
    }
  }, []);

  // Browser Popstate (Back & Forward buttons, swipe gestures) listener
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      // If a modal or drawer is open, close it first
      if (showVersionModal) setShowVersionModal(false);
      if (selectedClient !== null) setSelectedClient(null);
      if (showNewModal) setShowNewModal(false);
      if (mobileMenuOpen) setMobileMenuOpen(false);

      if (e.state && e.state.section && VALID_SECTIONS.includes(e.state.section)) {
        setSection(e.state.section);
      } else {
        const hash = window.location.hash.replace("#", "") as Section;
        if (VALID_SECTIONS.includes(hash)) {
          setSection(hash);
        } else {
          setSection("dashboard");
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showVersionModal, selectedClient, showNewModal, mobileMenuOpen]);

  // Handle Backspace and Escape keyboard events
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      if (isAnyModalOrDrawerOpen) {
        // If modal is open, Backspace or Escape closes the dialog
        if ((e.key === "Backspace" && !isTyping) || e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();

          if (showVersionModal) setShowVersionModal(false);
          else if (selectedClient !== null) setSelectedClient(null);
          else if (showNewModal) setShowNewModal(false);
          else if (mobileMenuOpen) setMobileMenuOpen(false);
        }
      } else if (e.key === "Backspace" && !isTyping) {
        // If no modal is open and user presses Backspace outside typing, navigate back
        e.preventDefault();
        window.history.back();
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isAnyModalOrDrawerOpen, showVersionModal, selectedClient, showNewModal, mobileMenuOpen]);

  const handleGoBack = () => {
    if (isAnyModalOrDrawerOpen) {
      if (showVersionModal) setShowVersionModal(false);
      if (selectedClient !== null) setSelectedClient(null);
      if (showNewModal) setShowNewModal(false);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    } else {
      window.history.back();
    }
  };

  const handleGoForward = () => {
    window.history.forward();
  };

  const completed = useMemo(() => tasks.filter(t => t.done).length, [tasks]);
  const toggle = (id: number) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(next);
    localStorage.setItem("dp_tasks", JSON.stringify(next));
  };

  const nav: [Section, string, string][] = [
    ["dashboard", "⌂", "Início"],
    ["journey", "◇", "Minha jornada"],
    ["diagnostic", "◎", "Diagnóstico Pessoal"],
    ["clientsDiagnostic", "👥", "Diagnóstico dos Clientes"],
    ["goals", "◉", "Objetivos"],
    ["plan", "✓", "Plano de ação"],
    ["content", "▤", "Conteúdos"],
    ["progress", "↗", "Progresso"],
    ["profile", "○", "Meu perfil"],
  ];

  return (
    <div className="shell">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobileDrawerBackdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop + Slide-in Mobile Drawer) */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobileOpen" : ""}`}>
        <div className="sidebarTopBar">
          <button className="brand" onClick={() => navigateTo("dashboard")}>
            <span className="brandMark">DP</span>
            <div className="brandText">
              <b>Dentista</b>
              <small>de Propósito</small>
            </div>
          </button>
          <button
            className="mobileMenuCloseBtn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav>
          <p>SUA JORNADA & CLÍNICA</p>
          {nav.slice(0, 7).map(([id, icon, label]) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => navigateTo(id)}
            >
              <i>{icon}</i>{label}
              {id === "clientsDiagnostic" && <span className="navNewBadge">Novo</span>}
            </button>
          ))}
          <p>VOCÊ</p>
          {nav.slice(7).map(([id, icon, label]) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => navigateTo(id)}
            >
              <i>{icon}</i>{label}
            </button>
          ))}
        </nav>

        <div className="stageBox">
          <span>ETAPA ATUAL</span>
          <b>Clareza</b>
          <ProgressBar value={42} />
          <small>42% concluído</small>
        </div>

        <div className="user">
          <span>M</span>
          <div>
            <b>Matheus Silva</b>
            <small>Dentista</small>
          </div>
        </div>

        {/* Sidebar Version Button */}
        <div className="sidebarFooterVersion">
          <button
            className="versionTriggerBtn"
            onClick={() => {
              setShowVersionModal(true);
              setMobileMenuOpen(false);
            }}
            title="Clique para ver os detalhes da versão e mensagem do commit"
          >
            <span className="dotActive">●</span>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.1 }}>
              <span style={{ fontWeight: 800 }}>v{versionData.version}</span>
              <span style={{ fontSize: 9, color: "#6ee7b7" }}>Ver detalhes →</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="mainHeader">
          <div className="headerLeft">
            <button
              className="mobileMenuToggleBtn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
            >
              <span className="hamburgerIcon">☰</span>
              <span className="menuLabel">Menu</span>
            </button>

            {/* In-app Back & Forward Navigation Controls */}
            <div className="historyNavGroup">
              <button
                className="historyNavBtn"
                onClick={handleGoBack}
                title="Voltar página (Back)"
                aria-label="Voltar no histórico"
              >
                ‹
              </button>
              <button
                className="historyNavBtn"
                onClick={handleGoForward}
                title="Avançar página (Forward)"
                aria-label="Avançar no histórico"
              >
                ›
              </button>
            </div>

            <div className="headerBrandGroup" onClick={() => navigateTo("dashboard")}>
              <span className="headerBrandMark">DP</span>
              <span className="headerTitle">Dentista de Propósito</span>
            </div>
          </div>

          <div className="headerActionsRow">
            <button
              className={`headerActionButton ${section === "clientsDiagnostic" ? "primaryAccent" : ""}`}
              onClick={() => navigateTo("clientsDiagnostic")}
              title="Diagnóstico dos Clientes"
            >
              <span className="headerBtnIcon">👥</span>
              <span className="headerBtnText">Clientes</span>
            </button>
            <button
              className={`headerActionButton userPillBtn ${section === "profile" ? "active" : ""}`}
              onClick={() => navigateTo("profile")}
              title="Meu Perfil"
            >
              <span className="userAvatarDot">M</span>
              <span className="headerBtnText">Matheus</span>
            </button>
          </div>
        </header>

        <div className="content">
          {section === "dashboard" && (
            <Dashboard
              setSection={navigateTo}
              tasks={tasks}
              toggle={toggle}
              completed={completed}
            />
          )}
          {section === "journey" && <Journey setSection={navigateTo} />}
          {section === "diagnostic" && <Diagnostic />}
          {section === "clientsDiagnostic" && (
            <ClientsDiagnosticSection
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              showNewModal={showNewModal}
              setShowNewModal={setShowNewModal}
            />
          )}
          {section === "goals" && <Goals setSection={navigateTo} />}
          {section === "plan" && <Plan tasks={tasks} toggle={toggle} />}
          {section === "content" && <Content />}
          {section === "progress" && <Progress completed={completed} />}
          {section === "profile" && <Profile />}
        </div>

        {/* Mobile Bottom Navigation Bar for easy one-handed access on phones */}
        <nav className="mobileBottomNav" aria-label="Navegação móvel inferior">
          <button
            className={`bottomNavItem ${section === "dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("dashboard")}
          >
            <span className="bottomNavIcon">⌂</span>
            <span className="bottomNavLabel">Início</span>
          </button>
          <button
            className={`bottomNavItem ${section === "clientsDiagnostic" ? "active" : ""}`}
            onClick={() => navigateTo("clientsDiagnostic")}
          >
            <span className="bottomNavIcon">👥</span>
            <span className="bottomNavLabel">Clientes</span>
          </button>
          <button
            className={`bottomNavItem ${section === "plan" ? "active" : ""}`}
            onClick={() => navigateTo("plan")}
          >
            <span className="bottomNavIcon">✓</span>
            <span className="bottomNavLabel">Plano</span>
          </button>
          <button
            className={`bottomNavItem ${section === "diagnostic" ? "active" : ""}`}
            onClick={() => navigateTo("diagnostic")}
          >
            <span className="bottomNavIcon">◎</span>
            <span className="bottomNavLabel">Diagnóstico</span>
          </button>
          <button
            className="bottomNavItem"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="bottomNavIcon">☰</span>
            <span className="bottomNavLabel">Mais</span>
          </button>
        </nav>
      </main>

      <VersionModal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} />
    </div>
  );
}

function Dashboard({
  setSection,
  tasks,
  toggle,
  completed,
}: {
  setSection: (s: Section) => void;
  tasks: Task[];
  toggle: (id: number) => void;
  completed: number;
}) {
  return (
    <>
      <section className="welcome">
        <div>
          <span className="eyebrow gold">SÁBADO, 5 DE SETEMBRO</span>
          <h1>Bom dia, Matheus.</h1>
          <p>Você não precisa ter todas as respostas hoje. Precisa apenas continuar avançando.</p>
        </div>
        <div className="streak">
          <span>✦</span>
          <b>7 dias</b>
          <small>de evolução contínua</small>
        </div>
      </section>

      {/* Fast shortcut to Clients Diagnostic */}
      <div className="card clientQuickCallout">
        <div className="quickCalloutLeft">
          <span className="eyebrow gold">NOVA FERRAMENTA</span>
          <h3>Diagnóstico dos Clientes / Pacientes</h3>
          <p>Avalie a saúde bucal, tratamentos e índice clínico dos seus pacientes em tempo real.</p>
        </div>
        <div className="quickCalloutRight">
          <div className="quickScorePill"><b>{initialClients.length}</b> Pacientes Ativos</div>
          <button className="primary" onClick={() => setSection("clientsDiagnostic")}>
            Acessar Diagnóstico dos Clientes →
          </button>
        </div>
      </div>

      <section className="card journeyCard">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">MÉTODO DENTISTA DE PROPÓSITO</span>
            <h2>Sua jornada</h2>
          </div>
          <button className="link" onClick={() => setSection("journey")}>
            Ver jornada completa →
          </button>
        </div>
        <div className="journeySteps">
          {stages.map(([name, sub], i) => (
            <div className={`step ${i === 0 ? "done" : i === 1 ? "current" : ""}`} key={name}>
              <span>{i === 0 ? "✓" : i + 1}</span>
              <b>{name}</b>
              <small>{sub}</small>
            </div>
          ))}
        </div>
        <div className="currentCallout">
          <div className="number">02</div>
          <div>
            <span className="eyebrow">VOCÊ ESTÁ AQUI</span>
            <h3>Clareza: transforme intenção em direção</h3>
            <p>Defina com precisão o que você deseja construir na sua carreira e na sua vida.</p>
          </div>
          <button className="primary" onClick={() => setSection("diagnostic")}>
            Continuar etapa →
          </button>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">PRÓXIMOS PASSOS</span>
              <h2>Seu plano de ação</h2>
            </div>
            <button className="link" onClick={() => setSection("plan")}>
              Ver tudo
            </button>
          </div>
          <div className="tasks">
            {tasks.map((t) => (
              <label key={t.id} className={t.done ? "done" : ""}>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                <span className="check" />
                <div>
                  <b>{t.title}</b>
                  <small>{t.category} · {t.due}</small>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">SEU MOMENTO</span>
              <h2>Diagnóstico Pessoal</h2>
            </div>
            <button className="link" onClick={() => setSection("diagnostic")}>
              Detalhes
            </button>
          </div>
          <div className="score">
            <span>
              <b>64</b>/100
            </span>
            <div>
              <b>Em desenvolvimento</b>
              <p>Seu maior potencial agora está em posicionamento e gestão.</p>
            </div>
          </div>
          <div className="miniMetrics">
            {diagnostic.slice(0, 4).map(([n, v]) => (
              <div key={n}>
                <span>
                  {n}<b>{v}</b>
                </span>
                <ProgressBar value={v} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid two lower">
        <section className="card course">
          <div className="courseArt">
            <span>GESTÃO</span>
            <b>DP</b>
          </div>
          <div>
            <span className="eyebrow">CONTINUE APRENDENDO</span>
            <h2>Gestão para Clínicas</h2>
            <p>Módulo 1 · Quem sou eu, onde estou e para onde quero ir?</p>
            <ProgressBar value={42} />
            <small>5 de 12 aulas · 42%</small>
            <button className="primary" onClick={() => setSection("content")}>
              Continuar aula →
            </button>
          </div>
        </section>

        <section className="card">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">EVOLUÇÃO</span>
              <h2>Seu progresso</h2>
            </div>
            <button className="link" onClick={() => setSection("progress")}>
              Ver relatório
            </button>
          </div>
          <div className="bigProgress">
            <b>{Math.max(31, Math.round((completed / tasks.length) * 100))}%</b>
            <span>da jornada inicial concluída</span>
          </div>
          <div className="stats">
            <div>
              <b>7</b>
              <span>dias ativos</span>
            </div>
            <div>
              <b>5</b>
              <span>aulas</span>
            </div>
            <div>
              <b>{completed}</b>
              <span>ações</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="pageTitle">
      <span className="eyebrow gold">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function Journey({ setSection }: { setSection: (s: Section) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="MÉTODO DENTISTA DE PROPÓSITO"
        title="Sua jornada profissional"
        text="Cinco etapas para transformar clareza em construção e construção em prosperidade."
      />
      <div className="journeyList">
        {stages.map(([n, s], i) => (
          <div className={`card journeyRow ${i === 1 ? "current" : ""}`} key={n}>
            <span className="journeyNo">0{i + 1}</span>
            <div>
              <span className="eyebrow">ETAPA {i + 1}</span>
              <h2>{n}</h2>
              <p>{s}. Cada etapa reúne perguntas, exercícios, conteúdos, tarefas e checkpoints.</p>
            </div>
            <b className="status">{i === 0 ? "Concluída" : i === 1 ? "Em andamento" : "Bloqueada"}</b>
            {i === 1 && (
              <button className="primary" onClick={() => setSection("diagnostic")}>
                Continuar →
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function Diagnostic() {
  return (
    <>
      <PageTitle
        eyebrow="AUTOCONHECIMENTO PROFISSIONAL"
        title="Seu diagnóstico profissional"
        text="Uma visão objetiva das áreas que mais influenciam seu momento profissional."
      />
      <div className="card diagnosticHero">
        <div className="scoreCircle">
          <b>64</b>
          <span>/100</span>
        </div>
        <div>
          <span className="eyebrow gold">RESULTADO ATUAL</span>
          <h2>Você está em desenvolvimento</h2>
          <p>Existe uma base técnica sólida. O próximo salto depende principalmente de posicionamento, gestão e organização financeira.</p>
          <button className="secondary">Refazer diagnóstico</button>
        </div>
      </div>
      <div className="grid metrics">
        {diagnostic.map(([n, v]) => (
          <div className="card metric" key={n}>
            <div>
              <b>{n}</b>
              <span>{v}/100</span>
            </div>
            <ProgressBar value={v} />
            <p>
              {v >= 80
                ? "Ponto forte — mantenha a consistência."
                : v >= 60
                ? "Boa base, com espaço claro para evolução."
                : "Área prioritária para o próximo ciclo."}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function Goals({ setSection }: { setSection: (s: Section) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="DIREÇÃO"
        title="Objetivos e metas"
        text="Transforme o que você deseja para o futuro em metas claras, mensuráveis e acompanháveis."
      />
      <div className="card goalHero">
        <span className="eyebrow gold">OBJETIVO PRINCIPAL</span>
        <h2>Abrir minha própria clínica</h2>
        <p>Construir uma operação sustentável, bem posicionada e alinhada à vida que desejo ter.</p>
        <div className="goalMeta">
          <span>Prazo <b>24 meses</b></span>
          <span>Progresso <b>26%</b></span>
          <span>Ações <b>6</b></span>
        </div>
        <ProgressBar value={26} />
        <button className="primary" onClick={() => setSection("plan")}>
          Ver plano de ação →
        </button>
      </div>
      <div className="grid two">
        <div className="card goalSmall">
          <span className="eyebrow">META FINANCEIRA</span>
          <h3>Construir reserva de segurança</h3>
          <p>Acumular 6 meses de custos fixos antes da abertura.</p>
          <ProgressBar value={44} />
          <small>44% concluído</small>
        </div>
        <div className="card goalSmall">
          <span className="eyebrow">META DE POSICIONAMENTO</span>
          <h3>Fortalecer presença profissional</h3>
          <p>Definir posicionamento, proposta de valor e linha editorial.</p>
          <ProgressBar value={18} />
          <small>18% concluído</small>
        </div>
      </div>
    </>
  );
}

function Plan({ tasks, toggle }: { tasks: Task[]; toggle: (id: number) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="EXECUÇÃO"
        title="Plano de ação"
        text="O conhecimento ganha valor quando vira movimento. Organize aqui seus próximos passos."
      />
      <div className="card">
        <div className="planSummary">
          <div>
            <b>{tasks.filter((t) => !t.done).length}</b>
            <span>ações pendentes</span>
          </div>
          <div>
            <b>{tasks.filter((t) => t.done).length}</b>
            <span>concluídas</span>
          </div>
          <div>
            <b>1</b>
            <span>prioridade hoje</span>
          </div>
        </div>
        <div className="tasks large">
          {tasks.map((t) => (
            <label key={t.id} className={t.done ? "done" : ""}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className="check" />
              <div>
                <b>{t.title}</b>
                <small>{t.category} · {t.due}</small>
              </div>
              <span className="pill">{t.category}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function Content() {
  const courses = ["Gestão para Clínicas", "Posicionamento Profissional", "Finanças para Dentistas"];
  return (
    <>
      <PageTitle
        eyebrow="DESENVOLVIMENTO"
        title="Conteúdos para o seu momento"
        text="Cursos, aulas e exercícios conectados aos desafios que você precisa resolver agora."
      />
      <div className="grid courses">
        {courses.map((c, i) => (
          <article className="card courseTile" key={c}>
            <div className={`tileArt art${i + 1}`}>
              <span>{["GESTÃO", "CARREIRA", "FINANÇAS"][i]}</span>
              <b>DP</b>
            </div>
            <div>
              <span className="eyebrow">CURSO</span>
              <h3>{c}</h3>
              <p>
                {[
                  "Estruture sua clínica para crescer com previsibilidade.",
                  "Construa uma presença coerente com seus objetivos.",
                  "Organize números, metas e decisões financeiras.",
                ][i]}
              </p>
              <ProgressBar value={[42, 18, 0][i]} />
              <small>{["5 de 12 aulas", "2 de 8 aulas", "10 aulas"][i]}</small>
              <button className="secondary">{i === 0 ? "Continuar curso" : "Ver curso"}</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Progress({ completed }: { completed: number }) {
  return (
    <>
      <PageTitle
        eyebrow="EVOLUÇÃO"
        title="Seu progresso"
        text="Acompanhe evidências reais de evolução ao longo da sua jornada."
      />
      <div className="grid progressGrid">
        <div className="card statHero">
          <b>31%</b>
          <span>Jornada inicial concluída</span>
          <ProgressBar value={31} />
        </div>
        <div className="card statHero">
          <b>64</b>
          <span>Pontuação atual do diagnóstico</span>
          <ProgressBar value={64} />
        </div>
        <div className="card statHero">
          <b>{completed}</b>
          <span>Ações concluídas</span>
        </div>
        <div className="card statHero">
          <b>5</b>
          <span>Aulas concluídas</span>
        </div>
      </div>
      <div className="card timeline">
        <span className="eyebrow">HISTÓRICO RECENTE</span>
        <h2>Seus avanços</h2>
        {[
          "Concluiu a aula 'Quem sou eu, onde estou e para onde quero ir?'",
          "Finalizou o diagnóstico profissional inicial",
          "Definiu o objetivo 'Abrir minha própria clínica'",
          "Iniciou a etapa Clareza",
        ].map((x, i) => (
          <div key={x}>
            <span>✓</span>
            <p>
              {x}
              <small>{i === 0 ? "Hoje" : i === 1 ? "2 dias atrás" : i === 2 ? "4 dias atrás" : "7 dias atrás"}</small>
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function Profile() {
  return (
    <>
      <PageTitle
        eyebrow="SEU PERFIL"
        title="Perfil profissional"
        text="As informações que ajudam a plataforma a entender seu momento e personalizar sua jornada."
      />
      <div className="card profileCard">
        <div className="profileTop">
          <span className="profileAvatar">M</span>
          <div>
            <h2>Matheus Silva</h2>
            <p>Dentista · São Paulo, SP</p>
          </div>
          <button className="secondary">Editar perfil</button>
        </div>
        <div className="profileGrid">
          <label>
            Momento profissional<strong>Dentista em fase de crescimento</strong>
          </label>
          <label>
            Tempo de formado<strong>5 anos</strong>
          </label>
          <label>
            Especialidade<strong>Clínica Geral</strong>
          </label>
          <label>
            Objetivo principal<strong>Abrir clínica própria</strong>
          </label>
          <label>
            Principal dificuldade<strong>Posicionamento e gestão</strong>
          </label>
          <label>
            Etapa atual<strong>Clareza</strong>
          </label>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
