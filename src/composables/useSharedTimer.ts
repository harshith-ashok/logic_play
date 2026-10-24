import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";
import { getSupabase } from "../lib/supabase";

export interface SharedTimer {
  slug: string;
  title: string;
  started_at: string;
  ends_at: string;
  paused_remaining_ms: number | null;
  updated_at: string;
}

const COLUMNS = "slug, title, started_at, ends_at, paused_remaining_ms, updated_at";
const POLL_MS = 30_000;

/**
 * One shared countdown, read from the `timers` table. Every open page sees the
 * same clock: end times are absolute, the device clock is corrected against the
 * database's `now()`, and changes arrive over Realtime (with a slow poll as a
 * fallback if the socket drops).
 */
export function useSharedTimer(slug: Ref<string | undefined>) {
  const timer = ref<SharedTimer | null>(null);
  const loading = ref(true);
  const error = ref("");

  // serverTime - deviceTime, in ms.
  const offset = ref(0);
  const now = ref(Date.now());
  const serverNow = () => Date.now() + offset.value;

  async function syncClock() {
    const client = getSupabase();
    if (!client) return;
    const t0 = Date.now();
    const { data, error: e } = await client.rpc("server_now");
    const t1 = Date.now();
    if (e || !data) return;
    // Assume the reply took half the round trip to come back.
    offset.value = new Date(data as string).getTime() - (t0 + t1) / 2;
  }

  async function load() {
    const client = getSupabase();
    if (!client) {
      error.value = "Timer is not available right now.";
      loading.value = false;
      return;
    }
    let q = client.from("timers").select(COLUMNS);
    q = slug.value ? q.eq("slug", slug.value) : q.order("updated_at", { ascending: false }).limit(1);
    const { data, error: e } = await q.maybeSingle();
    if (e) error.value = "Could not load the timer.";
    else {
      error.value = "";
      timer.value = (data as SharedTimer) ?? null;
    }
    loading.value = false;
  }

  let channel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null = null;
  function subscribe() {
    const client = getSupabase();
    if (!client) return;
    if (channel) client.removeChannel(channel);
    channel = client
      .channel(`timer-${slug.value ?? "latest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "timers" }, load)
      .subscribe();
  }

  const tick = window.setInterval(() => (now.value = Date.now()), 250);
  const poll = window.setInterval(() => {
    syncClock();
    load();
  }, POLL_MS);
  // Coming back to a backgrounded tab: don't wait for the next poll.
  const onVisible = () => {
    if (!document.hidden) {
      syncClock();
      load();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  watch(
    slug,
    () => {
      loading.value = true;
      syncClock().then(load);
      subscribe();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    window.clearInterval(tick);
    window.clearInterval(poll);
    document.removeEventListener("visibilitychange", onVisible);
    const client = getSupabase();
    if (client && channel) client.removeChannel(channel);
  });

  const paused = computed(() => timer.value?.paused_remaining_ms != null);
  const remaining = computed(() => {
    const t = timer.value;
    if (!t) return 0;
    if (t.paused_remaining_ms != null) return t.paused_remaining_ms;
    // `now` is the 250ms render tick; add the offset so all devices agree.
    return Math.max(0, new Date(t.ends_at).getTime() - (now.value + offset.value));
  });
  const total = computed(() =>
    timer.value ? new Date(timer.value.ends_at).getTime() - new Date(timer.value.started_at).getTime() : 0,
  );
  const progress = computed(() => (total.value > 0 ? Math.min(1, Math.max(0, 1 - remaining.value / total.value)) : null));
  const finished = computed(() => !!timer.value && !paused.value && remaining.value === 0);

  // ---- admin writes (RLS rejects anyone who isn't core_team) ----
  async function write(fn: (c: NonNullable<ReturnType<typeof getSupabase>>) => PromiseLike<{ error: { message: string } | null }>) {
    const client = getSupabase();
    if (!client) return "Timer is not available right now.";
    const { error: e } = await fn(client);
    if (e) return e.message;
    await load();
    return "";
  }

  const create = (newSlug: string, title: string, durationMs: number, endsAtMs?: number) =>
    write((c) => {
      const startMs = serverNow();
      return c.from("timers").upsert({
        slug: newSlug,
        title,
        started_at: new Date(startMs).toISOString(),
        ends_at: new Date(endsAtMs ?? startMs + durationMs).toISOString(),
        paused_remaining_ms: null,
      });
    });

  const pause = () =>
    write((c) =>
      c
        .from("timers")
        .update({
          paused_remaining_ms: Math.round(remaining.value),
          ends_at: new Date(serverNow() + remaining.value).toISOString(),
        })
        .eq("slug", timer.value!.slug),
    );

  const resume = () =>
    write((c) =>
      c
        .from("timers")
        .update({ paused_remaining_ms: null, ends_at: new Date(serverNow() + remaining.value).toISOString() })
        .eq("slug", timer.value!.slug),
    );

  const extend = (ms: number) =>
    write((c) => {
      const t = timer.value!;
      return c
        .from("timers")
        .update(
          t.paused_remaining_ms != null
            ? {
                paused_remaining_ms: Math.max(0, t.paused_remaining_ms + ms),
                ends_at: new Date(new Date(t.ends_at).getTime() + ms).toISOString(),
              }
            : // A finished timer extends from now, not from its long-past end.
              { ends_at: new Date(Math.max(new Date(t.ends_at).getTime(), serverNow()) + ms).toISOString() },
        )
        .eq("slug", t.slug);
    });

  const remove = () => write((c) => c.from("timers").delete().eq("slug", timer.value!.slug));

  return { timer, loading, error, now, remaining, progress, paused, finished, create, pause, resume, extend, remove };
}
