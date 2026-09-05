# ADR 001 — Agent Runtime Access

## Status

Accepted

## Context

The defining feature of Self Construct is that the AI agent can alter the source code of the application while it is running and immediately observe the result. The project begins as a local, single-user development tool running on the owner's machine/tablet.

A heavily restricted tool sandbox would reduce risk but would also block many of the operations expected from a general software-development agent, including package installation, project restructuring, Git operations, build tooling, and runtime inspection.

## Decision

The local development profile will allow the agent to execute arbitrary filesystem and shell operations with the permissions of the Self Construct backend process.

The backend will still expose structured tools for filesystem, shell, process, Git, and runtime operations so that actions remain observable and tool results are machine-readable. These tools are an interface and telemetry boundary, not a security sandbox.

## Consequences

### Positive

- the agent can perform full-stack development without artificial tool limitations;
- package managers, Git, compilers, generators, and arbitrary project tooling work naturally;
- Self Construct can modify its own source and runtime configuration;
- debugging and autonomous iteration become substantially more capable.

### Negative

- the model can read, alter, or delete any data available to the backend process;
- arbitrary shell commands can affect the host environment;
- secrets visible to the process may be reachable;
- this execution model is not appropriate for untrusted users or multi-tenant hosting.

## Future hosted mode

A remote or shared deployment must introduce a real isolation boundary such as per-project containers, microVMs, VMs, or an equivalent sandbox. The unrestricted local profile must not be reused unchanged as a multi-user production security model.
