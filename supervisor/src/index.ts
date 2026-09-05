import express from "express";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const PORT = Number(process.env.SUPERVISOR_PORT ?? 3002);
const children = new Map<string, ChildProcess>();
let deploying = false;

function spawnRuntime(name: string, workspace: string) {
  const child = spawn("npm", ["run", "dev", "-w", workspace], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  children.set(name, child);
  child.on("exit", (code, signal) => {
    if (children.get(name) === child) {
      children.delete(name);
      console.log(`[supervisor] ${name} exited (${code ?? signal})`);
    }
  });
}

function startRuntimes() {
  spawnRuntime("backend", "backend");
  spawnRuntime("frontend", "frontend");
  spawnRuntime("workspace", "workspace");
}

async function stopRuntimes() {
  for (const child of children.values()) child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (const child of children.values()) {
    if (!child.killed) child.kill("SIGKILL");
  }
  children.clear();
}

async function git(...args: string[]) {
  const { stdout } = await execFileAsync("git", args, { cwd: ROOT });
  return stdout.trim();
}

async function waitFor(url: string, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function healthCheck() {
  const [backend, frontend, preview] = await Promise.all([
    waitFor("http://127.0.0.1:3001/health"),
    waitFor("http://127.0.0.1:5173"),
    waitFor("http://127.0.0.1:5174"),
  ]);
  return backend && frontend && preview;
}

async function dependenciesChanged(from: string, to: string) {
  const changed = await git("diff", "--name-only", from, to);
  return changed.split("\n").some((file) =>
    /(^|\/)(package(-lock)?\.json)$/.test(file),
  );
}

async function supervisorChanged(from: string, to: string) {
  const changed = await git("diff", "--name-only", from, to);
  return changed.split("\n").some((file) =>
    file.startsWith("supervisor/") || file === "scripts/start.sh" || file === "package.json",
  );
}

async function installDependencies() {
  console.log("[supervisor] dependencies changed; running npm install...");
  await execFileAsync("npm", ["install"], { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
}

async function deploy(sha: string) {
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error("Invalid commit SHA");

  const previous = await git("rev-parse", "HEAD");
  console.log(`[supervisor] deploying ${sha} (current ${previous})`);
  await git("fetch", "origin", "master");
  await git("cat-file", "-e", `${sha}^{commit}`);

  const depsChanged = await dependenciesChanged(previous, sha);
  const selfChanged = await supervisorChanged(previous, sha);

  await stopRuntimes();
  await git("reset", "--hard", sha);

  try {
    if (depsChanged) await installDependencies();

    if (selfChanged) {
      console.log("[supervisor] supervisor changed; scheduling self restart...");
      setTimeout(() => process.exit(75), 300);
      return { sha, restartedSupervisor: true, healthy: true };
    }

    startRuntimes();
    const healthy = await healthCheck();
    if (!healthy) throw new Error("Health check failed after deployment");
    return { sha, restartedSupervisor: false, healthy: true };
  } catch (error) {
    console.error("[supervisor] deployment failed, rolling back", error);
    await stopRuntimes();
    await git("reset", "--hard", previous);
    if (depsChanged) await installDependencies();
    startRuntimes();
    await healthCheck();
    throw error;
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, children: [...children.keys()] });
});

app.post("/deploy", async (req, res) => {
  if (deploying) return res.status(409).json({ error: "Deployment already in progress" });
  deploying = true;
  try {
    const result = await deploy(String(req.body?.sha ?? ""));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    deploying = false;
  }
});

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`[supervisor] listening on http://127.0.0.1:${PORT}`);
  startRuntimes();
});

async function shutdown(code = 0) {
  server.close();
  await stopRuntimes();
  process.exit(code);
}

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));
