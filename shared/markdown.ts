import { Marked } from "marked";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";
import { slugify } from "./blog.js";

hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("yaml", yaml);

const ALIASES: Record<string, string> = {
  py: "python",
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  html: "xml",
  "c++": "cpp",
  yml: "yaml",
  md: "markdown",
};

/** Languages the post page can execute in the browser (see useCodeRunner.ts). */
export const RUNNABLE_LANGUAGES = ["python", "javascript"];

export function normalizeLanguage(lang: string | undefined): string {
  const name = (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
  return ALIASES[name] ?? name;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SAFE_URL = /^(https?:|mailto:|\/|#)/i;
const isSafeUrl = (url: string) => SAFE_URL.test(url.trim());

// Raw HTML in markdown is escaped rather than passed through, and links and
// images are limited to http(s)/relative URLs, so rendered output is safe to
// inject with v-html (client) or into the SEO shell (server) with no
// separate sanitizer.
const parser = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    code({ text, lang }) {
      const language = normalizeLanguage(lang);
      const known = hljs.getLanguage(language) !== undefined;
      const highlighted = known
        ? hljs.highlight(text, { language, ignoreIllegals: true }).value
        : escapeHtml(text);
      const runnable = RUNNABLE_LANGUAGES.includes(language) ? ' data-runnable="true"' : "";
      return `<pre class="code-block" data-lang="${escapeHtml(language || "text")}"${runnable}><code class="hljs">${highlighted}</code></pre>\n`;
    },
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const id = slugify(inner.replace(/<[^>]+>/g, ""));
      return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      if (!isSafeUrl(href)) return inner;
      const external = /^https?:/i.test(href);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(href)}"${titleAttr}${attrs}>${inner}</a>`;
    },
    image({ href, title, text }) {
      if (!isSafeUrl(href)) return escapeHtml(text);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" />`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return parser.parse(source, { async: false });
}
