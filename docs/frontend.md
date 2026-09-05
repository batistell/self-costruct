# Frontend

## Responsibilities

The frontend is the Self Construct workbench. It combines the AI conversation, agent execution visibility, and the live application preview in a single interface.

## Primary layout

Desktop/tablet landscape layout:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Self Construct                                      runtime status │
├──────────────────────────────┬─────────────────────────────────────┤
│                              │                                     │
│ Agent Chat                   │ Live Preview                        │
│                              │                                     │
│ messages                     │ application under construction      │
│ streaming assistant output   │                                     │
│ tool activity                │                                     │
│ command/file events          │                                     │
│                              │                                     │
│                              │                                     │
├──────────────────────────────┤                                     │
│ prompt composer              │                                     │
└──────────────────────────────┴─────────────────────────────────────┘
```

The split should be resizable. The first version can default to approximately 40% chat / 60% preview.

## Agent chat

The left panel should support:

- user and assistant messages;
- streaming model text;
- Markdown and code rendering;
- visible tool execution state;
- collapsible command output;
- changed-file indicators;
- runtime/build errors;
- stop/cancel run action when supported;
- conversation history.

The interface should distinguish assistant reasoning/output from actual executed actions. Tool events should be rendered as first-class activity items rather than injected as plain chat text.

## Prompt composer

Initial composer capabilities:

- multiline prompt;
- send button / keyboard shortcut;
- disabled state while appropriate;
- optional model selector later;
- optional attachments/images later;
- ability to reference project files later.

The product goal is eventually to expose the useful multimodal and tool-enabled capabilities supported by the configured OpenAI model, while keeping API-specific behavior behind the backend.

## Live preview

The right panel renders the development server URL for the current workspace.

Initial implementation:

- iframe pointing at the preview dev server;
- loading state;
- runtime unavailable state;
- manual reload button;
- open-preview URL action;
- automatic recovery when the dev server restarts.

HMR should be handled by the application framework inside the iframe. The workbench should not reload the whole Self Construct UI when workspace files change.

## Runtime toolbar

Show compact operational state:

```text
Agent: idle/running/error
Preview: starting/ready/error
Process: running/stopped
Current workspace
```

Potential actions:

- restart preview;
- reload preview;
- show logs;
- show Git diff;
- toggle activity panel.

## Event handling

The frontend consumes the backend's structured event stream and reduces events into UI state.

Example:

```text
run.started       → create active run
assistant.delta   → append streamed text
tool.started      → add activity entry
tool.output       → append tool output
file.changed      → mark changed path
preview.ready     → update iframe URL/status
run.completed     → finalize response
```

Avoid coupling UI components directly to raw OpenAI API response objects. The backend protocol is the application contract.

## State model

Suggested top-level state:

```text
conversation
activeRun
activities
runtime
preview
workspace
uiLayout
```

The first implementation does not need a complex global state library if React state/context is sufficient. Introduce additional state infrastructure only when complexity justifies it.

## Error experience

Runtime failures are part of the development workflow. They should remain visible and useful instead of becoming generic toast errors.

Example flow:

```text
Agent edits source
   ↓
compiler error
   ↓
preview shows error / backend captures log
   ↓
activity feed shows failure
   ↓
agent can inspect logs and fix code
```

This feedback loop is fundamental to autonomous iteration.

## Responsive behavior

The main target is tablet/desktop landscape because the project is initially being developed and run on an Android tablet with Termux.

For narrow portrait screens, panels may switch from side-by-side to tabs (`Agent` / `Preview`) rather than forcing two unusably narrow columns.

## Initial implementation direction

Use React + TypeScript with a fast HMR development stack. Keep the workbench host visually minimal so the site being built remains the focus.

The initial milestone should prioritize a functional loop over design-system complexity:

1. split layout;
2. chat messages;
3. streaming events;
4. preview iframe;
5. tool activity visualization;
6. runtime status and errors.
