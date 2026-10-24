<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import FormField from "../components/hackathon/FormField.vue";
import StackReel from "../components/hackathon/StackReel.vue";
import { chooseProblem, getLatestHackathon, getRegistrationStatus, getTeamResult, rerollStack, submitProject } from "../lib/hackathon/api";
import type { TeamResult } from "../lib/hackathon/types";

const route = useRoute();

// ---- which hackathon ----
const loading = ref(true);
const loadError = ref("");
const slug = ref("");
const eventName = ref("");

async function resolveHackathon() {
  loading.value = true;
  loadError.value = "";
  try {
    const wanted = route.params.slug ? String(route.params.slug) : null;
    if (wanted) {
      const status = await getRegistrationStatus(wanted);
      slug.value = status ? wanted : "";
      eventName.value = status?.name ?? "";
    } else {
      const latest = await getLatestHackathon();
      slug.value = latest?.slug ?? "";
      eventName.value = latest?.name ?? "";
    }
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
onMounted(resolveHackathon);
watch(() => route.params.slug, resolveHackathon);

// ---- lookup ----
const code = ref("");
const leaderReg = ref("");
const looking = ref(false);
const lookupError = ref("");
const result = ref<TeamResult | null>(null);

// ---- draw state ----
// idle: nothing chosen yet. spinning/done: reels running / landed.
const phase = ref<"idle" | "spinning" | "done">("idle");
const landedCount = ref(0);
// Bumped on every new deal so the reels remount and spin again.
const dealId = ref(0);
// True when the page opened on an already-drawn team: show it settled, no spin.
const instant = ref(false);

const selected = ref<number | null>(null);
const changing = ref(false);
const choosing = ref(false);
const rerolling = ref(false);
const chooseError = ref("");

const SPIN_BASE_MS = 1600;
const SPIN_STAGGER_MS = 900;

function show(r: TeamResult, animate: boolean) {
  result.value = r;
  syncSubmission(r);
  submitted.value = false;
  submitError.value = "";
  selected.value = null;
  changing.value = false;
  dealId.value++;
  landedCount.value = 0;
  instant.value = !animate;
  phase.value = r.drawn ? (animate ? "spinning" : "done") : "idle";
  if (r.drawn && !r.stack.length) phase.value = "done";
}

async function lookup() {
  lookupError.value = "";
  if (!/^\d{3}$/.test(code.value.trim())) return (lookupError.value = "Team code is 3 digits.");
  if (!leaderReg.value.trim()) return (lookupError.value = "Enter the team leader's registration number.");
  looking.value = true;
  try {
    show(await getTeamResult(slug.value, code.value.trim(), leaderReg.value.trim()), false);
  } catch (e) {
    lookupError.value = (e as Error).message;
  } finally {
    looking.value = false;
  }
}

function reset() {
  result.value = null;
  code.value = leaderReg.value = "";
  phase.value = "idle";
  chooseError.value = "";
}

async function confirmChoice() {
  if (selected.value === null || !result.value) return;
  const swapping = result.value.drawn;
  if (
    swapping &&
    !confirm("You only get one problem change. It also re-randomizes your stack, and you can't go back. Continue?")
  )
    return;
  choosing.value = true;
  chooseError.value = "";
  try {
    show(await chooseProblem(slug.value, code.value.trim(), leaderReg.value.trim(), selected.value), true);
  } catch (e) {
    chooseError.value = (e as Error).message;
  } finally {
    choosing.value = false;
  }
}

async function confirmReroll() {
  if (!result.value || !confirm("You only get one stack re-roll. Your current stack is lost. Continue?")) return;
  rerolling.value = true;
  chooseError.value = "";
  try {
    show(await rerollStack(slug.value, code.value.trim(), leaderReg.value.trim()), true);
  } catch (e) {
    chooseError.value = (e as Error).message;
  } finally {
    rerolling.value = false;
  }
}

// ---- project submission ----
const githubUrl = ref("");
const vercelUrl = ref("");
const submitting = ref(false);
const submitError = ref("");
const submitted = ref(false);

function syncSubmission(r: TeamResult) {
  githubUrl.value = r.github_url ?? "";
  vercelUrl.value = r.vercel_url ?? "";
}

async function submit() {
  if (!result.value) return;
  submitError.value = "";
  submitted.value = false;
  const gh = githubUrl.value.trim();
  const vc = vercelUrl.value.trim();
  if (!/^https:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(gh))
    return (submitError.value = "Enter a GitHub repository link like https://github.com/user/repo.");
  if (vc && !/^https:\/\/[a-z0-9.-]+\.vercel\.app(\/\S*)?$/i.test(vc))
    return (submitError.value = "The Vercel link should look like https://your-app.vercel.app.");
  submitting.value = true;
  try {
    const r = await submitProject(slug.value, code.value.trim(), leaderReg.value.trim(), gh, vc);
    result.value = r;
    syncSubmission(r);
    submitted.value = true;
  } catch (e) {
    submitError.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}

const reels = computed(() =>
  (result.value?.stack ?? []).map((s, i) => ({
    ...s,
    pool: result.value!.pool[s.layer] ?? [],
    spinMs: SPIN_BASE_MS + i * SPIN_STAGGER_MS,
  })),
);

function onLanded() {
  landedCount.value++;
  if (landedCount.value >= reels.value.length) phase.value = "done";
}

// Problems to offer: all of them on the first pick; every other one when swapping.
const choices = computed(() => (result.value?.problems ?? []).filter((p) => p.id !== result.value?.problem_id));
const canChoose = computed(() => result.value?.roulette_open && phase.value !== "spinning");
const problemChangesLeft = computed(() =>
  result.value ? Math.max(0, result.value.max_problem_changes - result.value.problem_changes) : 0,
);
const rerollsLeft = computed(() =>
  result.value ? Math.max(0, result.value.max_stack_rerolls - result.value.stack_rerolls) : 0,
);
const picking = computed(() => !!result.value && (!result.value.drawn || changing.value));

const announcement = computed(() => {
  if (phase.value !== "done" || !result.value?.drawn) return "";
  const stack = result.value.stack.map((s) => `${s.layer}: ${s.name}`).join(", ");
  return `Your stack. ${stack}. Problem: ${result.value.problem_title ?? "none assigned"}.`;
});
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-3xl">
      <h1 class="page-title mb-4">Stack Roulette</h1>
      <p class="page-sub mb-10">
        {{ eventName ? `${eventName}: ` : "" }}pick your problem statement and the roulette deals the stack your team
        has to build it with. You get one problem change (it re-deals your stack) and one stack re-roll.
      </p>

      <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>

      <div v-else-if="loadError" class="glass-surface px-6 py-10 text-center">
        <p class="font-sans text-sm text-accent" role="alert">{{ loadError }}</p>
        <button type="button" class="mt-4 cursor-pointer border-none bg-transparent p-0" @click="resolveHackathon">
          <Badge as="span" size="sm" interactive>Retry</Badge>
        </button>
      </div>

      <div v-else-if="!slug" class="glass-surface px-6 py-12 text-center">
        <h2 class="font-display text-xl uppercase tracking-tight">No hackathon yet</h2>
        <p class="mt-2 font-sans text-sm text-fg-muted">Come back when the next one is announced.</p>
      </div>

      <!-- Lookup -->
      <form
        v-else-if="!result"
        class="glass-surface relative px-6 py-8 sm:px-10 sm:py-10"
        novalidate
        @submit.prevent="lookup"
      >
        <div class="grid gap-5 sm:grid-cols-2">
          <FormField
            id="rl-code" v-model="code" label="Team code" inputmode="numeric" :maxlength="3"
            autocomplete="off" placeholder="472"
          />
          <FormField
            id="rl-reg" v-model="leaderReg" label="Team leader's registration number" autocomplete="off"
            placeholder="RA2511000000000"
          />
        </div>
        <p v-if="lookupError" class="mt-6 font-sans text-sm text-accent" role="alert">{{ lookupError }}</p>
        <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p class="font-sans text-sm text-fg-muted">
            No team code yet?
            <router-link :to="`/hackathon/${slug}/register`" class="text-fg underline">Register your team</router-link>
          </p>
          <button type="submit" :disabled="looking" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
            <Badge as="span" tone="solid" size="md" interactive arrow>{{ looking ? "Checking…" : "Find my team" }}</Badge>
          </button>
        </div>
      </form>

      <section v-else aria-label="Stack roulette">
        <div class="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-display text-xl uppercase tracking-tight">{{ result.team_name }}</h2>
          <span class="font-mono text-xs uppercase text-fg-muted">
            Team {{ result.team_code }}
          </span>
        </div>

        <!-- Not open and nothing chosen -->
        <div
          v-if="!result.drawn && !result.roulette_open"
          class="glass-surface flex flex-col items-center gap-3 px-6 py-14 text-center"
        >
          <HalftoneMark :size="36" color="var(--color-accent)" />
          <h3 class="font-display text-xl uppercase tracking-tight">Not open yet</h3>
          <p class="max-w-sm font-sans text-sm text-fg-muted">
            The organisers haven't opened problem selection. Check back when they announce it.
          </p>
        </div>

        <!-- Reels (after a pick) -->
        <div v-if="result.drawn" class="grid gap-3 sm:grid-cols-3">
          <StackReel
            v-for="r in reels" :key="`${dealId}-${r.layer}`" :layer="r.layer" :pool="r.pool" :final="r.name"
            :run="true" :instant="instant" :spin-ms="r.spinMs" @landed="onLanded"
          />
        </div>
        <p v-if="phase === 'spinning'" class="mt-8 text-center font-mono text-xs uppercase tracking-wide text-fg-muted">
          Drawing your stack…
        </p>

        <!-- Chosen problem -->
        <Transition name="reveal">
          <div v-if="result.drawn && phase === 'done'" class="glass-surface relative mt-6 overflow-hidden px-6 py-8 sm:px-10">
            <span class="label">Your problem</span>
            <p class="mt-3 font-display text-2xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
              {{ result.problem_title }}
            </p>
            <p v-if="result.problem_gist" class="mt-3 font-sans text-sm text-fg-muted">{{ result.problem_gist }}</p>
            <div v-if="canChoose && !changing" class="mt-6 flex flex-wrap items-center gap-3">
              <button
                v-if="problemChangesLeft && choices.length" type="button"
                class="cursor-pointer border-none bg-transparent p-0" @click="changing = true"
              >
                <Badge as="span" size="sm" interactive class="border-accent!">
                  Change problem · re-deals stack · {{ problemChangesLeft }} left
                </Badge>
              </button>
              <button
                v-if="rerollsLeft" type="button" :disabled="rerolling"
                class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="confirmReroll"
              >
                <Badge as="span" size="sm" interactive class="border-accent!">
                  {{ rerolling ? "Re-rolling…" : `Re-roll stack only · ${rerollsLeft} left` }}
                </Badge>
              </button>
              <span v-if="!problemChangesLeft && !rerollsLeft" class="font-sans text-xs text-fg-subtle">
                No changes left. This is final.
              </span>
            </div>
            <p v-if="chooseError && !picking" class="mt-4 font-sans text-sm text-accent" role="alert">{{ chooseError }}</p>
          </div>
        </Transition>

        <!-- Picker: first pick, or swapping -->
        <div v-if="picking && canChoose" class="mt-6">
          <h3 class="mb-3 font-display text-sm uppercase tracking-tight">
            {{ result.drawn ? "Pick a different problem" : "Pick your problem statement" }}
          </h3>
          <p v-if="result.drawn" class="mb-3 font-sans text-xs text-accent">
            Warning: your current stack is thrown away and a new one is dealt.
          </p>
          <fieldset class="grid gap-3 sm:grid-cols-2">
            <legend class="sr-only">Problem statements</legend>
            <label
              v-for="p in choices" :key="p.id"
              class="glass-surface flex cursor-pointer flex-col gap-1 p-4 transition-[border-color] duration-200 has-checked:border-accent!"
            >
              <input v-model="selected" type="radio" name="problem" :value="p.id" class="sr-only" />
              <span class="font-display text-sm uppercase tracking-tight">{{ p.title }}</span>
              <span v-if="p.gist" class="font-sans text-xs text-fg-muted">{{ p.gist }}</span>
            </label>
          </fieldset>
          <p v-if="!choices.length" class="font-sans text-sm text-fg-muted">No problem statements are available.</p>
          <p v-if="chooseError" class="mt-4 font-sans text-sm text-accent" role="alert">{{ chooseError }}</p>
          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              v-if="changing" type="button" class="cursor-pointer border-none bg-transparent p-0"
              @click="changing = false"
            >
              <Badge as="span" size="md" interactive>Keep current</Badge>
            </button>
            <span v-else />
            <button
              type="button" :disabled="selected === null || choosing"
              class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
              @click="confirmChoice"
            >
              <Badge as="span" tone="solid" size="lg" interactive arrow>
                {{ choosing ? "Drawing…" : result.drawn ? "Switch & re-draw stack" : "Lock in & draw the stack" }}
              </Badge>
            </button>
          </div>
        </div>

        <!-- Project submission -->
        <form class="glass-surface mt-6 px-6 py-8 sm:px-10" novalidate @submit.prevent="submit">
          <span class="label">Submit your project</span>
          <p class="mt-3 font-sans text-sm text-fg-muted">
            Team {{ result.team_code }}: add your GitHub repo{{ result.github_url ? " (resubmitting replaces it)" : "" }}.
            The Vercel deployment is optional.
          </p>
          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField
              id="sub-gh" v-model="githubUrl" label="GitHub repository" type="url" autocomplete="off"
              placeholder="https://github.com/user/repo"
            />
            <FormField
              id="sub-vc" v-model="vercelUrl" label="Vercel deployment (optional)" type="url" autocomplete="off"
              placeholder="https://your-app.vercel.app"
            />
          </div>
          <p v-if="submitError" class="mt-4 font-sans text-sm text-accent" role="alert">{{ submitError }}</p>
          <p v-else-if="submitted" class="mt-4 font-sans text-sm text-fg" role="status">Saved. You can resubmit any time to update it.</p>
          <div class="mt-6 flex justify-end">
            <button type="submit" :disabled="submitting" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
              <Badge as="span" tone="solid" size="md" interactive arrow>{{ submitting ? "Saving…" : result.github_url ? "Update submission" : "Submit" }}</Badge>
            </button>
          </div>
        </form>

        <button type="button" class="mt-8 cursor-pointer border-none bg-transparent p-0 font-sans text-xs text-fg-subtle underline" @click="reset">
          Not your team?
        </button>

        <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
      </section>
    </div>
    <GridBar class="mt-24" />
  </div>
</template>

<style scoped>
.reveal-enter-active {
  transition:
    opacity 0.6s var(--ease-mechanical),
    transform 0.6s var(--ease-mechanical);
}
.reveal-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-enter-active {
    transition: none;
  }
}
</style>
