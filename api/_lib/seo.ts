import { escapeHtml } from "../../shared/markdown.js";

// Small helpers for rewriting the built index.html <head> per URL, so crawlers
// that don't run JavaScript (and link unfurlers) see real metadata.

function setTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n</head>`);
}

export interface PageSeo {
  title: string;
  description: string;
  url: string;
  type: "website" | "article";
  image?: string;
  jsonLd?: unknown;
  noindex?: boolean;
  /** Pre-rendered, already-safe HTML placed inside #app until Vue mounts. */
  content?: string;
}

export function applySeo(shell: string, seo: PageSeo): string {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const url = escapeHtml(seo.url);
  let html = shell;

  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = setTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${title}" />`);
  html = setTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta property="og:type"[^>]*\/>/, `<meta property="og:type" content="${seo.type}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = setTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${description}" />`);

  const extra: string[] = [];
  if (seo.image) {
    const image = escapeHtml(seo.image);
    extra.push(`<meta property="og:image" content="${image}" />`, `<meta name="twitter:image" content="${image}" />`);
    html = html.replace(/<meta name="twitter:card"[^>]*\/>/, `<meta name="twitter:card" content="summary_large_image" />`);
  }
  if (seo.noindex) extra.push(`<meta name="robots" content="noindex, nofollow" />`);
  if (seo.jsonLd) {
    // "<" escaped so a title containing "</script>" can't break out.
    const data = JSON.stringify(seo.jsonLd).replace(/</g, "\\u003c");
    extra.push(`<script type="application/ld+json" data-page-jsonld>${data}</script>`);
  }
  if (extra.length) html = html.replace("</head>", `${extra.join("\n")}\n</head>`);
  if (seo.content) html = html.replace('<div id="app"></div>', `<div id="app">${seo.content}</div>`);
  return html;
}
