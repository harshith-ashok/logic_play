import type { PostSummary } from "../../shared/blog.js";
import { requireCaller } from "../_lib/auth.js";
import { handle, HttpError, json } from "../_lib/http.js";
import { loadAllPosts } from "../_lib/posts.js";

const summarize = ({ body: _body, ...summary }: PostSummary & { body: string }): PostSummary => summary;
const newestFirst = (a: PostSummary, b: PostSummary) => b.date.localeCompare(a.date);

// GET /api/blog/posts                 -> published posts (public, CDN-cached)
// GET /api/blog/posts?scope=mine      -> the caller's posts, any status
// GET /api/blog/posts?scope=review    -> pending posts awaiting approval (core team)
export function GET(request: Request) {
  return handle(async () => {
    const scope = new URL(request.url).searchParams.get("scope");
    const posts = await loadAllPosts();

    if (!scope) {
      const published = posts.filter((p) => p.status === "published").map(summarize).sort(newestFirst);
      return json(published, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    }

    if (scope === "mine") {
      const caller = await requireCaller(request, ["core_team", "member"]);
      return json(posts.filter((p) => p.author === caller.username).map(summarize).sort(newestFirst));
    }

    if (scope === "review") {
      await requireCaller(request, ["core_team"]);
      return json(posts.filter((p) => p.status === "pending").map(summarize).sort(newestFirst));
    }

    throw new HttpError(400, "Unknown scope.");
  });
}
