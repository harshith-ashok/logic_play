import { makeExcerpt, readingMinutes, type Post, type PostStatus } from "../../shared/blog.js";
import { parsePost } from "../../shared/frontmatter.js";
import type { Caller } from "./auth.js";
import { ARTICLES_DIR, readAllArticles, readFile } from "./github.js";

export type SaveAction = "save" | "submit" | "publish";

export const articlePath = (slug: string) => `${ARTICLES_DIR}/${slug}.md`;

export function toPost(source: string): Post | null {
  const parsed = parsePost(source);
  if (!parsed) return null;
  return {
    ...parsed.meta,
    body: parsed.body,
    excerpt: makeExcerpt(parsed.body),
    readingMinutes: readingMinutes(parsed.body),
  };
}

export async function loadAllPosts(): Promise<Post[]> {
  const files = await readAllArticles();
  return files.map((f) => toPost(f.text)).filter((p): p is Post => p !== null);
}

export async function loadPost(slug: string): Promise<{ post: Post; sha: string } | null> {
  const file = await readFile(articlePath(slug));
  const post = file && toPost(file.text);
  return file && post ? { post, sha: file.sha } : null;
}

export function canManage(caller: Caller, post: Post): boolean {
  return caller.role === "core_team" || post.author === caller.username;
}

/**
 * The approval workflow in one place. Core team publishes directly; members
 * can only draft or submit for review. A member editing a live post sends it
 * back to `pending`, so an unreviewed edit never goes public.
 */
export function nextStatus(
  caller: Caller,
  current: PostStatus | null,
  action: SaveAction,
): PostStatus | null {
  if (caller.role === "core_team") {
    if (action === "save") return current ?? "draft";
    return "published";
  }
  if (action === "publish") return null; // not allowed for members
  if (action === "submit") return "pending";
  return current === "pending" || current === "published" ? "pending" : "draft";
}
