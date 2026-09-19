import { PUBLIC_ROUTES } from "../shared/site.js";
import { escapeHtml } from "../shared/markdown.js";
import { loadAllPosts } from "./_lib/posts.js";

// /sitemap.xml is rewritten here so new posts show up without a redeploy.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const entries = PUBLIC_ROUTES.map((path) => ({ loc: `${origin}${path === "/" ? "" : path}`, lastmod: "" }));

  try {
    for (const post of await loadAllPosts()) {
      if (post.status === "published") entries.push({ loc: `${origin}/blog/${post.slug}`, lastmod: post.date });
    }
  } catch (err) {
    console.error(err); // still serve the static routes if the article store is down
  }

  const urls = entries
    .map((e) => `  <url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`)
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
