<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { events, type ClubEvent } from "../data/events";

const root = ref<HTMLElement | null>(null);
useScrollReveal(root, { selector: ".reveal-block", stagger: 0.06 });

const now = Date.now();
const upcoming = computed(() =>
  events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
);
const past = computed(() =>
  events
    .filter((e) => new Date(e.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);

const tab = ref<"upcoming" | "past">("upcoming");
const list = computed(() => (tab.value === "upcoming" ? upcoming.value : past.value));

const day = (e: ClubEvent) => String(new Date(e.date).getDate()).padStart(2, "0");
const month = (e: ClubEvent) => new Date(e.date).toLocaleString("en-US", { month: "short" }).toUpperCase();

// ---- countdown to the next upcoming event ----
const next = computed(() => upcoming.value[0] ?? null);
const left = ref({ d: "00", h: "00", m: "00", s: "00" });
let timer: number | undefined;

function tick() {
  if (!next.value) return;
  const diff = Math.max(0, new Date(next.value.date).getTime() - Date.now());
  const p = (n: number) => String(n).padStart(2, "0");
  left.value = {
    d: p(Math.floor(diff / 86400000)),
    h: p(Math.floor((diff % 86400000) / 3600000)),
    m: p(Math.floor((diff % 3600000) / 60000)),
    s: p(Math.floor((diff % 60000) / 1000)),
  };
}

onMounted(() => {
  tick();
  if (next.value) timer = window.setInterval(tick, 1000);
});
onBeforeUnmount(() => window.clearInterval(timer));
</script>

<template>
  <div ref="root">
    <div class="wrap page-hero">
      <div class="eyebrow">CALENDAR</div>
      <h1 class="page-title">Events</h1>
      <p class="page-sub">Workshops, hackathons, and build sessions — upcoming and past.</p>

      <div
        v-if="next"
        class="reveal-block card mt-8 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5 md:mt-9"
      >
        <div class="min-w-0">
          <div class="label">Next up in</div>
          <div class="mt-1 truncate text-xl font-semibold">{{ next.title }}</div>
        </div>
        <div class="flex gap-5 font-mono" role="timer" :aria-label="`Time until ${next.title}`">
          <div v-for="u in [['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']]" :key="u[0]" class="text-center">
            <b class="block text-[1.6rem] font-bold tabular-nums sm:text-[1.7rem]">{{ left[u[0] as 'd' | 'h' | 'm' | 's'] }}</b>
            <span class="text-[10px] tracking-widest text-fg-subtle uppercase">{{ u[1] }}</span>
          </div>
        </div>
      </div>

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
      <div v-if="events.length === 0" class="reveal-block empty-state">
        No events yet &mdash; first drop coming soon.
      </div>

      <div v-else-if="list.length === 0" class="empty-state">
        {{ tab === "upcoming" ? "Nothing scheduled right now — check back soon." : "No past events yet." }}
      </div>

      <div v-else class="flex flex-col border border-border">
        <article
          v-for="e in list"
          :key="e.id"
          class="reveal-block group relative grid grid-cols-[64px_1fr] items-start gap-x-5 gap-y-4 border-b border-border bg-bg p-5 transition-[background-color,padding] duration-300 last:border-b-0 hover:bg-bg-elevated sm:grid-cols-[88px_1fr_auto] sm:items-center sm:gap-x-7 sm:p-7 md:hover:pl-9"
        >
          <span class="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-400 group-hover:scale-y-100" aria-hidden="true" />

          <div class="border border-border-strong px-1 py-2.5 text-center font-mono">
            <span class="block text-[1.5rem] leading-none font-bold">{{ day(e) }}</span>
            <span class="mt-1 block text-[10.5px] tracking-widest text-fg-subtle">{{ month(e) }}</span>
          </div>

          <div class="min-w-0">
            <span v-if="e.tag" class="mb-1.5 block font-mono text-[11px] tracking-wider uppercase" :class="tab === 'past' ? 'text-fg-subtle' : 'text-accent'">{{ e.tag }}</span>
            <h3 class="mb-1.5 text-xl font-semibold">{{ e.title }}</h3>
            <p class="max-w-[56ch] text-sm text-fg-muted">{{ e.description }}</p>
            <div v-if="e.meta?.length" class="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[11.5px] text-fg-subtle uppercase">
              <span v-for="m in e.meta" :key="m">{{ m }}</span>
            </div>
            <img
              v-if="e.image"
              :src="e.image"
              :alt="e.title"
              loading="lazy"
              decoding="async"
              width="640"
              height="360"
              class="mt-4 aspect-video w-full max-w-md border border-border object-cover"
              :class="tab === 'past' && 'grayscale'"
            />
          </div>

          <div v-if="e.link && tab === 'upcoming'" class="col-span-full sm:col-span-1">
            <Badge :href="e.link" size="sm" interactive arrow class="w-full sm:w-auto">RSVP</Badge>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
