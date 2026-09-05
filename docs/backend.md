# Backend

## Responsibilities

The backend is the execution core of Self Construct. It connects the workbench UI to the OpenAI Responses API and to the local development environment.

Primary responsibilities:

- manage agent conversations and model requests;
- expose tools/functions to the model;
- execute filesystem and shell operations;
- manage the editable workspace;
- start, stop, and monitor development processes;
- stream model output and runtime events to the frontend;
- expose runtime health and preview metadata;
- provide Git integration for history, diff, and rollback.

## OpenAI integration

Use the OpenAI Responses API as the primary agent interface. The model receives conversation context and a set of callable tools. When the model requests a tool call, the backend executes it and returns the result to the model until the response completes.

The model identifier must be configurable rather than hard-coded.

Environment configuration should include at least:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
WORKSPACE_PATH=
PREVIEW_PORT=
```

Secrets must never be committed to the repository.

## Agent orchestrator

The orchestrator owns one run from user prompt to final answer.

Pseudo-flow:

```text
receiveUserMessage()
  ↓
create/continue model response
  ↓
stream assistant output
  ↓
if tool calls:
    execute tools
    publish tool events
    submit tool results
    continue response
  ↓
final assistant message
```

A run should have an ID so the frontend can correlate token output, tool calls, logs, source mutations, errors, and completion.

## Tool layer

The local development profile may expose unrestricted tools. The initial tool surface should remain explicit even though the permissions are broad; explicit tools produce structured events and make agent activity observable.

### Filesystem

Suggested tools:

```text
list_files(path)
read_file(path)
write_file(path, content)
append_file(path, content)
delete_file(path)
move_file(source, destination)
make_directory(path)
search_files(query, path)
apply_patch(patch)
```

The backend should return useful metadata such as changed path, bytes written, and errors.

### Shell

```text
run_command(command, cwd?, timeout?)
```

Local development intentionally allows arbitrary commands. Capture stdout, stderr, exit code, execution duration, and timeout state.

Long-lived commands should be delegated to process-management primitives instead of blocking a normal tool request.

### Process/runtime

```text
start_process(command, cwd?)
stop_process(processId)
restart_process(processId)
get_process(processId)
get_process_logs(processId, tail?)
get_preview_status()
```

The runtime manager should know which process represents the application preview.

### Git

```text
git_status()
git_diff()
git_log(limit?)
git_commit(message)
```

Git history is a core recovery mechanism. Automatic commits can be added later as an optional mode rather than required for every tool call.

## Event stream

The frontend needs more than assistant text. Define structured events such as:

```text
run.started
assistant.delta
assistant.completed
tool.started
tool.output
tool.completed
tool.failed
file.changed
process.started
process.output
process.exited
preview.ready
preview.reload
run.failed
run.completed
```

Server-Sent Events are sufficient for the first unidirectional streaming implementation. A WebSocket can be introduced if bidirectional runtime communication becomes valuable.

## Workspace manager

The workspace manager provides a canonical working directory for agent operations. In unrestricted local mode, the shell may still access paths outside it because it inherits OS permissions; the workspace primarily provides context and consistent defaults rather than a security boundary.

Expected responsibilities:

- resolve project root;
- provide default cwd;
- emit file-change events;
- expose project metadata;
- coordinate the preview development server.

## Development server

The first implementation should launch the editable project's dev command as a child process. The command may be derived from project configuration, with a sensible default such as `npm run dev`.

The process manager must:

- keep stdout/stderr available to the agent and UI;
- detect crashes;
- expose readiness state;
- support restart;
- know the preview URL/port;
- avoid orphaning child processes when Self Construct exits.

## Error handling

Tool failures are normal agent observations, not necessarily fatal run errors. Return meaningful errors to the model so it can inspect and correct its work.

Examples:

- build failure → return compiler output;
- missing file → return path error;
- command exit code != 0 → include stdout/stderr;
- dev server crash → emit runtime event and preserve logs.

## Logging

Every agent run should produce a chronological activity trail. Initial logs may remain ephemeral, but the event model should support future persistence.

Never log API keys or other known secrets deliberately.

## Initial implementation direction

Use Node.js + TypeScript for the backend to keep the agent/runtime layer close to the frontend ecosystem and easy to run under Termux. The exact server framework is an implementation detail; prefer a lightweight framework with straightforward streaming and process-management support.
