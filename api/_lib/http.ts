export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

/** Runs a handler and converts thrown HttpErrors into JSON error responses. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, { status: err.status });
    console.error(err);
    // Only expose the cause outside production, so it shows up in the editor while developing.
    const detail = process.env.NODE_ENV !== "production" && err instanceof Error ? `: ${err.message}` : ".";
    return json({ error: `Something went wrong${detail}` }, { status: 500 });
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new HttpError(500, `Server is missing ${name}.`);
  return value;
}
