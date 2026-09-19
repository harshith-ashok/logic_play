import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// Absolute site origin for canonical/OG tags and robots.txt. Set VITE_SITE_URL
// to override (e.g. a custom domain); on Vercel it falls back to the production
// domain, and locally to the dev server. (sitemap.xml is served by api/sitemap.ts
// so it can include blog posts.)
const siteUrl = (
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:5173")
).replace(/\/$/, "");
process.env.VITE_SITE_URL = siteUrl;

function robotsTxt(): Plugin {
  return {
    name: "robots-txt",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /account",
          "Disallow: /leaderboard",
          "Disallow: /events-attended",
          "Disallow: /blog/write",
          "Disallow: /blog/edit/",
          "Disallow: /blog/dashboard",
          "Disallow: /api/",
          "",
          `Sitemap: ${siteUrl}/sitemap.xml`,
          "",
        ].join("\n"),
      });
    },
  };
}

// `vite dev` doesn't run Vercel functions, so this serves api/*.ts locally with
// the same rewrites as vercel.json. Handlers are plain `GET(request: Request)`
// style exports, so the dev adapter is just Node req -> Request -> Response.
function devApi(): Plugin {
  const rewrites: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^\/sitemap\.xml$/, () => "/api/sitemap"],
    [/^\/articles\/images\/([^/]+)$/, (m) => `/api/blog/image?name=${m[1]}`],
  ];
  return {
    name: "dev-api",
    apply: "serve",
    configResolved(config) {
      for (const [key, value] of Object.entries(loadEnv(config.mode, config.root, ""))) {
        process.env[key] ??= value;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let target = req.url ?? "";
        for (const [pattern, to] of rewrites) {
          const match = target.split("?")[0].match(pattern);
          if (match) target = to(match);
        }
        if (!target.startsWith("/api/")) return next();

        const url = new URL(target, `http://${req.headers.host}`);
        try {
          const mod = await server.ssrLoadModule(`${url.pathname}.ts`);
          const handler = mod[req.method ?? "GET"];
          if (!handler) {
            res.statusCode = 405;
            return res.end("Method not allowed");
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");
          const response: Response = await handler(
            new Request(url, {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: hasBody ? Buffer.concat(chunks) : undefined,
            }),
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), robotsTxt(), devApi()],
});
