import { GoogleGenAI } from "@google/genai";
import { deleteGithubFile, listGithubFiles, readGithubFile, writeGithubFile } from "./github.js";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const supervisorUrl = process.env.SUPERVISOR_URL ?? "http://127.0.0.1:3002";

export interface AttachedFile {
  name: string;
  type: string;
  size?: number;
  data: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AgentInput {
  message: string;
  files?: AttachedFile[];
  history?: HistoryMessage[];
}

export interface ActivityItem {
  id: string;
  tool: string;
  args: any;
  result?: unknown;
  status: "running" | "success" | "error";
  description: string;
  startTime: number;
  endTime?: number;
}

export type AgentEvent =
  | { type: "status"; message: string }
  | { type: "tool_start"; activity: ActivityItem }
  | { type: "tool_end"; activity: ActivityItem }
  | { type: "done"; text: string; activities: ActivityItem[] }
  | { type: "error"; message: string };

const functionDeclarations: any[] = [
  {
    name: "github_list_files",
    description: "List files/directories directly from the GitHub repository. GitHub is the source of truth.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "Repository directory path; empty string means root." } },
      required: ["path"],
    },
  },
  {
    name: "github_read_file",
    description: "Read a UTF-8 source file directly from GitHub.",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "github_write_file",
    description: "Create or replace a source file directly on GitHub. This creates a commit and returns its SHA.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        message: { type: "string", description: "Concise Git commit message." },
      },
      required: ["path", "content", "message"],
    },
  },
  {
    name: "github_delete_file",
    description: "Delete a file directly on GitHub. This creates a commit and returns its SHA.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        message: { type: "string" },
      },
      required: ["path", "message"],
    },
  },
  {
    name: "deploy_commit",
    description: "Tell the local Self Construct supervisor to deploy an exact GitHub commit SHA. Call this after the final GitHub edit for a requested change.",
    parameters: {
      type: "object",
      properties: { sha: { type: "string", description: "40-character Git commit SHA returned by a GitHub write/delete tool." } },
      required: ["sha"],
    },
  },
];

const tools = [{ functionDeclarations }];

function formatToolDescription(name: string, args: any): string {
  switch (name) {
    case "github_list_files": {
      const p = args?.path ? `"${args.path}"` : "raiz do repositório";
      return `Listando arquivos em ${p}`;
    }
    case "github_read_file":
      return `Lendo arquivo "${args?.path || ""}"`;
    case "github_write_file": {
      const msg = args?.message ? ` (Commit: "${args.message}")` : "";
      return `Gravando no GitHub: "${args?.path || ""}"${msg}`;
    }
    case "github_delete_file": {
      const msg = args?.message ? ` (Commit: "${args.message}")` : "";
      return `Removendo do GitHub: "${args?.path || ""}"${msg}`;
    }
    case "deploy_commit": {
      const sha = (args?.sha || "").slice(0, 7);
      return `Implantando commit SHA: ${sha || "HEAD"}`;
    }
    default:
      return `Executando ${name}`;
  }
}

async function executeTool(name: string, args: any) {
  switch (name) {
    case "github_list_files":
      return listGithubFiles(args.path);
    case "github_read_file":
      return { path: args.path, content: await readGithubFile(args.path) };
    case "github_write_file":
      return { path: args.path, sha: await writeGithubFile(args.path, args.content, args.message) };
    case "github_delete_file":
      return { path: args.path, sha: await deleteGithubFile(args.path, args.message) };
    case "deploy_commit": {
      const response = await fetch(`${supervisorUrl}/deploy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sha: args.sha }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(`Deploy failed: ${JSON.stringify(body)}`);
      return body;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const instructions = `You are the Self Construct engineering agent. The GitHub repository is the canonical source of truth.
Inspect repository files before making non-trivial changes. Make changes using github_write_file/github_delete_file, never by assuming a local filesystem edit.
Each GitHub write returns a commit SHA. After completing all requested source changes, deploy the newest returned SHA with deploy_commit so the running tablet instance updates itself.
Do not write secrets, API keys, tokens, .env contents, or credentials to GitHub. Keep secrets local.
When a deploy fails, explain the error and inspect/revise the GitHub source if appropriate. Prefer small coherent changes and concise commit messages.`;

export async function runAgent(
  input: string | AgentInput,
  onEvent?: (event: AgentEvent) => void
) {
  const message = typeof input === "string" ? input : (input?.message || "");
  const files = typeof input === "string" ? [] : (input?.files ?? []);
  const history = typeof input === "object" && Array.isArray(input.history) ? input.history : [];

  const userParts: any[] = [];
  if (message.trim()) {
    userParts.push({ text: message.trim() });
  }

  for (const file of files) {
    let base64Data = file.data || "";
    let mimeType = file.type || "application/octet-stream";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      if (parts[0].startsWith("data:")) {
        mimeType = parts[0].slice(5) || mimeType;
      }
      base64Data = parts[1] || "";
    }

    const isText =
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/javascript" ||
      mimeType === "application/typescript" ||
      mimeType === "application/xml" ||
      /\.(ts|tsx|js|jsx|json|css|scss|html|md|txt|env|yml|yaml|sql|py|sh|rs|go|c|cpp|h|java|kt|rb|php)$/i.test(
        file.name
      );

    if (isText && base64Data) {
      try {
        const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
        userParts.push({
          text: `[Conteúdo do arquivo anexado "${file.name}" (${mimeType})]:\n\`\`\`\n${decoded}\n\`\`\``,
        });
      } catch {
        userParts.push({
          inlineData: {
            mimeType: mimeType || "text/plain",
            data: base64Data,
          },
        });
      }
    } else if (base64Data) {
      userParts.push({
        inlineData: {
          mimeType: mimeType || "image/png",
          data: base64Data,
        },
      });
      userParts.push({
        text: `[Arquivo anexado: ${file.name} (${mimeType})]`,
      });
    }
  }

  if (userParts.length === 0) {
    userParts.push({ text: "Olá" });
  }

  const contents: any[] = [];

  // Incorporate recent conversation history to provide conversational memory
  if (history.length > 0) {
    const recentHistory = history.filter((h) => h.text && h.text.trim()).slice(-12);
    for (const h of recentHistory) {
      const geminiRole = h.role === "assistant" ? "model" : "user";
      const lastContent = contents[contents.length - 1];
      if (lastContent && lastContent.role === geminiRole) {
        lastContent.parts.push({ text: h.text });
      } else {
        contents.push({
          role: geminiRole,
          parts: [{ text: h.text }],
        });
      }
    }
  }

  const lastContent = contents[contents.length - 1];
  if (lastContent && lastContent.role === "user") {
    lastContent.parts.push(...userParts);
  } else {
    contents.push({ role: "user", parts: userParts });
  }

  const activities: ActivityItem[] = [];

  onEvent?.({ type: "status", message: "Iniciando análise com a IA..." });

  for (let iteration = 0; iteration < 20; iteration += 1) {
    onEvent?.({
      type: "status",
      message: iteration === 0 ? "Consultando modelo..." : `Analisando próximos passos (etapa ${iteration + 1})...`,
    });

    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: instructions,
        tools,
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      const finalText = response.text ?? "";
      onEvent?.({ type: "done", text: finalText, activities });
      return { text: finalText, activities };
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const responseParts: any[] = [];
    for (const call of calls) {
      const toolName = call.name ?? "unknown";
      const toolArgs = call.args ?? {};
      const activityId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const description = formatToolDescription(toolName, toolArgs);

      const activity: ActivityItem = {
        id: activityId,
        tool: toolName,
        args: toolArgs,
        status: "running",
        description,
        startTime: Date.now(),
      };

      activities.push(activity);
      onEvent?.({ type: "tool_start", activity: { ...activity } });

      let result: unknown;
      let isError = false;

      try {
        result = await executeTool(toolName, toolArgs);
        activity.status = "success";
        activity.result = result;
      } catch (error) {
        isError = true;
        const errObj = { error: error instanceof Error ? error.message : String(error) };
        result = errObj;
        activity.status = "error";
        activity.result = errObj;
      } finally {
        activity.endTime = Date.now();
        onEvent?.({ type: "tool_end", activity: { ...activity } });
      }

      responseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: { result },
        },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  const errMessage = "O agente excedeu o limite máximo de iterações de ferramentas.";
  onEvent?.({ type: "error", message: errMessage });
  throw new Error(errMessage);
}
