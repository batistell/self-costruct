# ADR 003 — Live Preview Through Development Server HMR

## Status

Accepted

## Context

Self Construct must make source modifications visible as quickly as possible in the right-side preview. Rebuilding and restarting the whole workbench after every agent edit would make the feedback loop slow and fragile.

Modern frontend development servers already watch source files and provide hot module replacement (HMR) or live reload.

## Decision

Run the editable application as a separate development-server process and render its URL inside the workbench preview.

Agent source writes occur directly in the watched workspace. The selected development stack is responsible for detecting changes and applying HMR. When HMR is unavailable or insufficient, the preview may perform a normal reload.

The Self Construct host UI and the application being constructed remain separate runtimes even when they live in the same repository.

## Consequences

### Positive

- very fast edit-to-preview feedback;
- leverages established development-server behavior;
- the workbench does not need to implement its own compiler or module graph;
- runtime compiler errors naturally become part of the agent feedback loop.

### Negative

- the runtime manager must supervise an additional child process;
- preview ports and readiness must be discovered/configured;
- full configuration/dependency changes may require process restart rather than HMR;
- iframe/browser-origin behavior may require proxying or configuration later.

## Initial implementation

The first prototype should use a frontend stack with reliable file watching and HMR under Node.js/Termux. React + TypeScript with Vite is the preferred starting point unless implementation constraints require a change.
