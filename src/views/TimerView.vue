<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import FormField from "../components/hackathon/FormField.vue";

const route = useRoute();
const router = useRouter();

// The timer lives entirely in the URL (?to=ISO&start=ISO&title=...) so a link
// can be shared or put on a projector without any backend.
function parseTime(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

const target = computed(() => parseTime(route.query.to));
const start = computed(() => parseTime(route.query.start));
const title = computed(() => (typeof route.query.title === "string" ? route.query.title : ""));

// ---- ticking ----
const now = ref(Date.now());
let tick: number | undefined;
onMounted(() => {
  tick = window.setInterval(() => (now.value = Date.now()), 250);
  document.addEventListener("fullscreenchange", onFsChange);
});
onBeforeUnmount(() => {
  window.clearInterval(tick);
  document.removeEventListener("fullscreenchange", onFsChange);
});

const remaining = computed(() => (target.value === null ? 0 : Math.max(0, target.value - now.value)));
const finished = computed(() => target.value !== null && remaining.value === 0);

const pad = (n: number) => String(n).padStart(2, "0");
const parts = computed(() => {
  const total = Math.ceil(remaining.value / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const units = [
    { label: "Days", value: pad(days) },
    { label: "Hours", value: pad(hours) },
    { label: "Minutes", value: pad(minutes) },
    { label: "Seconds", value: pad(seconds) },
  ];
  // Hide days when there are none, so a 36h hackathon gets bigger digits.
  return days > 0 ? units : units.slice(1);
});

const progress = computed(() => {
  if (start.value === null || target.value === null || target.value <= start.value) return null;
  return Math.min(1, Math.max(0, (now.value - start.value) / (target.value - start.value)));
});

const urgent = computed(() => !finished.value && remaining.value <= 10 * 60 * 1000);

// Reflect the countdown in the tab title so it's glanceable from another tab.
const tabTime = computed(() => parts.value.map((p) => p.value).join(":"));
watchTitle();
function watchTitle() {
  const base = document.title;
  const stop = setInterval(() => {
    document.title = target.value === null ? base : finished.value ? "Time's up — Logic Play" : `${tabTime.value} — Logic Play`;
  }, 500);
  onBeforeUnmount(() => {
    clearInterval(stop);
    document.title = base;
  });
}

// ---- setup form ----
const PRESETS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "12h", hours: 12 },
  { label: "24h", hours: 24 },
  { label: "36h", hours: 36 },
  { label: "48h", hours: 48 },
];

const formTitle = ref("");
const mode = ref<"duration" | "date">("duration");
const hours = ref("24");
const minutes = ref("0");
const dateValue = ref("");
const formError = ref("");

function pickPreset(h: number) {
  mode.value = "duration";
  hours.value = String(h);
  minutes.value = "0";
}

function startTimer() {
  formError.value = "";
  const startMs = Date.now();
  let targetMs: number;
  if (mode.value === "duration") {
    const h = Number(hours.value || 0);
    const m = Number(minutes.value || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0 || h + m === 0) {
      formError.value = "Enter a duration greater than zero.";
      return;
    }
    targetMs = startMs + (h * 60 + m) * 60 * 1000;
  } else {
    targetMs = dateValue.value ? new Date(dateValue.value).getTime() : NaN;
    if (!Number.isFinite(targetMs) || targetMs <= startMs) {
      formError.value = "Pick a date and time in the future.";
      return;
    }
  }
  const query: Record<string, string> = {
    to: new Date(targetMs).toISOString(),
    start: new Date(startMs).toISOString(),
  };
  if (formTitle.value.trim()) query.title = formTitle.value.trim();
  router.push({ name: "timer", query });
}

function reset() {
  if (document.fullscreenElement) document.exitFullscreen();
  router.push({ name: "timer" });
}

// ---- display controls ----
const stage = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
function onFsChange() {
  isFullscreen.value = !!document.fullscreenElement;
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else stage.value?.requestFullscreen?.();
}

const copied = ref(false);
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard blocked; the URL bar still has the link */
  }
}

const endsAt = computed(() =>
  target.value === null
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(target.value),
);
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <!-- Setup -->
    <div v-if="target === null" class="mx-auto max-w-3xl">
      <h1 class="page-title mb-4">Countdown Timer</h1>
      <p class="page-sub mb-10">
        Set up a countdown for a hackathon or any event. You get a shareable link and a fullscreen mode for the projector.
      </p>

      <form class="glass-surface relative px-6 py-8 sm:px-10 sm:py-10" novalidate @submit.prevent="startTimer">
        <FormField id="tm-title" v-model="formTitle" label="Title (optional)" placeholder="Logic Play Hackathon" autocomplete="off" />

        <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Mode">
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="mode = 'duration'">
            <Badge as="span" size="sm" :tone="mode === 'duration' ? 'solid' : 'glass'">Duration</Badge>
          </button>
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="mode = 'date'">
            <Badge as="span" size="sm" :tone="mode === 'date' ? 'solid' : 'glass'">Specific time</Badge>
          </button>
        </div>

        <div v-if="mode === 'duration'" class="mt-6">
          <div class="mb-5 flex flex-wrap gap-2">
            <button
              v-for="p in PRESETS" :key="p.label" type="button"
              class="cursor-pointer border-none bg-transparent p-0" @click="pickPreset(p.hours)"
            >
              <Badge as="span" size="sm" interactive>{{ p.label }}</Badge>
            </button>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <FormField id="tm-hours" v-model="hours" label="Hours" inputmode="numeric" autocomplete="off" />
            <FormField id="tm-mins" v-model="minutes" label="Minutes" inputmode="numeric" autocomplete="off" />
          </div>
        </div>

        <div v-else class="mt-6">
          <label for="tm-date" class="mb-2 block font-mono text-xs uppercase tracking-wide text-fg-muted">Ends at</label>
          <input
            id="tm-date" v-model="dateValue" type="datetime-local"
            class="glass-surface w-full bg-transparent px-4 py-3 font-sans text-sm text-fg"
          />
        </div>

        <p v-if="formError" class="mt-6 font-sans text-sm text-accent" role="alert">{{ formError }}</p>
        <div class="mt-8 flex justify-end">
          <button type="submit" class="cursor-pointer border-none bg-transparent p-0">
            <Badge as="span" tone="solid" size="md" interactive arrow>Start countdown</Badge>
          </button>
        </div>
      </form>
    </div>

    <!-- Countdown -->
    <section
      v-else
      ref="stage"
      aria-label="Countdown"
      class="relative flex flex-col justify-between gap-10 bg-bg"
      :class="isFullscreen ? 'min-h-svh p-8 sm:p-14' : 'glass-surface min-h-[60svh] px-6 py-8 sm:px-12 sm:py-12'"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h1 class="font-display text-xl font-black uppercase tracking-tight sm:text-3xl">{{ title || "Countdown" }}</h1>
        <span class="font-mono text-xs uppercase text-fg-muted">Ends {{ endsAt }}</span>
      </div>

      <div v-if="finished" class="text-center" role="status">
        <p class="font-display font-black uppercase leading-none tracking-tighter text-accent text-[clamp(3rem,16vw,12rem)]">
          Time's up
        </p>
        <p class="mt-4 font-mono text-sm uppercase text-fg-muted">Pencils down. Submit what you've got.</p>
      </div>

      <div v-else class="flex items-start justify-center gap-3 sm:gap-8" role="timer" aria-live="off">
        <template v-for="(p, i) in parts" :key="p.label">
          <span
            v-if="i > 0" aria-hidden="true"
            class="font-display font-black leading-none text-fg-muted text-[clamp(2.5rem,12vw,10rem)]"
          >:</span>
          <div class="flex flex-col items-center">
            <span
              class="font-display font-black leading-none tabular-nums tracking-tighter text-[clamp(2.5rem,12vw,10rem)]"
              :class="urgent ? 'text-accent' : 'text-fg'"
            >{{ p.value }}</span>
            <span class="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted sm:text-xs">{{ p.label }}</span>
          </div>
        </template>
      </div>

      <div>
        <div v-if="progress !== null" class="mb-6 h-px w-full bg-border" aria-hidden="true">
          <div class="h-px bg-accent" :style="{ width: `${progress * 100}%` }" />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="toggleFullscreen">
            <Badge as="span" size="sm" interactive>{{ isFullscreen ? "Exit fullscreen" : "Fullscreen" }}</Badge>
          </button>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="copyLink">
              <Badge as="span" size="sm" interactive>{{ copied ? "Copied" : "Copy link" }}</Badge>
            </button>
            <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="reset">
              <Badge as="span" size="sm" interactive>New timer</Badge>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
