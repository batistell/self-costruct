import OpenAI from "openai";
import { deleteGithubFile, listGithubFiles, readGithubFile, writeGithubFile } from "./github.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL ?? "gpt-5.6";
const supervisorUrl = process.env.SUPERVISOR_URL ?? "http://127.0.0.1:3002";

const tools: any[] = [
  {
    type: "function",
    name: "github_list_files",
    description: "List files/directories directly from the GitHub repository. GitHub is the source of truth.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "Repository directory path; empty string means root." } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "github_read_file",
    description: "Read a UTF-8 source file directly from GitHub.",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
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
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "github_delete_file",
    description: "Delete a file directly on GitHub. This creates a commit and returns its SHA.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        message: { type: "string" },
      },
      required: ["path", "message"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "deploy_commit",
    description: "Tell the local Self Construct supervisor to deploy an exact GitHub commit SHA. Call this after the final GitHub edit for a requested change.",
    parameters: {
      type: "object",
      properties: { sha: { type: "string", description: "40-character Git commit SHA returned by a GitHub write/delete tool." } },
      required: ["sha"],
      additionalProperties: false,
    },
  },
];

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

export async function runAgent(message: string) {
  let response = await client.responses.create({
    model,
    instructions,
    input: message,
    tools,
  });

  const activities: Array<{ tool: string; result: unknown }> = [];

  for (let iteration = 0; iteration < 20; iteration += 1) {
    const calls = response.output.filter((item: any) => item.type === "function_call") as any[];
    if (calls.length === 0) return { text: response.output_text, activities, responseId: response.id };

    const outputs = [];
    for (const call of calls) {
      try {
        const args = JSON.parse(call.arguments || "{}");
        const result = await executeTool(call.name, args);
        activities.push({ tool: call.name, result });
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      } catch (error) {
        const result = { error: error instanceof Error ? error.message : String(error) };
        activities.push({ tool: call.name, result });
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
    }

    response = await client.responses.create({
      model,
      instructions,
      previous_response_id: response.id,
      input: outputs as any,
      tools,
    });
  }

  throw new Error("Agent exceeded the tool-call iteration limit");
}
