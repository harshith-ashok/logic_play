import { isValidSlug, RESERVED_SLUGS } from "../../shared/blog.js";
import { escapeHtml, renderMarkdown } from "../../shared/markdown.js";
import { applySeo } from "../_lib/seo.js";
import { loadPost } from "../_lib/posts.js";

// /blog/<slug> is rewritten here (see vercel.json): it serves the normal SPA
// shell with the post's real <title>, description, canonical, Open Graph tags,
// Article JSON-LD and readable HTML, then Vue mounts over it. Unknown or
// unpublished slugs get a 404 status so search engines drop them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  // The built SPA shell. If it can't be fetched (e.g. a protected preview
  // deployment), fail loudly instead of serving a broken page.
  const shellRes = await fetch(new URL("/index.html", url.origin)).catch(() => null);
  if (!shellRes?.ok) return new Response("Page temporarily unavailable.", { status: 503 });
  const shell = await shellRes.text();
  const headers = { "Content-Type": "text/html; charset=utf-8" };

  // App pages that live under /blog (editor, dashboard) get the plain shell.
  if (RESERVED_SLUGS.includes(slug)) {
    return new Response(shell, { headers });
  }

  let found = null;
  try {
    found = isValidSlug(slug) ? await loadPost(slug) : null;
  } catch (err) {
    console.error(err);
  }
  const post = found?.post.status === "published" ? found.post : null;
  if (!post) {
    const html = applySeo(shell, {
      title: "Post not found — Logic Play",
      description: "This post doesn't exist or isn't published.",
      url: `${url.origin}/blog`,
      type: "website",
      noindex: true,
    });
    return new Response(html, { status: 404, headers });
  }

  const postUrl = `${url.origin}/blog/${post.slug}`;
  const image = post.cover ? new URL(post.cover, url.origin).toString() : undefined;
  const html = applySeo(shell, {
    title: `${post.title} — Logic Play`,
    description: post.excerpt,
    url: postUrl,
    type: "article",
    image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      author: { "@type": "Person", name: post.author },
      publisher: { "@type": "Organization", name: "Logic Play" },
      mainEntityOfPage: postUrl,
      ...(image && { image }),
      keywords: post.tags.join(", "),
    },
    content: `<article><h1>${escapeHtml(post.title)}</h1>${renderMarkdown(post.body)}</article>`,
  });
  return new Response(html, {
    headers: { ...headers, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
