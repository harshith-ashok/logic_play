import { HttpError, requireEnv } from "./http.js";

// Articles live in a private GitHub repo (see TODO.md): `articles/<slug>.md`
// plus `articles/images/*`. The token stays server-side; the browser only ever
// talks to /api/blog/*.

const API = "https://api.github.com";
export const ARTICLES_DIR = "articles";
export const IMAGES_DIR = `${ARTICLES_DIR}/images`;

function config() {
  const repo = requireEnv("BLOG_REPO");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new HttpError(500, 'BLOG_REPO must look like "owner/name".');
  }
  return {
    token: requireEnv("GITHUB_TOKEN"),
    repo,
    branch: process.env.BLOG_BRANCH || "main",
  };
}

async function github(path: string, init: RequestInit = {}, accept = "application/vnd.github+json") {
  const { token } = config();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: accept,
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  return res;
}

async function fail(res: Response): Promise<never> {
  console.error("GitHub API error", res.status, res.url, await res.text().catch(() => ""));
  throw new HttpError(502, "Could not reach the article store.");
}

export interface RepoFile {
  path: string;
  text: string;
}

/** Every markdown article in one request (GraphQL), so listing isn't N+1. */
export async function readAllArticles(): Promise<RepoFile[]> {
  const { repo, branch } = config();
  const [owner, name] = repo.split("/");
  const query = `query($owner:String!,$name:String!,$expr:String!){
    repository(owner:$owner,name:$name){
      object(expression:$expr){
        ... on Tree { entries { name type object { ... on Blob { text } } } }
      }
    }
  }`;
  const res = await github("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables: { owner, name, expr: `${branch}:${ARTICLES_DIR}` } }),
  });
  if (!res.ok) await fail(res);
  const payload = (await res.json()) as {
    data?: { repository?: { object?: { entries: { name: string; type: string; object?: { text?: string } }[] } | null } };
  };
  const entries = payload.data?.repository?.object?.entries ?? [];
  return entries
    .filter((e) => e.type === "blob" && e.name.endsWith(".md") && e.object?.text)
    .map((e) => ({ path: `${ARTICLES_DIR}/${e.name}`, text: e.object!.text! }));
}

export async function readFile(path: string): Promise<{ text: string; sha: string } | null> {
  const { repo, branch } = config();
  const res = await github(`/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) await fail(res);
  const file = (await res.json()) as { content: string; sha: string };
  return { text: Buffer.from(file.content, "base64").toString("utf8"), sha: file.sha };
}

export async function readRaw(path: string): Promise<Response | null> {
  const { repo, branch } = config();
  const res = await github(
    `/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {},
    "application/vnd.github.raw+json",
  );
  if (res.status === 404) return null;
  if (!res.ok) await fail(res);
  return res;
}

export async function writeFile(path: string, content: Buffer | string, message: string, sha?: string) {
  const { repo, branch } = config();
  const bytes = typeof content === "string" ? Buffer.from(content, "utf8") : content;
  const res = await github(`/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: bytes.toString("base64"), branch, sha }),
  });
  if (res.status === 409 || res.status === 422) {
    throw new HttpError(409, "This post changed elsewhere. Reload and try again.");
  }
  if (!res.ok) await fail(res);
}

export async function deleteFile(path: string, sha: string, message: string) {
  const { repo, branch } = config();
  const res = await github(`/repos/${repo}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) await fail(res);
}
