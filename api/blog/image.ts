import { requireCaller } from "../_lib/auth.js";
import { IMAGES_DIR, readRaw, writeFile } from "../_lib/github.js";
import { handle, HttpError, json, readJson } from "../_lib/http.js";
import { slugify } from "../../shared/blog.js";

// SVG is intentionally excluded: it can carry script.
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const CONTENT_TYPES = Object.fromEntries(Object.entries(TYPES).map(([type, ext]) => [ext, type]));
// Vercel caps request bodies at 4.5 MB and base64 adds a third on top.
const MAX_BYTES = 3 * 1024 * 1024;

// POST /api/blog/image { filename, contentType, data (base64) } -> { url }
export function POST(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team", "member"]);
    const { filename = "image", contentType = "", data = "" } = await readJson<{
      filename?: string;
      contentType?: string;
      data?: string;
    }>(request);

    const ext = TYPES[contentType];
    if (!ext) throw new HttpError(400, "Use a PNG, JPEG, WebP or GIF image.");
    const bytes = Buffer.from(data, "base64");
    if (!bytes.length) throw new HttpError(400, "Empty image.");
    if (bytes.length > MAX_BYTES) throw new HttpError(413, "Images must be under 3 MB.");

    const base = slugify(filename.replace(/\.[^.]+$/, "")).slice(0, 40) || "image";
    const name = `${Date.now().toString(36)}-${base}.${ext}`;
    await writeFile(`${IMAGES_DIR}/${name}`, bytes, `Upload ${name} by ${caller.username}`);
    return json({ url: `/articles/images/${name}` });
  });
}

// GET /articles/images/<name> (rewritten to ?name=) -> the image, proxied from
// the private repo. Names are content-addressed by timestamp, so cache hard.
export function GET(request: Request) {
  return handle(async () => {
    const name = new URL(request.url).searchParams.get("name") ?? "";
    const ext = name.split(".").pop() ?? "";
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(name) || !CONTENT_TYPES[ext]) throw new HttpError(404, "Not found.");

    const upstream = await readRaw(`${IMAGES_DIR}/${name}`);
    if (!upstream) throw new HttpError(404, "Not found.");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
