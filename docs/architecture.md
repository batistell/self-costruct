# Architecture

## Purpose

Self Construct is a local-first AI development environment in which an AI agent can inspect and modify the source code of the application being previewed. The primary development loop happens entirely inside the product: the user talks to the agent on the left and observes the evolving application on the right.

## High-level architecture

```text
┌────────────────────────────── Browser ──────────────────────────────┐
│                                                                    │
│  ┌──────────────── Agent Chat ────────────────┐  ┌──────────────┐ │
│  │ prompts, streaming output, tool activity   │  │ Live Preview │ │
│  └───────────────────┬────────────────────────┘  │ iframe/web   │ │
│                      │                           └──────▲───────┘ │
└──────────────────────┼──────────────────────────────────┼──────────┘
                       │ HTTP / SSE or WebSocket           │
                       ▼                                   │
┌──────────────────────────── Backend ────────────────────────────────┐
│                                                                    │
│  Agent Orchestrator                                                │
│      │                                                             │
│      ├── OpenAI Responses API                                      │
│      ├── Filesystem tools                                          │
│      ├── Shell / process tools                                     │
│      ├── Git tools                                                 │
│      └── Runtime event stream                                      │
│                                                                    │
│  Workspace Manager ───────────────► project source                  │
│                                      │                             │
│                                      ▼                             │
│                               Development Server                    │
│                               HMR / live reload                     │
└────────────────────────────────────────────────────────────────────┘
```

## Main components

### Workbench frontend

The host application displayed in the browser. It contains the chat, activity feed, layout controls, runtime status, and the live preview surface.

### Agent backend

Receives user messages, sends them to the OpenAI Responses API, exposes runtime tools to the model, executes requested tool calls, and streams both model output and execution events back to the browser.

### Workspace

A writable project directory. During local development the agent may have unrestricted filesystem and shell access under the permissions of the Self Construct process.

The initial project layout separates the Self Construct host from the application under construction where practical. Later versions may support multiple workspaces and projects.

### Runtime manager

Starts and monitors the development server for the workspace. It exposes a stable preview URL and reports runtime errors, process output, build events, and restart state.

### Live preview

The right side of the interface renders the workspace application, initially through an iframe or equivalent isolated browser surface. Source updates propagate through the framework's hot module replacement mechanism; when HMR cannot handle a change, the preview reloads.

## Core agent loop

1. User sends an instruction.
2. Backend adds the request to the active agent conversation.
3. Model decides whether to respond directly or invoke one or more tools.
4. Backend executes requested filesystem, shell, runtime, or Git operations.
5. Tool results are returned to the model.
6. The loop continues until the model produces a final response.
7. Source changes trigger HMR or a preview reload.
8. Runtime events and tool activity are streamed to the frontend throughout the operation.

## Agent capabilities

The local development profile intentionally supports high-trust operation. Expected capabilities include:

- recursive file listing and search;
- arbitrary file read/write/create/delete;
- patch application;
- directory creation/removal;
- arbitrary shell command execution;
- process start/stop/restart;
- package manager commands;
- Git diff/status/commit operations;
- reading development server logs;
- inspecting preview/runtime state.

This is not considered a sandbox. The model effectively has the authority of the process executing Self Construct.

## Runtime update model

The preferred development stack must provide fast HMR. The backend writes source files directly into the watched workspace. The development server detects those writes and publishes updates to the preview.

```text
Agent write_file
      ↓
filesystem change
      ↓
dev server watcher
      ↓
HMR / rebuild
      ↓
preview updated
```

The backend should not rebuild the entire application manually after every write unless required by the selected framework.

## Communication

The initial implementation should use ordinary HTTP for commands and Server-Sent Events or a WebSocket for streaming model tokens, tool activity, process logs, file-change events, and runtime status.

The protocol should expose typed events rather than forwarding raw process output directly into UI state.

## Persistence

Early versions can be local-first:

- source code: filesystem + Git;
- agent conversation: JSON/SQLite or in-memory during the first prototype;
- runtime logs: bounded in-memory buffer initially;
- configuration: `.env` and application config.

## Security model

Local single-user development explicitly allows unrestricted execution when enabled. This design must not be confused with a safe multi-user execution environment.

For any remote, hosted, shared, or multi-tenant version, the execution boundary must change to isolated containers/VMs or equivalent sandboxes. Credentials belonging to the host must not automatically be exposed inside an untrusted workspace.

## Guiding principle

The agent is not merely a code generator. It is an active participant in the application's runtime development environment, with the ability to observe state, modify source, execute development commands, inspect failures, and iterate until the requested change works.
