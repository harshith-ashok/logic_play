import type { Router } from "vue-router";

const DEFAULT_TITLE = "Logic Play — Stop consuming technology, start building it.";
const DEFAULT_DESCRIPTION =
  "Logic Play — the underdog builder's club at SRM. Ship real projects, form hackathon teams, get mentored by people who've actually done it.";

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    const [, key, val] = selector.match(/\[([\w:]+)="([^"]+)"\]/) ?? [];
    if (key) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

/** Syncs <title>, description, canonical, OG/Twitter and robots for the current page. */
export function setPageSeo({ title, description, path, type = "website", image, noindex }: PageSeo) {
  const url = `${window.location.origin}${path}`;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:type"]', "content", type);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:card"]', "content", image ? "summary_large_image" : "summary");

  if (image) {
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[name="twitter:image"]', "content", image);
  } else {
    removeMeta('meta[property="og:image"]');
    removeMeta('meta[name="twitter:image"]');
  }

  if (noindex) setMeta('meta[name="robots"]', "content", "noindex, nofollow");
  else removeMeta('meta[name="robots"]');
}

/** Per-page structured data (e.g. a blog post's BlogPosting); replaces any previous one. */
export function setJsonLd(data: unknown) {
  clearJsonLd();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.pageJsonld = "";
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  document.head.appendChild(script);
}

export function clearJsonLd() {
  document.head.querySelector("script[data-page-jsonld]")?.remove();
}

// Keeps page metadata in sync with the active route's `meta` (see
// src/router/index.ts). Wired once from the router. Pages with dynamic content
// (blog posts) call setPageSeo again once their data has loaded.
export function useRouteSeo(router: Router) {
  router.afterEach((to) => {
    clearJsonLd();
    setPageSeo({
      title: to.meta.title ?? DEFAULT_TITLE,
      description: to.meta.description ?? DEFAULT_DESCRIPTION,
      path: to.path,
      noindex: to.meta.noindex,
    });
  });
}
