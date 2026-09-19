import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// Absolute site origin for OG/JSON-LD tags and robots.txt. Resolution order:
// VITE_SITE_URL (env var or .env file, e.g. a custom domain) -> Vercel's
// production domain (set automatically on Vercel builds) -> the local dev
// server. (sitemap.xml is served by api/sitemap.ts so it can include posts.)
function resolveSiteUrl(mode: string): string {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const url =
    env.VITE_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (!url && env.VERCEL) {
    console.warn(
      "\n[seo] No site URL on a Vercel build. Set VITE_SITE_URL, or enable " +
        '"Automatically expose System Environment Variables" in Vercel project settings.\n',
    );
  }
  return (url || "http://localhost:5173").replace(/\/$/, "");
}

function robotsTxt(siteUrl: string): Plugin {
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

export default defineConfig(({ mode }) => {
  const siteUrl = resolveSiteUrl(mode);
  // index.html reads this as %VITE_SITE_URL%.
  process.env.VITE_SITE_URL = siteUrl;
  return { plugins: [vue(), tailwindcss(), robotsTxt(siteUrl), devApi()] };
});
