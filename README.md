# Self Construct

Self Construct is an experimental AI-native web development environment where the application can inspect, modify, run, and evolve its own source code through an AI agent.

## Vision

The interface is split into two primary areas:

- **Left — AI Agent:** a GPT-powered chat used to design, build, debug, and evolve the application.
- **Right — Live Preview:** the application currently being constructed, refreshed automatically as source files change.

The defining capability is that the agent has access to the project's source workspace and can modify it while the development environment is running. The goal is to make it possible to build Self Construct from inside Self Construct.

## Core loop

```text
User prompt
   ↓
Chat UI
   ↓
Agent / OpenAI Responses API
   ↓
Tool execution
   ↓
Read / write source + execute commands
   ↓
Dev server / HMR
   ↓
Live Preview
   ↓
User sees the result and continues prompting
```

## Repository structure

```text
self-costruct/
├── frontend/             # Workbench UI: chat + live preview
├── backend/              # Agent orchestration and runtime tools
├── workspace/            # Source controlled by the agent at runtime
├── docs/
│   ├── architecture.md
│   ├── backend.md
│   ├── frontend.md
│   └── adr/
└── README.md
```

## Runtime philosophy

The local development version is intentionally powerful. The agent may be configured with unrestricted access to the Self Construct workspace and command execution on the development runtime. This is a deliberate capability of the project.

Unrestricted execution means the agent effectively inherits the permissions of the process running Self Construct. Production or multi-user deployments therefore require stronger isolation boundaries such as containers or VMs, per-project workspaces, explicit secret handling, resource limits, and audit logs.

## Initial architecture

The frontend owns the workbench experience and live preview. The backend owns OpenAI communication, agent state, filesystem access, command execution, process management, and runtime events. The editable application runs from a workspace watched by a development server with hot module replacement.

See the documents in `docs/` for the detailed design and architectural decisions.

## Status

Early architecture / bootstrap stage.
