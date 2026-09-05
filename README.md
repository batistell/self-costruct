# Self Construct

Self Construct is an experimental AI-native development environment that can change its source code **directly on GitHub** and deploy the resulting commit back into its own running runtime.

The left side is the AI agent. The right side is a live Vite preview. GitHub is the canonical source of truth: the agent reads/writes repository files through the GitHub API, each write produces a commit SHA, and the agent explicitly sends that SHA to the local supervisor for deployment. No webhook is required for changes created by the agent.

## Runtime flow

```text
Prompt in browser
      ↓
OpenAI agent
      ↓
GitHub API read/write
      ↓
commit on master → SHA
      ↓
deploy_commit(SHA)
      ↓
local supervisor
      ↓
git fetch + git reset --hard SHA
      ↓
npm install (only when dependency manifests changed)
      ↓
restart backend/frontend/preview
      ↓
health check
      ↓
live updated runtime
```

If a deployment fails its health checks, the supervisor attempts to reset to the previous commit and starts the previous runtime again. If the supervisor itself changes, `scripts/start.sh` restarts it so the new supervisor source becomes active.

## Project structure

```text
self-costruct/
├── frontend/             # Workbench: agent chat + live iframe
├── backend/              # OpenAI agent + GitHub tools
├── workspace/            # Editable app shown in the live preview
├── supervisor/           # Deploy/restart/health-check/rollback runtime
├── scripts/start.sh      # Keeps the supervisor alive across self-updates
├── docs/                 # Architecture and ADRs
├── .env.example
└── package.json
```

## Run on an Android tablet with Termux

### 1. Install the required packages

Open Termux and run:

```bash
pkg update
pkg upgrade
pkg install nodejs-lts git gh
```

Confirm the tools:

```bash
node --version
git --version
gh --version
```

Node.js 20 or newer is required.

### 2. Clone or update the repository

For a first install:

```bash
cd ~
git clone https://github.com/batistell/self-costruct.git
cd self-costruct
```

If the repository is already cloned:

```bash
cd ~/self-costruct
git pull origin master
```

### 3. Authenticate GitHub

The Self Construct agent writes directly to GitHub. Authenticate the GitHub CLI once:

```bash
gh auth login
```

Choose GitHub.com and HTTPS, then finish authentication in the browser. Verify:

```bash
gh auth status
```

The backend uses `GITHUB_TOKEN` when explicitly configured; otherwise it obtains the local token through `gh auth token`. The token is never sent to the frontend.

### 4. Configure the OpenAI API key locally

Never commit the real key. Create `.env` from the example:

```bash
cp .env.example .env
```

Then enter the key without echoing it to the terminal:

```bash
read -s -p "OpenAI API Key: " OPENAI_API_KEY
echo
printf '\nOPENAI_API_KEY=%s\n' "$OPENAI_API_KEY" >> .env
unset OPENAI_API_KEY
chmod 600 .env
```

If `.env` already contains an `OPENAI_API_KEY=` line, edit it rather than adding a duplicate. You can safely confirm that a key is present without printing it:

```bash
if grep -q '^OPENAI_API_KEY=sk-' .env; then echo 'OpenAI key configured'; else echo 'OpenAI key missing'; fi
```

Confirm Git ignores the secret:

```bash
git check-ignore .env
```

Expected output:

```text
.env
```

### 5. Install dependencies

```bash
npm install
```

### 6. Start Self Construct

```bash
npm start
```

Keep this Termux session running. The supervisor starts three runtimes automatically:

```text
Workbench    http://127.0.0.1:5173
Backend      http://127.0.0.1:3001
Supervisor   http://127.0.0.1:3002
Live preview http://127.0.0.1:5174
```

### 7. Open it in the tablet browser

While `npm start` is running, open Chrome, Samsung Internet, or another browser on the same tablet and navigate to:

```text
http://127.0.0.1:5173
```

If the browser does not resolve `127.0.0.1`, try:

```text
http://localhost:5173
```

For the best split-screen workbench experience, use the tablet in landscape orientation.

## How self-update works

A request such as “change the preview heading” is executed like this:

1. The model uses `github_read_file` / `github_list_files` to inspect the repository.
2. It calls `github_write_file` or `github_delete_file`. The change happens on GitHub, not in the local working tree.
3. GitHub returns the new commit SHA.
4. After the final source change, the model calls `deploy_commit` with the newest SHA.
5. The local supervisor fetches that commit, resets the working tree to it, handles dependency changes, and restarts the required runtimes.
6. Health checks validate backend, workbench, and preview. A failed deployment triggers an attempted rollback.

This means the GitHub history is the audit log and canonical state of Self Construct. A webhook is only needed later if the tablet should automatically react to commits created **outside** Self Construct.

## Security

`.env` is ignored and must remain local. OpenAI and GitHub credentials are used only by the backend. The supervisor binds to `127.0.0.1`, so its deploy endpoint is local to the tablet. The current project is intentionally a high-trust local development environment; a public/multi-user deployment should add stronger authentication and sandboxing.

## Documentation

See `docs/architecture.md`, `docs/backend.md`, `docs/frontend.md`, and `docs/adr/` for design details and architectural decisions.

## Status

MVP bootstrap: GitHub-driven agent + local self-deploy runtime.
