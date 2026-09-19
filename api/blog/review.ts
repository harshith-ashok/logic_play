import { isValidSlug } from "../../shared/blog.js";
import { stringifyPost } from "../../shared/frontmatter.js";
import { requireCaller } from "../_lib/auth.js";
import { writeFile } from "../_lib/github.js";
import { handle, HttpError, json, readJson } from "../_lib/http.js";
import { articlePath, loadPost } from "../_lib/posts.js";

// POST /api/blog/review { slug, decision: "approve" | "reject" } (core team)
// approve -> published (dated today); reject -> back to the author as a draft.
export function POST(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team"]);
    const { slug = "", decision } = await readJson<{ slug?: string; decision?: string }>(request);
    if (decision !== "approve" && decision !== "reject") throw new HttpError(400, "Unknown decision.");

    const found = isValidSlug(slug) ? await loadPost(slug) : null;
    if (!found) throw new HttpError(404, "Post not found.");
    if (found.post.status !== "pending") throw new HttpError(409, "This post isn't awaiting review.");

    const { body, excerpt: _e, readingMinutes: _r, ...meta } = found.post;
    const approved = decision === "approve";
    const next = {
      ...meta,
      status: approved ? ("published" as const) : ("draft" as const),
      date: approved ? new Date().toISOString().slice(0, 10) : meta.date,
    };
    await writeFile(
      articlePath(slug),
      stringifyPost(next, body),
      `${approved ? "Approve" : "Send back"} "${slug}" by ${caller.username}`,
      found.sha,
    );
    return json({ slug, status: next.status });
  });
}
