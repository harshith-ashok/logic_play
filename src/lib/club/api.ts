// The only place the events/gallery pages talk to Supabase. Every function
// resolves with data or throws an Error with a message that is safe to show.
// Writes are rejected by RLS unless the caller is core_team.
import { getSupabase } from "../supabase";
import type { Album, ClubEvent, EventInput, Participant, Photo } from "./types";

const BUCKET = "club-media";

function db() {
  const c = getSupabase();
  if (!c) throw new Error("Supabase isn't configured (missing VITE_SUPABASE_* env vars).");
  return c;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
const check = (res: { error: { message: string } | null }) => {
  if (res.error) throw new Error(res.error.message);
};

// ---------- images ----------

/** Downscales in the browser so a 12MB phone photo doesn't hit storage or visitors. */
async function shrink(file: File, maxSide = 1800): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error(`Couldn't process ${file.name}.`);
  return blob;
}

export async function uploadImage(file: File, folder: "events" | "albums"): Promise<{ url: string; path: string }> {
  const blob = await shrink(file);
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const bucket = db().storage.from(BUCKET);
  check(await bucket.upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" }));
  return { url: bucket.getPublicUrl(path).data.publicUrl, path };
}

/** Best effort: a leftover file is harmless, so failures here don't surface. */
export async function removeFiles(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length) await db().storage.from(BUCKET).remove(list);
}

/** Storage path of one of our public URLs, or null for anything else. */
export function pathFromUrl(url: string | null): string | null {
  const m = url?.match(new RegExp(`/${BUCKET}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
}

// ---------- events ----------

export async function listEvents(): Promise<ClubEvent[]> {
  return unwrap(await db().from("club_events").select("*").order("starts_at", { ascending: true }));
}

export async function getEvent(slug: string): Promise<ClubEvent | null> {
  return unwrap(await db().from("club_events").select("*").eq("slug", slug).maybeSingle());
}

export async function saveEvent(id: string | null, input: EventInput): Promise<ClubEvent> {
  const q = id ? db().from("club_events").update(input).eq("id", id) : db().from("club_events").insert(input);
  return unwrap(await q.select().single());
}

export async function deleteEvent(ev: ClubEvent) {
  check(await db().from("club_events").delete().eq("id", ev.id));
  await removeFiles([pathFromUrl(ev.cover_url)]);
}

export async function listParticipants(eventId: string): Promise<Participant[]> {
  return unwrap(
    await db().from("event_participants").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
  );
}

export async function addParticipants(eventId: string, rows: { name: string; note: string | null }[]) {
  check(await db().from("event_participants").insert(rows.map((r) => ({ ...r, event_id: eventId }))));
}

export async function removeParticipant(id: string) {
  check(await db().from("event_participants").delete().eq("id", id));
}

/** Count of listed participants per event, for the events list. */
export async function participantCounts(): Promise<Record<string, number>> {
  const rows = unwrap(await db().from("event_participants").select("event_id")) as { event_id: string }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.event_id] = (out[r.event_id] ?? 0) + 1;
  return out;
}

// ---------- albums ----------

export async function listAlbums(): Promise<Album[]> {
  const albums = unwrap(
    await db().from("albums").select("*").order("album_date", { ascending: false, nullsFirst: false }),
  ) as Omit<Album, "cover" | "count">[];
  const photos = unwrap(
    await db().from("album_photos").select("album_id, url").order("created_at", { ascending: true }),
  ) as { album_id: string; url: string }[];
  const first = new Map<string, string>();
  const count = new Map<string, number>();
  for (const p of photos) {
    if (!first.has(p.album_id)) first.set(p.album_id, p.url);
    count.set(p.album_id, (count.get(p.album_id) ?? 0) + 1);
  }
  return albums.map((a) => ({ ...a, cover: first.get(a.id) ?? null, count: count.get(a.id) ?? 0 }));
}

export async function listPhotos(albumId: string): Promise<Photo[]> {
  return unwrap(await db().from("album_photos").select("*").eq("album_id", albumId).order("created_at", { ascending: true }));
}

export async function createAlbum(title: string, eventId: string | null, albumDate: string | null) {
  return unwrap(
    await db().from("albums").insert({ title, event_id: eventId, album_date: albumDate }).select().single(),
  ) as Omit<Album, "cover" | "count">;
}

export async function updateAlbum(id: string, patch: { title: string; event_id: string | null; album_date: string | null }) {
  check(await db().from("albums").update(patch).eq("id", id));
}

export async function deleteAlbum(id: string) {
  const photos = await listPhotos(id);
  check(await db().from("albums").delete().eq("id", id));
  await removeFiles(photos.map((p) => p.path));
}

export async function addPhotos(albumId: string, files: File[], onProgress?: (done: number) => void) {
  let done = 0;
  for (const f of files) {
    const { url, path } = await uploadImage(f, "albums");
    check(await db().from("album_photos").insert({ album_id: albumId, url, path }));
    onProgress?.(++done);
  }
}

export async function deletePhoto(p: Photo) {
  check(await db().from("album_photos").delete().eq("id", p.id));
  await removeFiles([p.path]);
}
