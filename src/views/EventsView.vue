<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import HackathonCard from "../components/hackathon/HackathonCard.vue";
import EventEditor from "../components/club/EventEditor.vue";
import { useIsAdmin } from "../composables/useIsAdmin";
import { listEvents, participantCounts } from "../lib/club/api";
import type { ClubEvent } from "../lib/club/types";

const isAdmin = useIsAdmin();

const events = ref<ClubEvent[]>([]);
const counts = ref<Record<string, number>>({});
const loading = ref(true);
const error = ref("");

async function load() {
  try {
    [events.value, counts.value] = await Promise.all([listEvents(), participantCounts()]);
    error.value = "";
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

// An event counts as upcoming until it has ended (or, with no end, until it starts).
const endOf = (e: ClubEvent) => new Date(e.ends_at ?? e.starts_at).getTime();
const now = ref(Date.now());
const upcoming = computed(() =>
  events.value.filter((e) => endOf(e) >= now.value).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
);
const past = computed(() =>
  events.value.filter((e) => endOf(e) < now.value).sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at)),
);

const tab = ref<"upcoming" | "past">("upcoming");
const list = computed(() => (tab.value === "upcoming" ? upcoming.value : past.value));

const day = (e: ClubEvent) => String(new Date(e.starts_at).getDate()).padStart(2, "0");
const month = (e: ClubEvent) => new Date(e.starts_at).toLocaleString("en-US", { month: "short" }).toUpperCase();
const time = (e: ClubEvent) =>
  new Date(e.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// ---- countdown to the next published upcoming event ----
const next = computed(() => upcoming.value.find((e) => e.published && new Date(e.starts_at).getTime() > now.value) ?? null);
const left = ref({ d: "00", h: "00", m: "00", s: "00" });
let timer: number | undefined;

function tick() {
  now.value = Date.now();
  if (!next.value) return;
  const diff = Math.max(0, new Date(next.value.starts_at).getTime() - now.value);
  const p = (n: number) => String(n).padStart(2, "0");
  left.value = {
    d: p(Math.floor(diff / 86400000)),
    h: p(Math.floor((diff % 86400000) / 3600000)),
    m: p(Math.floor((diff % 3600000) / 60000)),
    s: p(Math.floor((diff % 60000) / 1000)),
  };
}

// ---- admin editor ----
const editing = ref<ClubEvent | null>(null);
const creating = ref(false);
function onSaved() {
  editing.value = null;
  creating.value = false;
  load();
}

onMounted(() => {
  load();
  tick();
  timer = window.setInterval(tick, 1000);
});
onBeforeUnmount(() => window.clearInterval(timer));
</script>

<template>
  <div>
    <div class="wrap page-hero">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="eyebrow">CALENDAR</div>
          <h1 class="page-title">Events</h1>
          <p class="page-sub">Workshops, hackathons, and build sessions — upcoming and past.</p>
        </div>
        <button v-if="isAdmin" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="creating = true">
          <Badge as="span" tone="solid" size="md" interactive arrow>New event</Badge>
        </button>
      </div>

      <div
        v-if="next"
        class="card mt-8 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 md:mt-9"
      >
        <div class="min-w-0">
          <div class="label">Next up in</div>
          <div class="font-display mt-1 truncate text-xl">{{ next.title }}</div>
        </div>
        <div class="flex gap-5 font-mono" role="timer" :aria-label="`Time until ${next.title}`">
          <div v-for="u in [['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']]" :key="u[0]" class="text-center">
            <b class="block text-[1.6rem] font-bold tabular-nums sm:text-[1.7rem]">{{ left[u[0] as 'd' | 'h' | 'm' | 's'] }}</b>
            <span class="text-[10px] tracking-widest text-fg-subtle uppercase">{{ u[1] }}</span>
          </div>
        </div>
      </div>

      <HackathonCard />

      <div v-if="events.length" class="mt-10 flex gap-1 border-b border-border md:mt-12" role="tablist">
        <button
          v-for="t in (['upcoming', 'past'] as const)"
          :key="t"
          type="button"
          role="tab"
          :aria-selected="tab === t"
          class="relative min-h-11 cursor-pointer border-none bg-transparent px-2 pr-4 font-mono text-[12.5px] font-semibold tracking-wide uppercase transition-colors duration-200"
          :class="tab === t ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'"
          @click="tab = t"
        >
          {{ t }} <span class="text-fg-subtle">({{ t === "upcoming" ? upcoming.length : past.length }})</span>
          <span
            class="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent transition-transform duration-300"
            :class="tab === t ? 'scale-x-100' : 'scale-x-0'"
          />
        </button>
      </div>
    </div>

    <div class="wrap pb-16 md:pb-24">
      <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>
      <p v-else-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>

      <div v-else-if="events.length === 0" class="empty-state">
        No events yet &mdash; first drop coming soon.
      </div>

      <div v-else-if="list.length === 0" class="empty-state">
        {{ tab === "upcoming" ? "Nothing scheduled right now — check back soon." : "No past events yet." }}
      </div>

      <div v-else class="flex flex-col border border-border">
        <article
          v-for="e in list"
          :key="e.id"
          class="group relative grid grid-cols-[64px_1fr] items-start gap-x-5 gap-y-4 border-b border-border bg-bg p-5 transition-[background-color,padding] duration-300 last:border-b-0 hover:bg-bg-elevated sm:grid-cols-[88px_1fr_auto] sm:items-center sm:gap-x-7 sm:p-7 md:hover:pl-9"
        >
          <span class="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-400 group-hover:scale-y-100" aria-hidden="true" />

          <div class="border border-border-strong px-1 py-2.5 text-center font-mono">
            <span class="block text-[1.5rem] leading-none font-bold">{{ day(e) }}</span>
            <span class="mt-1 block text-[10.5px] tracking-widest text-fg-subtle">{{ month(e) }}</span>
          </div>

          <div class="min-w-0">
            <div class="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-wider uppercase">
              <span v-if="e.tag" :class="tab === 'past' ? 'text-fg-subtle' : 'text-accent'">{{ e.tag }}</span>
              <span v-if="!e.published" class="border border-accent px-1.5 py-0.5 text-accent">Draft</span>
            </div>
            <h3 class="font-display mb-1.5 text-xl">
              <router-link :to="`/events/${e.slug}`" class="after:absolute after:inset-0 after:content-['']">{{ e.title }}</router-link>
            </h3>
            <p v-if="e.summary" class="max-w-[56ch] text-sm text-fg-muted">{{ e.summary }}</p>
            <div class="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[11.5px] text-fg-subtle uppercase">
              <span>{{ time(e) }}</span>
              <span v-if="e.location">{{ e.location }}</span>
              <span v-if="counts[e.id]">{{ counts[e.id] }} participants</span>
            </div>
            <img
              v-if="e.cover_url"
              :src="e.cover_url"
              :alt="e.title"
              loading="lazy"
              decoding="async"
              width="640"
              height="360"
              class="mt-4 aspect-video w-full max-w-md border border-border object-cover"
              :class="tab === 'past' && 'grayscale'"
            />
          </div>

          <div class="relative z-10 col-span-full flex flex-wrap gap-2 sm:col-span-1 sm:flex-col sm:items-stretch">
            <Badge v-if="e.rsvp_link && tab === 'upcoming'" :href="e.rsvp_link" target="_blank" size="sm" interactive arrow>RSVP</Badge>
            <button v-if="isAdmin" type="button" class="cursor-pointer border-none bg-transparent p-0 text-left" @click="editing = e">
              <Badge as="span" size="sm" interactive class="w-full">Edit</Badge>
            </button>
          </div>
        </article>
      </div>
    </div>

    <EventEditor v-if="creating || editing" :event="editing" @close="creating = false; editing = null" @saved="onSaved" />
  </div>
</template>
