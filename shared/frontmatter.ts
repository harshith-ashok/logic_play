import type { PostMeta, PostStatus } from "./blog.js";

// Minimal reader/writer for the fixed front-matter shape in TODO.md. Values
// are JSON-quoted strings (valid YAML), tags a `- item` list — no YAML
// dependency needed for a schema this small.

const STATUSES: PostStatus[] = ["draft", "pending", "published"];

export function parsePost(source: string): { meta: PostMeta; body: string } | null {
  const match = source.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const fields: Record<string, string> = {};
  const tags: string[] = [];
  let inTags = false;

  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (inTags && item) {
      tags.push(unquote(item[1]));
      continue;
    }
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (!pair) continue;
    inTags = pair[1] === "tags";
    if (!inTags) fields[pair[1]] = unquote(pair[2]);
  }

  if (!fields.slug || !fields.title) return null;
  const status = STATUSES.includes(fields.status as PostStatus)
    ? (fields.status as PostStatus)
    : "published";

  return {
    meta: {
      title: fields.title,
      slug: fields.slug,
      author: fields.author ?? "",
      date: fields.date ?? "",
      cover: fields.cover ?? "",
      tags,
      status,
    },
    body: match[2].replace(/^\n+/, ""),
  };
}

export function stringifyPost(meta: PostMeta, body: string): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(meta.title)}`,
    `slug: ${JSON.stringify(meta.slug)}`,
    `author: ${JSON.stringify(meta.author)}`,
    `date: ${JSON.stringify(meta.date)}`,
    `cover: ${JSON.stringify(meta.cover)}`,
    `status: ${JSON.stringify(meta.status)}`,
    "tags:",
    ...meta.tags.map((tag) => `  - ${JSON.stringify(tag)}`),
    "---",
    "",
    body.trim(),
    "",
  ];
  return lines.join("\n");
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      /* fall through to the raw value */
    }
  }
  return trimmed.replace(/^'(.*)'$/, "$1");
}
