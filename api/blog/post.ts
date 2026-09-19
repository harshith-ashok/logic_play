import { isValidSlug, slugify, type Post, type PostMeta } from "../../shared/blog.js";
import { stringifyPost } from "../../shared/frontmatter.js";
import { getCaller, requireCaller } from "../_lib/auth.js";
import { deleteFile, readFile, writeFile } from "../_lib/github.js";
import { handle, HttpError, json, readJson } from "../_lib/http.js";
import { articlePath, canManage, loadPost, nextStatus, type SaveAction } from "../_lib/posts.js";

const MAX_BODY = 100_000;
const today = () => new Date().toISOString().slice(0, 10);

interface SaveInput {
  /** Set when editing an existing post; the slug never changes after creation. */
  slug?: string;
  title?: string;
  body?: string;
  cover?: string;
  tags?: string[];
  action?: SaveAction;
}

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags.map((t) => slugify(String(t)).slice(0, 24)).filter(Boolean);
  return [...new Set(cleaned)].slice(0, 8);
}

function cleanCover(cover: unknown): string {
  const value = typeof cover === "string" ? cover.trim() : "";
  if (value && !/^(https:\/\/|\/articles\/)/.test(value)) {
    throw new HttpError(400, "Cover must be an https URL or an uploaded image.");
  }
  return value;
}

async function freeSlug(title: string): Promise<string> {
  const base = slugify(title).slice(0, 80).replace(/-$/, "");
  if (!isValidSlug(base)) throw new HttpError(400, "Give the post a title with letters or numbers.");
  for (let n = 1; n <= 20; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (isValidSlug(candidate) && !(await readFile(articlePath(candidate)))) return candidate;
  }
  throw new HttpError(409, "Could not find a free URL for this title.");
}

// GET /api/blog/post?slug=  -> published post (public); other statuses only
// for the author or core team.
export function GET(request: Request) {
  return handle(async () => {
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    if (!isValidSlug(slug)) throw new HttpError(404, "Post not found.");

    const found = await loadPost(slug);
    if (!found) throw new HttpError(404, "Post not found.");

    if (found.post.status === "published") {
      return json(found.post, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    }
    const caller = await getCaller(request);
    if (!caller || !canManage(caller, found.post)) throw new HttpError(404, "Post not found.");
    return json(found.post);
  });
}

// POST /api/blog/post -> create or update
export function POST(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team", "member"]);
    const input = await readJson<SaveInput>(request);

    const title = input.title?.trim() ?? "";
    const body = input.body?.trim() ?? "";
    const action = input.action ?? "save";
    if (!title || title.length > 120) throw new HttpError(400, "Title is required (max 120 characters).");
    if (action !== "save" && !body) throw new HttpError(400, "Write something before submitting.");
    if (body.length > MAX_BODY) throw new HttpError(400, "Post is too long.");

    let existing: { post: Post; sha: string } | null = null;
    if (input.slug) {
      existing = await loadPost(input.slug);
      if (!existing) throw new HttpError(404, "Post not found.");
      if (!canManage(caller, existing.post)) throw new HttpError(403, "This isn't your post.");
    }

    const status = nextStatus(caller, existing?.post.status ?? null, action);
    if (!status) throw new HttpError(403, "Only the core team can publish directly.");

    const goingLive = status === "published" && existing?.post.status !== "published";
    const meta: PostMeta = {
      title,
      slug: existing?.post.slug ?? (await freeSlug(title)),
      author: existing?.post.author ?? caller.username,
      date: goingLive || !existing ? today() : existing.post.date,
      cover: cleanCover(input.cover),
      tags: cleanTags(input.tags),
      status,
    };

    await writeFile(
      articlePath(meta.slug),
      stringifyPost(meta, body),
      `${existing ? "Update" : "Add"} "${meta.slug}" (${status}) by ${caller.username}`,
      existing?.sha,
    );
    return json({ slug: meta.slug, status });
  });
}

// DELETE /api/blog/post?slug=  -> authors can delete their own unpublished
// posts; only core team can delete published ones.
export function DELETE(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team", "member"]);
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    const found = isValidSlug(slug) ? await loadPost(slug) : null;
    if (!found) throw new HttpError(404, "Post not found.");
    if (!canManage(caller, found.post)) throw new HttpError(403, "This isn't your post.");
    if (found.post.status === "published" && caller.role !== "core_team") {
      throw new HttpError(403, "Ask the core team to take down a published post.");
    }
    await deleteFile(articlePath(slug), found.sha, `Delete "${slug}" by ${caller.username}`);
    return json({ ok: true });
  });
}
