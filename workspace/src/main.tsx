import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type Section = "dashboard" | "journey" | "diagnostic" | "goals" | "plan" | "content" | "progress" | "profile";
type Task = { id: number; title: string; category: string; due: string; done: boolean };

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

function ProgressBar({ value }: { value: number }) {
  return <div className="progress"><div style={{ width: `${value}%` }} /></div>;
}

function App() {
  const [section, setSection] = useState<Section>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(() => {
    try { return JSON.parse(localStorage.getItem("dp_tasks") || "null") || defaultTasks; } catch { return defaultTasks; }
  });

  const completed = useMemo(() => tasks.filter(t => t.done).length, [tasks]);
  const toggle = (id: number) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(next);
    localStorage.setItem("dp_tasks", JSON.stringify(next));
  };

  const nav: [Section, string, string][] = [
    ["dashboard", "⌂", "Início"], ["journey", "◇", "Minha jornada"], ["diagnostic", "◎", "Diagnóstico"],
    ["goals", "◉", "Objetivos"], ["plan", "✓", "Plano de ação"], ["content", "▤", "Conteúdos"],
    ["progress", "↗", "Progresso"], ["profile", "○", "Meu perfil"],
  ];

  return <div className="shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setSection("dashboard")}><span className="brandMark">DP</span><span><b>Dentista</b><small>de Propósito</small></span></button>
      <nav>
        <p>SUA JORNADA</p>
        {nav.slice(0, 6).map(([id, icon, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><i>{icon}</i>{label}</button>)}
        <p>VOCÊ</p>
        {nav.slice(6).map(([id, icon, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><i>{icon}</i>{label}</button>)}
      </nav>
      <div className="stageBox"><span>ETAPA ATUAL</span><b>Clareza</b><ProgressBar value={42}/><small>42% concluído</small></div>
      <div className="user"><span>AB</span><div><b>André Batista</b><small>Dentista</small></div></div>
    </aside>

    <main className="main">
      <header><span className="headerTitle">Dentista de Propósito</span><div><button>◇</button><button>? Ajuda</button></div></header>
      <div className="content">
        {section === "dashboard" && <Dashboard setSection={setSection} tasks={tasks} toggle={toggle} completed={completed} />}
        {section === "journey" && <Journey setSection={setSection} />}
        {section === "diagnostic" && <Diagnostic />}
        {section === "goals" && <Goals setSection={setSection} />}
        {section === "plan" && <Plan tasks={tasks} toggle={toggle} />}
        {section === "content" && <Content />}
        {section === "progress" && <Progress completed={completed} />}
        {section === "profile" && <Profile />}
      </div>
    </main>
  </div>;
}

function Dashboard({ setSection, tasks, toggle, completed }: { setSection:(s:Section)=>void; tasks:Task[]; toggle:(id:number)=>void; completed:number }) {
  return <>
    <section className="welcome"><div><span className="eyebrow gold">SÁBADO, 5 DE SETEMBRO</span><h1>Bom dia, André.</h1><p>Você não precisa ter todas as respostas hoje. Precisa apenas continuar avançando.</p></div><div className="streak"><span>✦</span><b>7 dias</b><small>de evolução contínua</small></div></section>

    <section className="card journeyCard">
      <div className="sectionHead"><div><span className="eyebrow">MÉTODO DENTISTA DE PROPÓSITO</span><h2>Sua jornada</h2></div><button className="link" onClick={() => setSection("journey")}>Ver jornada completa →</button></div>
      <div className="journeySteps">{stages.map(([name, sub], i) => <div className={`step ${i === 0 ? "done" : i === 1 ? "current" : ""}`} key={name}><span>{i === 0 ? "✓" : i + 1}</span><b>{name}</b><small>{sub}</small></div>)}</div>
      <div className="currentCallout"><div className="number">02</div><div><span className="eyebrow">VOCÊ ESTÁ AQUI</span><h3>Clareza: transforme intenção em direção</h3><p>Defina com precisão o que você deseja construir na sua carreira e na sua vida.</p></div><button className="primary" onClick={() => setSection("diagnostic")}>Continuar etapa →</button></div>
    </section>

    <div className="grid two">
      <section className="card"><div className="sectionHead"><div><span className="eyebrow">PRÓXIMOS PASSOS</span><h2>Seu plano de ação</h2></div><button className="link" onClick={() => setSection("plan")}>Ver tudo</button></div><div className="tasks">{tasks.map(t => <label key={t.id} className={t.done ? "done" : ""}><input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} /><span className="check"/><div><b>{t.title}</b><small>{t.category} · {t.due}</small></div></label>)}</div></section>
      <section className="card"><div className="sectionHead"><div><span className="eyebrow">SEU MOMENTO</span><h2>Diagnóstico</h2></div><button className="link" onClick={() => setSection("diagnostic")}>Detalhes</button></div><div className="score"><span><b>64</b>/100</span><div><b>Em desenvolvimento</b><p>Seu maior potencial agora está em posicionamento e gestão.</p></div></div><div className="miniMetrics">{diagnostic.slice(0,4).map(([n,v]) => <div key={n}><span>{n}<b>{v}</b></span><ProgressBar value={v}/></div>)}</div></section>
    </div>

    <div className="grid two lower">
      <section className="card course"><div className="courseArt"><span>GESTÃO</span><b>DP</b></div><div><span className="eyebrow">CONTINUE APRENDENDO</span><h2>Gestão para Clínicas</h2><p>Módulo 1 · Quem sou eu, onde estou e para onde quero ir?</p><ProgressBar value={42}/><small>5 de 12 aulas · 42%</small><button className="primary" onClick={() => setSection("content")}>Continuar aula →</button></div></section>
      <section className="card"><div className="sectionHead"><div><span className="eyebrow">EVOLUÇÃO</span><h2>Seu progresso</h2></div><button className="link" onClick={() => setSection("progress")}>Ver relatório</button></div><div className="bigProgress"><b>{Math.max(31, Math.round(completed / tasks.length * 100))}%</b><span>da jornada inicial concluída</span></div><div className="stats"><div><b>7</b><span>dias ativos</span></div><div><b>5</b><span>aulas</span></div><div><b>{completed}</b><span>ações</span></div></div></section>
    </div>
  </>;
}

function PageTitle({ eyebrow, title, text }: { eyebrow:string; title:string; text:string }) { return <div className="pageTitle"><span className="eyebrow gold">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }

function Journey({ setSection }: { setSection:(s:Section)=>void }) { return <><PageTitle eyebrow="MÉTODO DENTISTA DE PROPÓSITO" title="Sua jornada profissional" text="Cinco etapas para transformar clareza em construção e construção em prosperidade."/><div className="journeyList">{stages.map(([n,s],i)=><div className={`card journeyRow ${i===1?"current":""}`} key={n}><span className="journeyNo">0{i+1}</span><div><span className="eyebrow">ETAPA {i+1}</span><h2>{n}</h2><p>{s}. Cada etapa reúne perguntas, exercícios, conteúdos, tarefas e checkpoints.</p></div><b className="status">{i===0?"Concluída":i===1?"Em andamento":"Bloqueada"}</b>{i===1&&<button className="primary" onClick={()=>setSection("diagnostic")}>Continuar →</button>}</div>)}</div></>; }

function Diagnostic() { return <><PageTitle eyebrow="AUTOCONHECIMENTO PROFISSIONAL" title="Seu diagnóstico" text="Uma visão objetiva das áreas que mais influenciam seu momento profissional."/><div className="card diagnosticHero"><div className="scoreCircle"><b>64</b><span>/100</span></div><div><span className="eyebrow gold">RESULTADO ATUAL</span><h2>Você está em desenvolvimento</h2><p>Existe uma base técnica sólida. O próximo salto depende principalmente de posicionamento, gestão e organização financeira.</p><button className="secondary">Refazer diagnóstico</button></div></div><div className="grid metrics">{diagnostic.map(([n,v])=><div className="card metric" key={n}><div><b>{n}</b><span>{v}/100</span></div><ProgressBar value={v}/><p>{v>=80?"Ponto forte — mantenha a consistência.":v>=60?"Boa base, com espaço claro para evolução.":"Área prioritária para o próximo ciclo."}</p></div>)}</div></>; }

function Goals({ setSection }: { setSection:(s:Section)=>void }) { return <><PageTitle eyebrow="DIREÇÃO" title="Objetivos e metas" text="Transforme o que você deseja para o futuro em metas claras, mensuráveis e acompanháveis."/><div className="card goalHero"><span className="eyebrow gold">OBJETIVO PRINCIPAL</span><h2>Abrir minha própria clínica</h2><p>Construir uma operação sustentável, bem posicionada e alinhada à vida que desejo ter.</p><div className="goalMeta"><span>Prazo <b>24 meses</b></span><span>Progresso <b>26%</b></span><span>Ações <b>6</b></span></div><ProgressBar value={26}/><button className="primary" onClick={()=>setSection("plan")}>Ver plano de ação →</button></div><div className="grid two"><div className="card goalSmall"><span className="eyebrow">META FINANCEIRA</span><h3>Construir reserva de segurança</h3><p>Acumular 6 meses de custos fixos antes da abertura.</p><ProgressBar value={44}/><small>44% concluído</small></div><div className="card goalSmall"><span className="eyebrow">META DE POSICIONAMENTO</span><h3>Fortalecer presença profissional</h3><p>Definir posicionamento, proposta de valor e linha editorial.</p><ProgressBar value={18}/><small>18% concluído</small></div></div></>; }

function Plan({ tasks, toggle }: { tasks:Task[]; toggle:(id:number)=>void }) { return <><PageTitle eyebrow="EXECUÇÃO" title="Plano de ação" text="O conhecimento ganha valor quando vira movimento. Organize aqui seus próximos passos."/><div className="card"><div className="planSummary"><div><b>{tasks.filter(t=>!t.done).length}</b><span>ações pendentes</span></div><div><b>{tasks.filter(t=>t.done).length}</b><span>concluídas</span></div><div><b>1</b><span>prioridade hoje</span></div></div><div className="tasks large">{tasks.map(t=><label key={t.id} className={t.done?"done":""}><input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)}/><span className="check"/><div><b>{t.title}</b><small>{t.category} · {t.due}</small></div><span className="pill">{t.category}</span></label>)}</div></div></>; }

function Content() { const courses=["Gestão para Clínicas","Posicionamento Profissional","Finanças para Dentistas"]; return <><PageTitle eyebrow="DESENVOLVIMENTO" title="Conteúdos para o seu momento" text="Cursos, aulas e exercícios conectados aos desafios que você precisa resolver agora."/><div className="grid courses">{courses.map((c,i)=><article className="card courseTile" key={c}><div className={`tileArt art${i+1}`}><span>{["GESTÃO","CARREIRA","FINANÇAS"][i]}</span><b>DP</b></div><div><span className="eyebrow">CURSO</span><h3>{c}</h3><p>{["Estruture sua clínica para crescer com previsibilidade.","Construa uma presença coerente com seus objetivos.","Organize números, metas e decisões financeiras."][i]}</p><ProgressBar value={[42,18,0][i]}/><small>{["5 de 12 aulas","2 de 8 aulas","10 aulas"][i]}</small><button className="secondary">{i===0?"Continuar curso":"Ver curso"}</button></div></article>)}</div></>; }

function Progress({ completed }: { completed:number }) { return <><PageTitle eyebrow="EVOLUÇÃO" title="Seu progresso" text="Acompanhe evidências reais de evolução ao longo da sua jornada."/><div className="grid progressGrid"><div className="card statHero"><b>31%</b><span>Jornada inicial concluída</span><ProgressBar value={31}/></div><div className="card statHero"><b>64</b><span>Pontuação atual do diagnóstico</span><ProgressBar value={64}/></div><div className="card statHero"><b>{completed}</b><span>Ações concluídas</span></div><div className="card statHero"><b>5</b><span>Aulas concluídas</span></div></div><div className="card timeline"><span className="eyebrow">HISTÓRICO RECENTE</span><h2>Seus avanços</h2>{["Concluiu a aula 'Quem sou eu, onde estou e para onde quero ir?'","Finalizou o diagnóstico profissional inicial","Definiu o objetivo 'Abrir minha própria clínica'","Iniciou a etapa Clareza"].map((x,i)=><div key={x}><span>✓</span><p>{x}<small>{i===0?"Hoje":i===1?"2 dias atrás":i===2?"4 dias atrás":"7 dias atrás"}</small></p></div>)}</div></>; }

function Profile() { return <><PageTitle eyebrow="SEU PERFIL" title="Perfil profissional" text="As informações que ajudam a plataforma a entender seu momento e personalizar sua jornada."/><div className="card profileCard"><div className="profileTop"><span className="profileAvatar">AB</span><div><h2>André Batista</h2><p>Dentista · São Paulo, SP</p></div><button className="secondary">Editar perfil</button></div><div className="profileGrid"><label>Momento profissional<strong>Dentista em fase de crescimento</strong></label><label>Tempo de formado<strong>5 anos</strong></label><label>Especialidade<strong>Clínica Geral</strong></label><label>Objetivo principal<strong>Abrir clínica própria</strong></label><label>Principal dificuldade<strong>Posicionamento e gestão</strong></label><label>Etapa atual<strong>Clareza</strong></label></div></div></>; }

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
