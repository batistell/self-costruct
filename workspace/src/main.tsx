import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import versionData from "./version.json";
import "./styles.css";

type Section =
  | "dashboard"
  | "journey"
  | "diagnostic"
  | "clientsDiagnostic"
  | "hotmart"
  | "goals"
  | "plan"
  | "content"
  | "progress"
  | "profile";

type Task = { id: number; title: string; category: string; due: string; done: boolean };

const VALID_SECTIONS: Section[] = [
  "dashboard",
  "journey",
  "diagnostic",
  "clientsDiagnostic",
  "hotmart",
  "goals",
  "plan",
  "content",
  "progress",
  "profile",
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

type ComorbidityRisk = "Nenhum" | "Baixo" | "Moderado" | "Alto";

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
  comorbidityCode: string;
  comorbidityName: string;
  comorbidityRisk: ComorbidityRisk;
  metrics: {
    periodontal: number;
    restorative: number;
    aesthetic: number;
    prevention: number;
    adherence: number;
  };
};

export type HotmartLesson = {
  id: string;
  title: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  duration: string;
  description: string;
  videoUrl: string; // Direct stream or embed
  thumbnailText: string;
  completed: boolean;
  notes?: string;
  attachments?: { name: string; size: string; type: string }[];
};

const initialHotmartLessons: HotmartLesson[] = [
  {
    id: "hotmart-101",
    title: "Aula 1.1: Diagnóstico Integrado e Avaliação de Comorbidades (CID-10)",
    moduleTitle: "Módulo 1: Fundamentos Clínicos & Diagnóstico de Alta Precisão",
    moduleIndex: 1,
    lessonIndex: 1,
    duration: "18:42",
    description:
      "Aprenda a correlacionar comorbidades sistêmicas (Hipertensão I10, Diabetes E11.9, Bruxismo G47.63) com o plano de tratamento odontológico para aumentar a segurança clínica e o valor percebido pelo paciente.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailText: "DIAGNÓSTICO CID-10",
    completed: true,
    attachments: [
      { name: "Guia_Pratico_Comorbidades_CID10_Odonto.pdf", size: "2.4 MB", type: "PDF" },
      { name: "Checklist_Anamnese_Estrategica.pdf", size: "1.1 MB", type: "PDF" }
    ]
  },
  {
    id: "hotmart-102",
    title: "Aula 1.2: Precificação Consciente e Apresentação de Planos de Tratamento",
    moduleTitle: "Módulo 1: Fundamentos Clínicos & Diagnóstico de Alta Precisão",
    moduleIndex: 1,
    lessonIndex: 2,
    duration: "24:15",
    description:
      "Como sair da guerra de preços e apresentar o planejamento clínico demonstrando investimento em saúde e longevidade do sorriso com alta taxa de fechamento.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailText: "PLANOS DE TRATAMENTO",
    completed: true,
    attachments: [
      { name: "Planilha_Calculo_Hora_Clinica_DP.xlsx", size: "850 KB", type: "XLSX" }
    ]
  },
  {
    id: "hotmart-201",
    title: "Aula 2.1: Gestão de Fluxo de Atendimento e Experiência do Paciente",
    moduleTitle: "Módulo 2: Gestão de Consultório & Experiência de Alto Nível",
    moduleIndex: 2,
    lessonIndex: 1,
    duration: "29:50",
    description:
      "Construção da jornada do paciente desde o primeiro contato no WhatsApp até o pós-consulta, reduzindo faltas e cancelamentos para menos de 5%.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailText: "EXPERIÊNCIA DO PACIENTE",
    completed: false,
    attachments: [
      { name: "Scripts_Atendimento_Recepcao.pdf", size: "1.8 MB", type: "PDF" }
    ]
  },
  {
    id: "hotmart-202",
    title: "Aula 2.2: Retenção e Protocolos de Check-up Preventivo Semestral",
    moduleTitle: "Módulo 2: Gestão de Consultório & Experiência de Alto Nível",
    moduleIndex: 2,
    lessonIndex: 2,
    duration: "21:30",
    description:
      "Como estruturar um programa de prevenção contínua que gera receita previsível e mantém a saúde bucal da sua carteira em níveis de excelência.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailText: "RETENÇÃO PREVENTIVA",
    completed: false,
    attachments: [
      { name: "Modelo_Contrato_Manutencao_Preventiva.docx", size: "320 KB", type: "DOCX" }
    ]
  },
  {
    id: "hotmart-301",
    title: "Aula 3.1: Posicionamento Digital & Atração de Pacientes Ideais",
    moduleTitle: "Módulo 3: Posicionamento, Autoridade & Crescimento",
    moduleIndex: 3,
    lessonIndex: 1,
    duration: "34:10",
    description:
      "Estratégias éticas de marketing odontológico para gerar autoridade no Instagram, Google e indicações qualificadas sem depender de dancinhas.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailText: "POSICIONAMENTO DIGITAL",
    completed: false,
    attachments: [
      { name: "Manual_Linha_Editorial_Odonto.pdf", size: "3.2 MB", type: "PDF" }
    ]
  },
  {
    id: "hotmart-302",
    title: "Aula 3.2: Fechamento de Casos Reabilitadores e Ortodônticos",
    moduleTitle: "Módulo 3: Posicionamento, Autoridade & Crescimento",
    moduleIndex: 3,
    lessonIndex: 2,
    duration: "27:45",
    description:
      "Técnicas de comunicação assertiva para casos complexos: do diagnóstico visual em fotos ao fechamento com clareza e transparência.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    thumbnailText: "FECHAMENTO DE CASOS",
    completed: false,
  }
];

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
    comorbidityCode: "CID-10: Z00.0",
    comorbidityName: "Sem comorbidades sistêmicas (Paciente hígida)",
    comorbidityRisk: "Nenhum",
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
    comorbidityCode: "CID-10: I10 / F17.2",
    comorbidityName: "Hipertensão Arterial & Tabagismo Crônico (Risco Periodontal aumentado)",
    comorbidityRisk: "Alto",
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
    comorbidityCode: "CID-10: G47.63 / F41.1",
    comorbidityName: "Bruxismo do Sono & Ansiedade Generalizada (Uso de placa miorrelaxante)",
    comorbidityRisk: "Moderado",
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
    comorbidityCode: "CID-10: Z00.0",
    comorbidityName: "Nenhuma comorbidade sistêmica registrada (Hígido)",
    comorbidityRisk: "Nenhum",
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
    comorbidityCode: "CID-10: E11.9 / M81.0",
    comorbidityName: "Diabetes Mellitus Tipo 2 & Osteoporose (Controle glicêmico pré-cirúrgico)",
    comorbidityRisk: "Alto",
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
    comorbidityCode: "CID-10: I10",
    comorbidityName: "Hipertensão Sistêmica Leve Controlada",
    comorbidityRisk: "Baixo",
    metrics: { periodontal: 92, restorative: 96, aesthetic: 95, prevention: 92, adherence: 95 }
  }
];

const COMORBIDITY_PRESETS = [
  { name: "Sem comorbidades sistêmicas (Hígido)", code: "CID-10: Z00.0", risk: "Nenhum" as ComorbidityRisk },
  { name: "Hipertensão Arterial Sistêmica", code: "CID-10: I10", risk: "Moderado" as ComorbidityRisk },
  { name: "Diabetes Mellitus Tipo 2", code: "CID-10: E11.9", risk: "Alto" as ComorbidityRisk },
  { name: "Diabetes Mellitus Tipo 1", code: "CID-10: E10.9", risk: "Alto" as ComorbidityRisk },
  { name: "Bruxismo do Sono / DTM", code: "CID-10: G47.63", risk: "Moderado" as ComorbidityRisk },
  { name: "Tabagismo Crônico", code: "CID-10: F17.2", risk: "Alto" as ComorbidityRisk },
  { name: "Cardiopatia Isquêmica / Valvar", code: "CID-10: I25.1", risk: "Alto" as ComorbidityRisk },
  { name: "Osteoporose", code: "CID-10: M81.0", risk: "Moderado" as ComorbidityRisk },
  { name: "Asma Brônquica", code: "CID-10: J45", risk: "Baixo" as ComorbidityRisk },
  { name: "Coagulopatia / Uso de Anticoagulante", code: "CID-10: D68.9", risk: "Alto" as ComorbidityRisk },
  { name: "Outra condição personalizada", code: "CID-10: Outro", risk: "Moderado" as ComorbidityRisk },
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
  { id: 1, title: "Assistir Aula 1.1 do Hotmart: Diagnóstico Integrado e CID-10", category: "Hotmart", due: "Hoje", done: true },
  { id: 2, title: "Definir objetivo profissional para os próximos 24 meses", category: "Clareza", due: "Hoje", done: false },
  { id: 3, title: "Levantar custos fixos e variáveis da clínica com a planilha Hotmart", category: "Financeiro", due: "Amanhã", done: false },
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

/* =========================================================================
   HOTMART INTEGRATION SECTION & VIDEO PLAYER COMPONENT
   ========================================================================= */
function HotmartSection({
  lessons,
  setLessons,
  onOpenAddModal,
  onOpenSettingsModal,
}: {
  lessons: HotmartLesson[];
  setLessons: React.Dispatch<React.SetStateAction<HotmartLesson[]>>;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
}) {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => lessons[0]?.id || "");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [userNote, setUserNote] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "materials">("overview");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (currentLesson) {
      setUserNote(currentLesson.notes || "");
    }
  }, [currentLesson]);

  const toggleLessonComplete = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, completed: !l.completed } : l))
    );
  };

  const saveNotes = () => {
    setLessons((prev) =>
      prev.map((l) => (l.id === selectedLessonId ? { ...l, notes: userNote } : l))
    );
    alert("Anotações da aula salvas com sucesso!");
  };

  const completedCount = useMemo(() => lessons.filter((l) => l.completed).length, [lessons]);
  const progressPercent = useMemo(
    () => (lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0),
    [completedCount, lessons.length]
  );

  const filteredLessons = useMemo(() => {
    if (!searchFilter.trim()) return lessons;
    const q = searchFilter.toLowerCase();
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.moduleTitle.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }, [lessons, searchFilter]);

  // Group lessons by module
  const modules = useMemo(() => {
    const map = new Map<string, HotmartLesson[]>();
    filteredLessons.forEach((l) => {
      const arr = map.get(l.moduleTitle) || [];
      arr.push(l);
      map.set(l.moduleTitle, arr);
    });
    return Array.from(map.entries()).map(([moduleTitle, items]) => ({
      moduleTitle,
      items,
    }));
  }, [filteredLessons]);

  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      setSelectedLessonId(lessons[currentIndex + 1].id);
    }
  };

  const handlePrevLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);
    if (currentIndex > 0) {
      setSelectedLessonId(lessons[currentIndex - 1].id);
    }
  };

  return (
    <div className="hotmartPage">
      {/* Header Banner & Hotmart Status */}
      <div className="hotmartHeaderBanner card">
        <div className="hotmartHeaderLeft">
          <div className="hotmartBadgeGroup">
            <span className="hotmartFireBadge">🔥 HOTMART CLUB INTEGRADO</span>
            <span className="hotmartSyncPill">● Sincronizado</span>
          </div>
          <h2>Vídeos & Aulas do Hotmart Club</h2>
          <p>
            Assista aos módulos completos do treinamento <strong>Dentista de Propósito</strong> diretamente no site, com sincronização de progresso e materiais de apoio.
          </p>
        </div>

        <div className="hotmartHeaderRight">
          <div className="hotmartProgressCard">
            <div className="hotmartProgressHead">
              <span>Seu Progresso Hotmart</span>
              <b>{progressPercent}%</b>
            </div>
            <ProgressBar value={progressPercent} />
            <small>{completedCount} de {lessons.length} aulas concluídas</small>
          </div>

          <div className="hotmartActionBtns">
            <button className="secondary" onClick={onOpenSettingsModal} title="Configurações e Token Hotmart">
              ⚙️ Conexão Hotmart
            </button>
            <button className="primary" onClick={onOpenAddModal}>
              + Adicionar Link Hotmart
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Theater Layout */}
      <div className="hotmartTheaterGrid">
        {/* Left / Main Player Area */}
        <div className="hotmartPlayerCol">
          <div className="card hotmartPlayerCard">
            {/* HTML5 / Embed Responsive Video Container */}
            <div className="videoWrapper">
              {currentLesson ? (
                currentLesson.videoUrl.includes("youtube.com") ||
                currentLesson.videoUrl.includes("vimeo.com") ||
                currentLesson.videoUrl.includes("hotmart.com/embed") ? (
                  <iframe
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="videoFrame"
                  />
                ) : (
                  <video
                    key={currentLesson.videoUrl}
                    controls
                    autoPlay={false}
                    className="videoElement"
                    playbackRate={playbackSpeed}
                    poster="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Seu navegador não suporta a reprodução de vídeo direto.
                  </video>
                )
              ) : (
                <div className="noVideoPlaceholder">Nenhum vídeo selecionado</div>
              )}
            </div>

            {/* Video Controls and Meta */}
            <div className="videoMetaBar">
              <div className="videoTitleRow">
                <div>
                  <span className="moduleTag">{currentLesson?.moduleTitle}</span>
                  <h3 className="videoLessonTitle">{currentLesson?.title}</h3>
                </div>
                <div className="videoActionButtons">
                  <button
                    className={`markDoneBtn ${currentLesson?.completed ? "isDone" : ""}`}
                    onClick={() => currentLesson && toggleLessonComplete(currentLesson.id)}
                  >
                    {currentLesson?.completed ? "✓ Concluída no Hotmart" : "Marcar como Concluída"}
                  </button>
                </div>
              </div>

              {/* Navigation between lessons bar */}
              <div className="videoControlsRow">
                <div className="lessonNavigationBtns">
                  <button className="secondary btnSmall" onClick={handlePrevLesson}>
                    ‹ Aula Anterior
                  </button>
                  <button className="primary btnSmall" onClick={handleNextLesson}>
                    Próxima Aula ›
                  </button>
                </div>

                <div className="speedSelector">
                  <span className="speedLabel">Velocidade:</span>
                  {[1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      className={`speedBtn ${playbackSpeed === s ? "active" : ""}`}
                      onClick={() => setPlaybackSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs for Overview, Notes, and Attachments */}
            <div className="lessonTabHeader">
              <button
                className={`lessonTabBtn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                📋 Descrição & Resumo
              </button>
              <button
                className={`lessonTabBtn ${activeTab === "materials" ? "active" : ""}`}
                onClick={() => setActiveTab("materials")}
              >
                📎 Materiais de Apoio ({(currentLesson?.attachments || []).length})
              </button>
              <button
                className={`lessonTabBtn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                📝 Minhas Anotações
              </button>
            </div>

            <div className="lessonTabBody">
              {activeTab === "overview" && (
                <div className="overviewTabContent">
                  <p className="lessonDescText">{currentLesson?.description}</p>
                  <div className="lessonHighlightsBox">
                    <strong>💡 Principais Pontos Desta Aula:</strong>
                    <ul>
                      <li>Alinhamento da conduta odontológica com os códigos CID-10 informados na anamnese.</li>
                      <li>Comunicação empática e sem termos técnicos excessivos que aumentam o fechamento.</li>
                      <li>Rastreabilidade das metas clínicas e planejamento preventivo do paciente.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "materials" && (
                <div className="materialsTabContent">
                  {currentLesson?.attachments && currentLesson.attachments.length > 0 ? (
                    <div className="attachmentsList">
                      {currentLesson.attachments.map((att, idx) => (
                        <div key={idx} className="attachmentItemCard">
                          <div className="attachmentItemIcon">
                            {att.type === "PDF" ? "📕" : att.type === "XLSX" ? "📊" : "📄"}
                          </div>
                          <div className="attachmentItemInfo">
                            <b>{att.name}</b>
                            <small>{att.size} · Arquivo do Hotmart Club</small>
                          </div>
                          <button
                            className="secondary btnSmall downloadBtn"
                            onClick={() => alert(`Iniciando download seguro de: ${att.name}`)}
                          >
                            ⬇ Baixar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="emptyMaterialsText">Esta aula não possui arquivos extras para download.</p>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="notesTabContent">
                  <p className="notesHelpText">
                    Escreva aqui suas ideias, insights clínicos e anotações enquanto assiste:
                  </p>
                  <textarea
                    className="notesTextarea"
                    rows={5}
                    placeholder="Ex: Aplicar a tabela de comorbidades CID-10 na anamnese de amanhã com o paciente Rodrigo..."
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button className="primary btnSmall" onClick={saveNotes}>
                      Salvar Minhas Anotações
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right / Playlist Sidebar Area */}
        <div className="hotmartPlaylistCol">
          <div className="card hotmartPlaylistCard">
            <div className="playlistHeader">
              <div className="playlistTitleRow">
                <h3>Conteúdo do Curso</h3>
                <span className="lessonCountBadge">{lessons.length} aulas</span>
              </div>
              <div className="playlistSearch">
                <input
                  type="text"
                  placeholder="Pesquisar aulas ou temas..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                {searchFilter && (
                  <button className="clearSearchBtn" onClick={() => setSearchFilter("")}>✕</button>
                )}
              </div>
            </div>

            <div className="playlistModulesList">
              {modules.map((mod, modIdx) => (
                <div key={modIdx} className="playlistModuleGroup">
                  <div className="playlistModuleHead">
                    <span>{mod.moduleTitle}</span>
                  </div>
                  <div className="playlistItems">
                    {mod.items.map((lesson) => {
                      const isSelected = lesson.id === currentLesson?.id;
                      return (
                        <div
                          key={lesson.id}
                          className={`playlistLessonItem ${isSelected ? "selected" : ""} ${lesson.completed ? "completed" : ""}`}
                          onClick={() => setSelectedLessonId(lesson.id)}
                        >
                          <div className="lessonItemCheck" onClick={(e) => {
                            e.stopPropagation();
                            toggleLessonComplete(lesson.id);
                          }}>
                            {lesson.completed ? "✓" : "○"}
                          </div>
                          <div className="lessonItemInfo">
                            <span className="lessonItemTitle">{lesson.title}</span>
                            <div className="lessonItemMeta">
                              <span className="lessonDuration">⏱ {lesson.duration}</span>
                              {lesson.attachments && lesson.attachments.length > 0 && (
                                <span className="lessonHasAttachment">📎 {lesson.attachments.length} anexo(s)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Modal to Add Custom Hotmart Video / URL */
function AddHotmartVideoModal({
  isOpen,
  onClose,
  onAddLesson,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddLesson: (lesson: HotmartLesson) => void;
}) {
  const [title, setTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("Módulo 1: Fundamentos Clínicos & Diagnóstico de Alta Precisão");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("20:00");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    const newLesson: HotmartLesson = {
      id: `hotmart-${Date.now()}`,
      title,
      moduleTitle,
      moduleIndex: 1,
      lessonIndex: 99,
      duration: duration || "15:00",
      description: description || "Vídeo adicionado via link da plataforma Hotmart.",
      videoUrl,
      thumbnailText: "HOTMART",
      completed: false,
    };

    onAddLesson(newLesson);
    onClose();
    setTitle("");
    setVideoUrl("");
    setDescription("");
  };

  return (
    <div className="versionModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="versionModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="versionModalHeader">
          <div className="versionModalTitleGroup">
            <span className="hotmartFireBadge">🔥 HOTMART</span>
            <div>
              <h3 style={{ margin: 0 }}>Adicionar Vídeo ou Aula do Hotmart</h3>
              <small>Integre uma nova aula ou vídeo da sua área de membros</small>
            </div>
          </div>
          <button className="versionCloseBtn" onClick={onClose} aria-label="Fechar" title="Pressione Esc para fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="versionModalBody" style={{ gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                Título da Aula / Vídeo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aula 4.1: Manejo Clínico de Pacientes Hipertensos"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                Módulo do Curso
              </label>
              <select
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13, background: "#fff" }}
              >
                <option value="Módulo 1: Fundamentos Clínicos & Diagnóstico de Alta Precisão">Módulo 1: Fundamentos Clínicos & Diagnóstico de Alta Precisão</option>
                <option value="Módulo 2: Gestão de Consultório & Experiência de Alto Nível">Módulo 2: Gestão de Consultório & Experiência de Alto Nível</option>
                <option value="Módulo 3: Posicionamento, Autoridade & Crescimento">Módulo 3: Posicionamento, Autoridade & Crescimento</option>
                <option value="Módulo 4: Casos Práticos & Protocolos Odontológicos">Módulo 4: Casos Práticos & Protocolos Odontológicos</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                Link do Vídeo ou Embed do Hotmart / Stream *
              </label>
              <input
                type="text"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... (Hotmart embed, MP4 stream, Vimeo ou YouTube)"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
              />
              <small style={{ fontSize: 11, color: "#047857", marginTop: 4, display: "block" }}>
                💡 Você pode colar links diretos do Hotmart Club Player, URLs de streaming ou embeds de vídeo.
              </small>
            </div>

            <div className="grid two" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                  Duração Estimada
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 22:30"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
                Descrição & Objetivos da Aula
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resumo dos tópicos ensinados nesta aula..."
                rows={3}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
              />
            </div>
          </div>

          <div className="versionModalFooter" style={{ gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary">Salvar e Assistir</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Modal for Hotmart Connection Settings */
function HotmartSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [clubDomain, setClubDomain] = useState("dentistadeproposito.club.hotmart.com");
  const [hottok, setHottok] = useState("htk_9982348a8f82194c7b640192e");
  const [autoSync, setAutoSync] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="versionModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="versionModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="versionModalHeader">
          <div className="versionModalTitleGroup">
            <span className="hotmartFireBadge">⚙️ INTEGRAÇÃO</span>
            <div>
              <h3 style={{ margin: 0 }}>Configurações do Hotmart Club</h3>
              <small>Credenciais de API, Webhooks e Sincronização</small>
            </div>
          </div>
          <button className="versionCloseBtn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="versionModalBody" style={{ gap: 14 }}>
          <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <strong style={{ color: "#065f46", fontSize: 13 }}>Status da Conexão: Ativo & Conectado</strong>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#047857" }}>
              Sua conta do Hotmart Club está autenticada. As aulas e o progresso estão sendo sincronizados automaticamente.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
              Domínio da Área de Membros (Hotmart Club)
            </label>
            <input
              type="text"
              value={clubDomain}
              onChange={(e) => setClubDomain(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 5 }}>
              Token de Autenticação Hotmart (Hottok)
            </label>
            <input
              type="password"
              value={hottok}
              onChange={(e) => setHottok(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbe4da", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="autoSyncCheck"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              style={{ accentColor: "#059669", width: 16, height: 16 }}
            />
            <label htmlFor="autoSyncCheck" style={{ fontSize: 12.5, color: "#1f2937", cursor: "pointer" }}>
              Sincronizar progresso de aulas concluídas em segundo plano
            </label>
          </div>
        </div>

        <div className="versionModalFooter" style={{ gap: 10 }}>
          <button className="primary" onClick={onClose}>Salvar e Fechar</button>
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
  const [newClientComorbidityPreset, setNewClientComorbidityPreset] = useState("Hipertensão Arterial Sistêmica");
  const [newClientComorbidityName, setNewClientComorbidityName] = useState("Hipertensão Arterial Sistêmica");
  const [newClientComorbidityCode, setNewClientComorbidityCode] = useState("CID-10: I10");
  const [newClientComorbidityRisk, setNewClientComorbidityRisk] = useState<ComorbidityRisk>("Moderado");

  const handleComorbidityPresetChange = (presetName: string) => {
    setNewClientComorbidityPreset(presetName);
    const found = COMORBIDITY_PRESETS.find((p) => p.name === presetName);
    if (found) {
      setNewClientComorbidityName(found.name);
      setNewClientComorbidityCode(found.code);
      setNewClientComorbidityRisk(found.risk);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = filter === "Todos" || c.category === filter;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.mainIssue.toLowerCase().includes(q) ||
        c.comorbidityCode.toLowerCase().includes(q) ||
        c.comorbidityName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [clients, filter, searchTerm]);

  const avgScore = useMemo(() => {
    if (clients.length === 0) return 0;
    const total = clients.reduce((acc, curr) => acc + curr.overallScore, 0);
    return Math.round(total / clients.length);
  }, [clients]);

  const priorityCount = useMemo(() => {
    return clients.filter((c) => c.category === "Prioritário" || c.overallScore < 60 || c.comorbidityRisk === "Alto").length;
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
      comorbidityCode: newClientComorbidityCode || "CID-10: Z00.0",
      comorbidityName: newClientComorbidityName || "Sem comorbidades registradas",
      comorbidityRisk: newClientComorbidityRisk,
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
    setNewClientComorbidityName("Hipertensão Arterial Sistêmica");
    setNewClientComorbidityCode("CID-10: I10");
  };

  return (
    <div className="clientDiagPage">
      <div className="pageTitleRow">
        <PageTitle
          eyebrow="CENTRAL CLÍNICA DE PACIENTES"
          title="Diagnóstico dos Clientes"
          text="Acompanhe a saúde bucal, índice clínico, códigos de comorbidade (CID-10) e planejamento de cada paciente."
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
          <span className="clientKpiLabel">ALERTA / ALTO RISCO</span>
          <b className="clientKpiVal alert">{priorityCount}</b>
          <small className="clientKpiSub">Casos prioritários & comorbidades</small>
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
            placeholder="Buscar por nome, CID, comorbidade..."
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
                    <span className="clientAgeInfo">{client.age} anos ·配合 Última consulta: {client.lastVisit}</span>
                  </div>
                  <span className={`clientCategoryBadge ${badgeClass}`}>{client.category}</span>
                </div>

                <div className="clientDiagBody">
                  {/* Comorbidity & CID Code Badge */}
                  <div className="diagComorbidityBox">
                    <div className="comorbidityHead">
                      <span className="diagLabel">COMORBIDADE & CÓDIGO CLÍNICO:</span>
                      <span className={`riskBadge risk-${client.comorbidityRisk.toLowerCase()}`}>
                        {client.comorbidityRisk === "Nenhum" ? "Hígido / Sem Risco" : `Risco ${client.comorbidityRisk}`}
                      </span>
                    </div>
                    <div className="comorbidityCodeRow">
                      <code className="cidCodeBadge">{client.comorbidityCode}</code>
                      <span className="comorbidityText">{client.comorbidityName}</span>
                    </div>
                  </div>

                  <div className="diagIssueBox">
                    <span className="diagLabel">DIAGNÓSTICO ODONTOLÓGICO:</span>
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

              {/* Comorbidity & CID Details */}
              <div className="diagComorbidityDetailBox">
                <div className="comorbidityDetailHead">
                  <span className="versionLabel">COMORBIDADE SISTÊMICA & CÓDIGO CID</span>
                  <span className={`riskBadge risk-${selectedClient.comorbidityRisk.toLowerCase()}`}>
                    {selectedClient.comorbidityRisk === "Nenhum" ? "Hígido / Sem Risco" : `Grau de Risco: ${selectedClient.comorbidityRisk}`}
                  </span>
                </div>
                <div className="comorbidityDetailMain">
                  <code className="cidCodeBadge big">{selectedClient.comorbidityCode}</code>
                  <strong className="comorbidityDetailTitle">{selectedClient.comorbidityName}</strong>
                </div>
                <small className="comorbidityClinicalNote">
                  ℹ️ Alerta Clínico Odontológico: Considere este diagnóstico sistêmico ao prescrever medicamentos, anestésicos com vasoconstritores e ao planejar intervenções cirúrgicas ou periodontais.
                </small>
              </div>

              <div className="versionInfoBox">
                <span className="versionLabel">QUADRO CLÍNICO & DIAGNÓSTICO ODONTOLÓGICO</span>
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
                  <small>Cadastre um novo caso clínico e código de comorbidade</small>
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

                {/* Comorbidity & CID Fields */}
                <div style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, padding: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#065f46", display: "block", marginBottom: 6 }}>
                    🏥 COMORBIDADE SISTÊMICA & CÓDIGO CID-10
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 3 }}>
                        Selecionar Modelo Pré-definido:
                      </span>
                      <select
                        value={newClientComorbidityPreset}
                        onChange={(e) => handleComorbidityPresetChange(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #a7f3d0", fontSize: 12, background: "#fff" }}
                      >
                        {COMORBIDITY_PRESETS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid two" style={{ gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 3 }}>
                          Código CID-10:
                        </span>
                        <input
                          type="text"
                          value={newClientComorbidityCode}
                          onChange={(e) => setNewClientComorbidityCode(e.target.value)}
                          placeholder="Ex: CID-10: I10"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #a7f3d0", fontSize: 12, background: "#fff", fontWeight: 700, color: "#047857" }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 3 }}>
                          Grau de Risco Sistêmico:
                        </span>
                        <select
                          value={newClientComorbidityRisk}
                          onChange={(e) => setNewClientComorbidityRisk(e.target.value as ComorbidityRisk)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #a7f3d0", fontSize: 12, background: "#fff" }}
                        >
                          <option value="Nenhum">Nenhum (Hígido)</option>
                          <option value="Baixo">Baixo Risco</option>
                          <option value="Moderado">Risco Moderado</option>
                          <option value="Alto">Alto Risco</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#134e4a", display: "block", marginBottom: 3 }}>
                        Descrição da Comorbidade / Condição:
                      </span>
                      <input
                        type="text"
                        value={newClientComorbidityName}
                        onChange={(e) => setNewClientComorbidityName(e.target.value)}
                        placeholder="Ex: Hipertensão Arterial Sistêmica controlada"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #a7f3d0", fontSize: 12, background: "#fff" }}
                      />
                    </div>
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
                    Diagnóstico Odontológico Principal / Queixa
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
  const [showAddHotmartModal, setShowAddHotmartModal] = useState<boolean>(false);
  const [showHotmartSettingsModal, setShowHotmartSettingsModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hotmart Lessons State
  const [hotmartLessons, setHotmartLessons] = useState<HotmartLesson[]>(() => {
    try {
      const saved = localStorage.getItem("dp_hotmart_lessons");
      return saved ? JSON.parse(saved) : initialHotmartLessons;
    } catch {
      return initialHotmartLessons;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dp_hotmart_lessons", JSON.stringify(hotmartLessons));
    } catch {}
  }, [hotmartLessons]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try { return JSON.parse(localStorage.getItem("dp_tasks") || "null") || defaultTasks; } catch { return defaultTasks; }
  });

  const isAnyModalOrDrawerOpen =
    showVersionModal ||
    selectedClient !== null ||
    showNewModal ||
    showAddHotmartModal ||
    showHotmartSettingsModal ||
    mobileMenuOpen;

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
      if (showAddHotmartModal) setShowAddHotmartModal(false);
      if (showHotmartSettingsModal) setShowHotmartSettingsModal(false);
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
  }, [showVersionModal, selectedClient, showNewModal, showAddHotmartModal, showHotmartSettingsModal, mobileMenuOpen]);

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
          else if (showAddHotmartModal) setShowAddHotmartModal(false);
          else if (showHotmartSettingsModal) setShowHotmartSettingsModal(false);
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
  }, [
    isAnyModalOrDrawerOpen,
    showVersionModal,
    selectedClient,
    showNewModal,
    showAddHotmartModal,
    showHotmartSettingsModal,
    mobileMenuOpen,
  ]);

  const handleGoBack = () => {
    if (isAnyModalOrDrawerOpen) {
      if (showVersionModal) setShowVersionModal(false);
      if (selectedClient !== null) setSelectedClient(null);
      if (showNewModal) setShowNewModal(false);
      if (showAddHotmartModal) setShowAddHotmartModal(false);
      if (showHotmartSettingsModal) setShowHotmartSettingsModal(false);
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

  const nav: [Section, string, string, string?][] = [
    ["dashboard", "⌂", "Início"],
    ["hotmart", "🔥", "Vídeos Hotmart", "Hotmart"],
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
          <p>PLATAFORMA & TREINAMENTO</p>
          {nav.slice(0, 8).map(([id, icon, label, badge]) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => navigateTo(id)}
            >
              <i>{icon}</i>{label}
              {badge && <span className="navHotmartBadge">{badge}</span>}
              {id === "clientsDiagnostic" && <span className="navNewBadge">Novo</span>}
            </button>
          ))}
          <p>VOCÊ</p>
          {nav.slice(8).map(([id, icon, label]) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => navigateTo(id)}
            >
              <i>{icon}</i>{label}
            </button>
          ))}
        </nav>

        {/* Hotmart Quick Sync Status Box in Sidebar */}
        <div className="sidebarHotmartBox" onClick={() => navigateTo("hotmart")}>
          <div className="hotmartBoxHead">
            <span className="hotmartFireSmall">🔥</span>
            <b>HOTMART CLUB</b>
          </div>
          <small>6 Aulas Disponíveis</small>
          <ProgressBar value={Math.round((hotmartLessons.filter((l) => l.completed).length / hotmartLessons.length) * 100)} />
          <span className="hotmartBoxFoot">Assistir aulas →</span>
        </div>

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
              className={`headerActionButton ${section === "hotmart" ? "primaryHotmart" : ""}`}
              onClick={() => navigateTo("hotmart")}
              title="Acessar Vídeos do Hotmart"
            >
              <span className="headerBtnIcon">🔥</span>
              <span className="headerBtnText">Hotmart</span>
            </button>
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
              hotmartLessons={hotmartLessons}
            />
          )}
          {section === "hotmart" && (
            <HotmartSection
              lessons={hotmartLessons}
              setLessons={setHotmartLessons}
              onOpenAddModal={() => setShowAddHotmartModal(true)}
              onOpenSettingsModal={() => setShowHotmartSettingsModal(true)}
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
          {section === "content" && <Content setSection={navigateTo} />}
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
            className={`bottomNavItem ${section === "hotmart" ? "active" : ""}`}
            onClick={() => navigateTo("hotmart")}
          >
            <span className="bottomNavIcon">🔥</span>
            <span className="bottomNavLabel">Hotmart</span>
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
            className="bottomNavItem"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="bottomNavIcon">☰</span>
            <span className="bottomNavLabel">Mais</span>
          </button>
        </nav>
      </main>

      <VersionModal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} />
      <AddHotmartVideoModal
        isOpen={showAddHotmartModal}
        onClose={() => setShowAddHotmartModal(false)}
        onAddLesson={(newLesson) => setHotmartLessons((prev) => [newLesson, ...prev])}
      />
      <HotmartSettingsModal
        isOpen={showHotmartSettingsModal}
        onClose={() => setShowHotmartSettingsModal(false)}
      />
    </div>
  );
}

function Dashboard({
  setSection,
  tasks,
  toggle,
  completed,
  hotmartLessons,
}: {
  setSection: (s: Section) => void;
  tasks: Task[];
  toggle: (id: number) => void;
  completed: number;
  hotmartLessons: HotmartLesson[];
}) {
  const completedHotmart = hotmartLessons.filter((l) => l.completed).length;

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

      {/* Hotmart Video Hub Banner on Dashboard */}
      <div className="card hotmartDashboardCard">
        <div className="hotmartDashLeft">
          <div className="hotmartBadgeGroup">
            <span className="hotmartFireBadge">🔥 HOTMART CLUB</span>
            <span className="hotmartSyncPill">● Ao Vivo & Integrado</span>
          </div>
          <h3>Assista suas Aulas e Vídeos do Hotmart</h3>
          <p>Acesse o catálogo de masterclasses, protocolos odontológicos, formulários clínicos e materiais de apoio.</p>
          <div className="hotmartDashStats">
            <span>⏱ <strong>{hotmartLessons.length} Aulas</strong> disponíveis</span>
            <span>✓ <strong>{completedHotmart} Concluídas</strong> ({Math.round((completedHotmart / hotmartLessons.length) * 100)}%)</span>
          </div>
        </div>
        <div className="hotmartDashRight">
          <button className="primary hotmartPlayBtn" onClick={() => setSection("hotmart")}>
            ▶ Abrir Player Hotmart
          </button>
        </div>
      </div>

      {/* Fast shortcut to Clients Diagnostic */}
      <div className="card clientQuickCallout">
        <div className="quickCalloutLeft">
          <span className="eyebrow gold">CENTRAL DE PACIENTES</span>
          <h3>Diagnóstico dos Clientes / Pacientes</h3>
          <p>Avalie a saúde bucal, códigos de comorbidades (CID-10) e índice clínico dos seus pacientes em tempo real.</p>
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
            <span>HOTMART</span>
            <b>DP</b>
          </div>
          <div>
            <span className="eyebrow">CONTINUE ASSISTINDO</span>
            <h2>Gestão para Clínicas & CID-10</h2>
            <p>Módulo 1 · Aula 1.1: Diagnóstico e Comunicação com Paciente</p>
            <ProgressBar value={66} />
            <small>2 de 6 aulas concluídas · 33%</small>
            <button className="primary" onClick={() => setSection("hotmart")}>
              Assistir no Player Hotmart →
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
              <b>{completedHotmart}</b>
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

function Content({ setSection }: { setSection: (s: Section) => void }) {
  const courses = [
    { title: "Gestão para Clínicas", tag: "HOTMART", progress: 66, desc: "Estruture sua clínica para crescer com previsibilidade e controle de custos." },
    { title: "Diagnóstico Clínico & CID-10", tag: "HOTMART", progress: 50, desc: "Aprofunde na correlação entre riscos sistêmicos e planos odontológicos de sucesso." },
    { title: "Posicionamento & Vendas Éticas", tag: "CURSO", progress: 20, desc: "Construa uma presença profissional coerente e aumente o valor percebido." }
  ];

  return (
    <>
      <PageTitle
        eyebrow="DESENVOLVIMENTO"
        title="Conteúdos & Aulas Hotmart"
        text="Cursos, aulas em vídeo e materiais práticos conectados aos desafios que você precisa resolver agora."
      />
      <div className="grid courses">
        {courses.map((c, i) => (
          <article className="card courseTile" key={c.title}>
            <div className={`tileArt art${i + 1}`}>
              <span>{c.tag}</span>
              <b>DP</b>
            </div>
            <div>
              <span className="eyebrow">CURSO EM VÍDEO</span>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <ProgressBar value={c.progress} />
              <small>{c.progress}% concluído</small>
              <button className="primary" style={{ marginTop: 12, width: "100%" }} onClick={() => setSection("hotmart")}>
                ▶ Assistir no Hotmart Player
              </button>
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
          <b>6</b>
          <span>Aulas Hotmart disponíveis</span>
        </div>
      </div>
      <div className="card timeline">
        <span className="eyebrow">HISTÓRICO RECENTE</span>
        <h2>Seus avanços</h2>
        {[
          "Concluiu a Aula 1.1 Hotmart: Diagnóstico Integrado e Avaliação de Comorbidades (CID-10)",
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
            Conta Hotmart<strong>dentistadeproposito.club.hotmart.com (Ativo)</strong>
          </label>
          <label>
            Objetivo principal<strong>Abrir clínica própria</strong>
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
