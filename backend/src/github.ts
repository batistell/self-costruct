import { Octokit } from "@octokit/rest";
import { execFileSync } from "node:child_process";

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("GitHub authentication missing. Run: gh auth login");
  }
}

export const octokit = new Octokit({ auth: githubToken() });
export const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "batistell/self-costruct").split("/");
export const branch = process.env.GITHUB_BRANCH ?? "master";

if (!owner || !repo) throw new Error("GITHUB_REPOSITORY must use owner/repo format");

export async function readGithubFile(path: string) {
  const response = await octokit.repos.getContent({ owner, repo, path, ref: branch });
  if (Array.isArray(response.data) || response.data.type !== "file" || !("content" in response.data)) {
    throw new Error(`${path} is not a file`);
  }
  return Buffer.from(response.data.content, "base64").toString("utf8");
}

export async function listGithubFiles(path = "") {
  const response = await octokit.repos.getContent({ owner, repo, path, ref: branch });
  if (!Array.isArray(response.data)) return [{ path: response.data.path, type: response.data.type }];
  return response.data.map((item) => ({ path: item.path, type: item.type }));
}

export async function writeGithubFile(path: string, content: string, message: string) {
  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(existing.data) && existing.data.type === "file") sha = existing.data.sha;
  } catch (error: any) {
    if (error?.status !== 404) throw error;
  }

  const result = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    ...(sha ? { sha } : {}),
  });

  const commitSha = result.data.commit.sha;
  if (!commitSha) throw new Error("GitHub did not return a commit SHA");
  return commitSha;
}

export async function deleteGithubFile(path: string, message: string) {
  const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
  if (Array.isArray(existing.data) || existing.data.type !== "file") throw new Error(`${path} is not a file`);
  const result = await octokit.repos.deleteFile({ owner, repo, path, branch, message, sha: existing.data.sha });
  const commitSha = result.data.commit.sha;
  if (!commitSha) throw new Error("GitHub did not return a commit SHA");
  return commitSha;
}
