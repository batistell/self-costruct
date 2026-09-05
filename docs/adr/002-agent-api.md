# ADR 002 — Agent API and Tool Calling

## Status

Accepted

## Context

Self Construct requires an AI model that can converse with the user, stream output, call application-defined tools, inspect tool results, and continue iterating until a development task is complete.

The backend must remain responsible for privileged operations. The browser must never receive the OpenAI API key or execute host-level agent tools directly.

## Decision

Use the OpenAI Responses API from the backend as the primary model interface. The backend defines the agent tools and executes requested tool calls locally.

The model name is configuration, not an architectural constant.

The browser communicates only with the Self Construct backend. It receives normalized application events instead of raw provider response objects.

## Interaction model

```text
Browser
  ↓ user message
Backend agent orchestrator
  ↓
OpenAI Responses API
  ↓ tool request
Backend tool executor
  ↓
filesystem / shell / runtime / Git
  ↓ tool result
OpenAI Responses API
  ↓
assistant output
  ↓
Browser event stream
```

## Consequences

### Positive

- API credentials remain on the backend;
- privileged tool execution stays close to the runtime it controls;
- provider-specific response formats are isolated from the frontend;
- the same frontend event contract can survive model/provider evolution;
- tool calls can be logged and correlated with agent runs.

### Negative

- the backend must implement the tool-call loop and streaming adapter;
- long-running agent operations require careful cancellation and process lifecycle handling;
- provider API changes are concentrated in the backend integration layer.

## Notes

The configured model should support the modalities and tools required by the product. Additional capabilities such as image input, web search, or provider-hosted tools can be added behind the same orchestration layer when needed.
