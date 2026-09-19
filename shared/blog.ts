// Types and pure helpers shared by the Vue app (src/) and the serverless
// blog API (api/). Kept dependency-free so both sides can import it.

export type PostStatus = "draft" | "pending" | "published";

export interface PostMeta {
  title: string;
  slug: string;
  /** Profile username of the author. */
  author: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  cover: string;
  tags: string[];
  status: PostStatus;
}

export interface PostSummary extends PostMeta {
  excerpt: string;
  readingMinutes: number;
}

export interface Post extends PostSummary {
  body: string;
}

/** Paths under /blog that are app pages, so a post can never claim them. */
export const RESERVED_SLUGS = ["write", "edit", "dashboard"];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.includes(slug);
}

/** Plain-text teaser: markdown syntax stripped, cut on a word boundary. */
export function makeExcerpt(markdown: string, max = 180): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
