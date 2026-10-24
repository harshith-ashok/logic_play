<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import FormField from "../components/hackathon/FormField.vue";
import { useAuth } from "../composables/useAuth";
import { useSharedTimer } from "../composables/useSharedTimer";

const route = useRoute();
const router = useRouter();
const { profile } = useAuth();
const isAdmin = computed(() => profile.value?.role === "core_team");

// /timer/:slug shows that timer; bare /timer shows the most recently changed one.
const slug = computed(() => (route.params.slug ? String(route.params.slug) : undefined));
const { timer, loading, error, remaining, progress, paused, finished, create, pause, resume, extend, remove } =
  useSharedTimer(slug);

const title = computed(() => timer.value?.title ?? "");
const busy = ref(false);
const actionError = ref("");
async function act(fn: () => Promise<string>) {
  busy.value = true;
  actionError.value = await fn();
  busy.value = false;
}

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

const urgent = computed(() => !finished.value && !paused.value && remaining.value <= 10 * 60 * 1000);

// Reflect the countdown in the tab title so it's glanceable from another tab.
const baseTitle = document.title;
watch([parts, finished, timer], () => {
  document.title = !timer.value
    ? baseTitle
    : finished.value
      ? "Time's up — Logic Play"
      : `${parts.value.map((p) => p.value).join(":")} — Logic Play`;
});
onBeforeUnmount(() => {
  document.title = baseTitle;
  document.removeEventListener("fullscreenchange", onFsChange);
});
onMounted(() => document.addEventListener("fullscreenchange", onFsChange));

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

const formSlug = ref("");
const slugOk = (v: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= 60;
const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function startTimer() {
  formError.value = "";
  const name = formTitle.value.trim();
  const id = formSlug.value.trim() || slugify(name) || "main";
  if (!slugOk(id)) {
    formError.value = "Link name can only use lowercase letters, numbers and dashes.";
    return;
  }
  let duration = 0;
  let endsAt: number | undefined;
  if (mode.value === "duration") {
    const h = Number(hours.value || 0);
    const m = Number(minutes.value || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0 || h + m === 0) {
      formError.value = "Enter a duration greater than zero.";
      return;
    }
    duration = (h * 60 + m) * 60 * 1000;
  } else {
    endsAt = dateValue.value ? new Date(dateValue.value).getTime() : NaN;
    if (!Number.isFinite(endsAt) || endsAt <= Date.now()) {
      formError.value = "Pick a date and time in the future.";
      return;
    }
  }
  busy.value = true;
  const err = await create(id, name, duration, endsAt);
  busy.value = false;
  if (err) {
    formError.value = err;
    return;
  }
  creating.value = false;
  router.push({ name: "timer", params: { slug: id } });
}

const creating = ref(false);
function newTimer() {
  if (document.fullscreenElement) document.exitFullscreen();
  creating.value = true;
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
  timer.value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timer.value.ends_at))
    : "",
);
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>

    <div v-else-if="error" class="glass-surface mx-auto max-w-3xl px-6 py-10 text-center">
      <p class="font-sans text-sm text-accent" role="alert">{{ error }}</p>
    </div>

    <!-- Setup (core team only) -->
    <div v-else-if="creating || !timer" class="mx-auto max-w-3xl">
      <h1 class="page-title mb-4">Countdown Timer</h1>

      <div v-if="!isAdmin" class="glass-surface px-6 py-12 text-center">
        <h2 class="font-display text-xl uppercase tracking-tight">No timer running</h2>
        <p class="mt-2 font-sans text-sm text-fg-muted">The core team hasn't started one yet. This page updates by itself when they do.</p>
      </div>

      <template v-else>
        <p class="page-sub mb-10">
          Starts one clock that every open page shows in sync. Share the link; changes reach everyone instantly.
        </p>
        <form class="glass-surface relative px-6 py-8 sm:px-10 sm:py-10" novalidate @submit.prevent="startTimer">
          <div class="grid gap-5 sm:grid-cols-2">
            <FormField id="tm-title" v-model="formTitle" label="Title (optional)" placeholder="Logic Play Hackathon" autocomplete="off" />
            <FormField id="tm-slug" v-model="formSlug" label="Link name (optional)" placeholder="hackathon" hint="logicplay.../timer/hackathon" autocomplete="off" />
          </div>

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
          <div class="mt-8 flex items-center justify-end gap-3">
            <button v-if="timer" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="creating = false">
              <Badge as="span" size="sm" interactive>Cancel</Badge>
            </button>
            <button type="submit" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
              <Badge as="span" tone="solid" size="md" interactive arrow>{{ busy ? "Starting…" : "Start countdown" }}</Badge>
            </button>
          </div>
        </form>
      </template>
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
        <span class="font-mono text-xs uppercase text-fg-muted">
          {{ paused ? "Paused" : `Ends ${endsAt}` }}
        </span>
      </div>

      <div v-if="finished" class="text-center" role="status">
        <p class="font-display font-black uppercase leading-none tracking-tighter text-accent text-[clamp(3rem,16vw,12rem)]">
          Time's up
        </p>
        <p class="mt-4 font-mono text-sm uppercase text-fg-muted">Pencils down. Submit what you've got.</p>
      </div>

      <div
        v-else class="flex items-start justify-center gap-3 sm:gap-8"
        :class="paused && 'opacity-50'" role="timer" aria-live="off"
      >
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
        <p v-if="actionError" class="mb-4 font-sans text-sm text-accent" role="alert">{{ actionError }}</p>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="toggleFullscreen">
              <Badge as="span" size="sm" interactive>{{ isFullscreen ? "Exit fullscreen" : "Fullscreen" }}</Badge>
            </button>
            <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="copyLink">
              <Badge as="span" size="sm" interactive>{{ copied ? "Copied" : "Copy link" }}</Badge>
            </button>
          </div>
          <div v-if="isAdmin" class="flex flex-wrap gap-2">
            <button
              v-if="!finished" type="button" :disabled="busy"
              class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
              @click="act(paused ? resume : pause)"
            >
              <Badge as="span" size="sm" interactive>{{ paused ? "Resume" : "Pause" }}</Badge>
            </button>
            <button type="button" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="act(() => extend(5 * 60 * 1000))">
              <Badge as="span" size="sm" interactive>+5 min</Badge>
            </button>
            <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="newTimer">
              <Badge as="span" size="sm" interactive>New timer</Badge>
            </button>
            <button type="button" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="act(remove)">
              <Badge as="span" size="sm" interactive>Delete</Badge>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
